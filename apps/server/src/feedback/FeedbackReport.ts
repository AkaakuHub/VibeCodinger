import { AgentFeedbackKind, AgentFeedbackTrace } from "@vibecodinger/contracts";
import { resolveT3McpToolId } from "@vibecodinger/shared/t3McpToolPresentation";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Struct from "effect/Struct";

// Code points, as the scrubber caps them, so a valid input stays a valid report after redaction.
const FeedbackText = Schema.String.check(Schema.isMaxCodePoints(300));

/** Turns the outline of a requested report covers at least. */
export const FEEDBACK_TRACE_TURNS = 5;

const reportFields = {
  kind: AgentFeedbackKind,
  subject: Schema.String.annotate({
    description: "Tool name, `vibecodinger` command, or `general`.",
  }),
  expected: FeedbackText,
  actual: FeedbackText,
  workaround: FeedbackText.annotate({ description: "What you did instead, or empty." }),
  // Annotate before the default: an annotation after it never reaches the JSON schema.
  userRequested: Schema.Boolean.annotate({ description: "The user asked for this report." }).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(false)),
  ),
};

export const FeedbackInput = Schema.Struct({
  ...reportFields,
  turns: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1))
    .annotate({
      description: "How many recent turns, counting this one, the problem spans.",
    })
    .pipe(Schema.withDecodingDefaultKey(Effect.succeed(1))),
});

export const FeedbackTrace = AgentFeedbackTrace;
export type FeedbackTrace = AgentFeedbackTrace;

const storedFields = {
  id: Schema.String,
  threadId: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
  source: Schema.Literals(["mcp", "cli"]),
  sent: Schema.Boolean,
};

export const FeedbackReport = Schema.Struct({
  ...reportFields,
  ...storedFields,
  trace: Schema.NullOr(FeedbackTrace),
});

/** What `t3_feedback` answers: the report, with only the size of what its trace attached. */
export const FeedbackSubmitResult = Schema.Struct({
  ...reportFields,
  ...storedFields,
  trace: Schema.NullOr(FeedbackTrace.mapFields(Struct.omit(["entries"]))),
});

export const FEEDBACK_AWAITING_APPROVAL_NOTE =
  "The user sees this report in a card and chooses there whether to send it and whether to include the conversation. Nothing is sent until they do, and you will not learn their choice. Do not wait for it or send it another way. Call again only if the user asks to change it; that shows a new card.";

/** What `t3_feedback` answers for a requested report: shown to the user, not yet sent. */
export const FeedbackAwaitingApproval = Schema.Struct({
  status: Schema.Literal("awaiting_approval"),
  note: Schema.String,
});
export type FeedbackAwaitingApproval = typeof FeedbackAwaitingApproval.Type;

export const FEEDBACK_OFF_MESSAGE =
  "Agent feedback is off. Turn it on in VibeCodinger under Settings > Labs, then try again.";

export class FeedbackOffError extends Schema.TaggedError<FeedbackOffError>()(
  "FeedbackOffError",
  {},
) {
  override get message() {
    return FEEDBACK_OFF_MESSAGE;
  }
}

export type FeedbackSource = "mcp" | "cli";

// Requested reports count when their card is shown, unprompted ones when stored.
export const MAX_REPORTS_PER_TURN = 3;
// Reports from no turn, such as `vibecodinger feedback`, have no turn to count in.
export const MAX_REPORTS_OUTSIDE_TURNS_PER_HOUR = 10;

export class FeedbackLimitError extends Schema.TaggedError<FeedbackLimitError>()(
  "FeedbackLimitError",
  { scope: Schema.Literals(["turn", "hour", "cards"]) },
) {
  override get message() {
    switch (this.scope) {
      case "turn":
        return `This turn already sent ${MAX_REPORTS_PER_TURN} agent feedback reports; nothing was sent.`;
      case "cards":
        return `This turn already showed the user ${MAX_REPORTS_PER_TURN} agent feedback reports to approve; nothing was shown.`;
      case "hour":
        return `This machine already sent ${MAX_REPORTS_OUTSIDE_TURNS_PER_HOUR} agent feedback reports outside a turn in the last hour; nothing was sent.`;
    }
  }
}

export class FeedbackNotRequestedError extends Schema.TaggedError<FeedbackNotRequestedError>()(
  "FeedbackNotRequestedError",
  { source: Schema.Literals(["mcp", "cli"]) },
) {
  override get message() {
    return this.source === "cli"
      ? "Agent feedback is set to When I ask: ask your agent in a thread to send it, so you can approve what is sent."
      : "Agent feedback is set to When I ask: send a report only when the user asks for one.";
  }
}

export class FeedbackStorageError extends Schema.TaggedError<FeedbackStorageError>()(
  "FeedbackStorageError",
  { cause: Schema.Defect() },
) {
  override get message() {
    return "Could not save agent feedback.";
  }
}

/** The MCP client label `vibecodinger feedback` signs in with, so its reports count as `cli`. */
export const FEEDBACK_CLI_CLIENT_LABEL = "vibecodinger feedback cli";

/** Listed `vibecodinger` command paths a report may name. A CLI test keeps this in step with binCli. */
export const T3_CLI_COMMANDS: ReadonlyArray<string> = [
  "vibecodinger",
  "vibecodinger help",
  "vibecodinger serve",
  "vibecodinger app",
  "vibecodinger pair",
  "vibecodinger auth",
  "vibecodinger auth connect-device",
  "vibecodinger auth connect-device approve",
  "vibecodinger auth connect-device list",
  "vibecodinger auth connect-device revoke",
  "vibecodinger auth pairing",
  "vibecodinger auth pairing create",
  "vibecodinger auth pairing list",
  "vibecodinger auth pairing revoke",
  "vibecodinger auth session",
  "vibecodinger auth session issue",
  "vibecodinger auth session list",
  "vibecodinger auth session revoke",
  "vibecodinger environment",
  "vibecodinger environment link",
  "vibecodinger environment list",
  "vibecodinger environment unlink",
  "vibecodinger browser",
  "vibecodinger browser setup",
  "vibecodinger project",
  "vibecodinger project add",
  "vibecodinger project remove",
  "vibecodinger project rename",
  "vibecodinger thread",
  "vibecodinger thread list",
  "vibecodinger thread start",
  "vibecodinger thread send",
  "vibecodinger thread show",
  "vibecodinger feedback",
  "vibecodinger feedback list",
  "vibecodinger workflow",
  "vibecodinger workflow start",
  "vibecodinger workflow list",
  "vibecodinger workflow show",
  "vibecodinger workflow resume",
  "vibecodinger workflow cancel",
  "vibecodinger workflow signal",
  "vibecodinger workflow questions",
  "vibecodinger workflow hooks",
  "vibecodinger workflow store",
  "vibecodinger workflow store list",
  "vibecodinger workflow store set",
  "vibecodinger workflow store delete",
  "vibecodinger up",
  "vibecodinger status",
  "vibecodinger service",
  "vibecodinger service install",
  "vibecodinger service restart",
  "vibecodinger service uninstall",
  "vibecodinger service status",
  "vibecodinger service protect",
  "vibecodinger update",
  "vibecodinger install",
  "vibecodinger uninstall",
  "vibecodinger theme",
  "vibecodinger theme set",
  "vibecodinger theme clear",
  "vibecodinger theme show",
  "vibecodinger trace",
  "vibecodinger trace summary",
  "vibecodinger doctor",
  "vibecodinger policy",
  "vibecodinger policy show",
  "vibecodinger policy check",
  "vibecodinger policy templates",
  "vibecodinger policy settings",
  "vibecodinger triage",
];

export type FeedbackInput = typeof FeedbackInput.Type;
export type FeedbackReport = typeof FeedbackReport.Type;

export const FEEDBACK_SUBJECT_MESSAGE =
  "Set subject to the exact tool name, the vibecodinger command, or `general`.";

// The shared resolver knows the presented tools; the prefix covers the rest, such as these.
// Codex also registers `t3-code-direct` for T3 tools it keeps out of Code Mode.
const T3_PREFIX =
  /^(?:mcp__t3[-_]?code(?:[-_]direct)?__|vibecodinger[-_]?code(?:[-_]direct)?[.:/])/iu;

/** The bare name of a registered T3 tool however a provider prefixed it, else undefined. */
export const resolveT3ToolName = (name: string, toolNames: ReadonlyArray<string>) => {
  const tool = resolveT3McpToolId(name) ?? name.replace(T3_PREFIX, "");
  if (toolNames.includes(tool)) return tool;
  // OpenCode 2 prefixes tools with `t3-code-<thread>_`, underscores and all: the longest name wins.
  if (!/^t3-code-/iu.test(name)) return undefined;
  return toolNames
    .filter((candidate) => name.endsWith(`_${candidate}`))
    .toSorted((a, b) => b.length - a.length)[0];
};

/** The stored subject, or undefined when the value names no T3 tool, `vibecodinger` command, or `general`. */
export const resolveFeedbackSubject = (value: string, toolNames: ReadonlyArray<string>) => {
  const subject = value.trim();
  if (subject === "general" || T3_CLI_COMMANDS.includes(subject)) return subject;
  return resolveT3ToolName(subject, toolNames);
};
