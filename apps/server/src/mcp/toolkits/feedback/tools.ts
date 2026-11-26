import { OrchestratorMcpFailure } from "@vibecodinger/contracts";
import * as Schema from "effect/Schema";
import { McpSchema, Tool, Toolkit } from "effect/ai";

import {
  FeedbackAwaitingApproval,
  FeedbackInput,
  FeedbackSubmitResult,
} from "../../../feedback/FeedbackReport.ts";
import * as Feedback from "../../../feedback/FeedbackService.ts";
import * as ThreadManagementService from "../../../orchestration-v2/ThreadManagementService.ts";
import * as McpInvocationContext from "../../McpInvocationContext.ts";

const shared = {
  failure: OrchestratorMcpFailure,
  failureMode: "return" as const,
  dependencies: [
    Feedback.FeedbackService,
    McpInvocationContext.McpInvocationContext,
    ThreadManagementService.ThreadManagementService,
  ],
};

export const FeedbackToolkit = Toolkit.make(
  Tool.make("vc_feedback", {
    ...shared,
    description:
      "Save VibeCodinger feedback on this machine: broken tools or commands, confusing instructions, missing capabilities, or other product feedback. Use your own words and exclude the user's messages, code, files, and names. When asked, call directly to open an approval card where the user chooses whether to include the selected turns. Never paste the conversation into the report.",
    parameters: FeedbackInput,
    success: Schema.Union([FeedbackSubmitResult, FeedbackAwaitingApproval]),
  })
    .annotate(Tool.Destructive, false)
    .annotate(McpSchema.EnabledWhen, McpInvocationContext.hiddenWhileFeedbackOff),
);
