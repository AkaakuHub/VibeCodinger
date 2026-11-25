import { thrownErrorMessage } from "@t3tools/client-runtime/errors";
import { useAtomValue } from "@effect/atom-react";
import {
  managedCapabilityDenial,
  managedRuntimeModeDenial,
} from "@t3tools/client-runtime/contract-labels";
import { offersLinkedEnvironments } from "@t3tools/client-runtime/link-request";
import {
  AuthAccessWriteScope,
  AuthMcpClientAccess,
  type EnvironmentId,
  mcpClientScopes,
  sessionGrantsScope,
} from "@t3tools/contracts";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, CopyIcon } from "lucide-react";
import * as Option from "effect/Option";
import { Atom } from "effect/reactivity";
import * as Result from "effect/Result";
import { msg, T, useGT, useMessages, Var } from "gt-react";
import { m } from "~/i18n/messages";
import { type ReactNode, useState } from "react";

import { namedClipboardTarget, useCopyToClipboard } from "~/hooks/useCopyToClipboard";
import { useNowSecond } from "~/hooks/useNowSecond";
import { readLocalApi } from "~/localApi";
import { appAtomRegistry } from "~/rpc/atomRegistry";
import { type EnvironmentPresentation, useEnvironmentIdentities } from "~/state/environments";
import { useManagedPolicy } from "~/state/managedPolicy";
import { mintMcpApprovalCodeOn } from "~/state/peerPairingCode";
import { peerLinkEnvironment } from "~/state/peerLinks";
import { useEnvironmentQuery } from "~/state/query";
import {
  useEnvironmentScope,
  useEnvironmentSessionState,
  usePreparedConnection,
} from "~/state/session";
import { CommandBlock } from "../CommandBlock";
import { AccessOption, accessConfig } from "../auth/ConnectAgentSurface";
import { useAccessEnvironment } from "../settings/useAccessEnvironment";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { RadioGroup } from "../ui/radio-group";
import { Spinner } from "../ui/spinner";
import { toastManager } from "../ui/toast";
import { WizardFooter, WizardHeader, WizardPanel, WizardPopup, WizardSteps } from "../ui/wizard";
import { resolveMcpGate } from "./mcpGate";
import { MCP_APPS, type McpApp, OTHER_MCP_APP_STEPS } from "./mcpApps";

const requestAtom = Atom.make<{ readonly environmentId: EnvironmentId | null } | null>(null).pipe(
  Atom.keepAlive,
  Atom.withLabel("mcp:use-in-another-app"),
);

/** Opens the wizard for `environmentId`, or for the one Sharing & access picks when null. */
export function openUseInAnotherApp(environmentId: EnvironmentId | null): void {
  appAtomRegistry.set(requestAtom, { environmentId });
}

const close = () => appAtomRegistry.set(requestAtom, null);

/** Hosted once at the root, so Cmd-K and Settings can open it from anywhere. */
export function UseInAnotherAppDialogHost() {
  const request = useAtomValue(requestAtom);
  return request === null ? null : <UseInAnotherAppDialog requested={request.environmentId} />;
}

function UseInAnotherAppDialog({ requested }: { readonly requested: EnvironmentId | null }) {
  const { environment, label } = useAccessEnvironment(requested);
  const gt = useGT();
  const title = `${gt("Use VibeCodinger in another app (MCP)")} · ${label ?? "VibeCodinger"}`;
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <WizardPopup>
        {environment !== null ? (
          <Wizard key={environment.environmentId} environment={environment} title={title} />
        ) : (
          <>
            <WizardHeader title={title} />
            <WizardPanel>
              <p>
                <T>Connect to an environment first.</T>
              </p>
            </WizardPanel>
          </>
        )}
      </WizardPopup>
    </Dialog>
  );
}

const STEPS = [
  msg("App", { $context: "wizard step: choose the app" }),
  msg("Access", { $context: "wizard step: choose the access level" }),
  msg("Connect", { $context: "wizard step: connect the app" }),
] as const;
const SERVER_APPROVAL_STEPS = [STEPS[0], STEPS[2]] as const;
type Step = 0 | 1 | 2;
type Choice = McpApp | "other";

function Wizard({
  environment,
  title,
}: {
  readonly environment: EnvironmentPresentation;
  readonly title: string;
}) {
  const gt = useGT();
  const m = useMessages();
  const connection = usePreparedConnection(environment.environmentId);
  const gate = resolveMcpGate({
    connected: environment.connection.phase === "connected",
    approvalCodes:
      environment.serverConfig === null
        ? undefined
        : environment.serverConfig.environment.capabilities.mcpApprovalCodes === true,
    connection: Option.getOrNull(connection),
  });
  const levels = useGrantableLevels(environment);
  const [step, setStep] = useState<Step>(0);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [picked, setPicked] = useState<AuthMcpClientAccess | null>(null);
  const access = picked ?? DEFAULT_LEVELS.find((level) => levels.get(level) === undefined) ?? null;
  const open = gate.kind === "open";
  // The level is picked on the sign-in page, so the wizard neither asks for it nor needs a code.
  const serverApproval =
    environment.serverConfig?.environment.capabilities.mcpHostedApproval === true;
  const steps = serverApproval ? SERVER_APPROVAL_STEPS : STEPS;
  const shownStep = serverApproval && step === 2 ? 1 : step;
  const next = () => setStep(step === 0 ? (serverApproval ? 2 : 1) : 2);
  const levelsHeading =
    choice === null || choice === "other"
      ? gt("What can the app do?")
      : gt("What can {app} do?", { app: choice.name });
  return (
    <>
      <WizardHeader title={title}>
        {open ? (
          <WizardSteps
            steps={steps.map((label) => m(label))}
            currentStep={shownStep}
            isStepDisabled={(index) => index > shownStep}
            onStepChange={(index) => setStep(serverApproval && index === 1 ? 2 : (index as Step))}
          />
        ) : null}
      </WizardHeader>
      <WizardPanel>
        {gate.kind !== "open" ? (
          gate.kind === "checking" ? (
            <div role="status" aria-label={gt("Connecting…")}>
              <Spinner size="sm" tone="muted" />
            </div>
          ) : (
            <p>
              {gate.kind === "disconnected"
                ? gt("Connect to {environment} first.", { environment: environment.label })
                : gate.kind === "update"
                  ? gt("Update VibeCodinger on {environment}", { environment: environment.label })
                  : gt("A direct HTTPS connection is required.")}
            </p>
          )
        ) : step === 0 ? (
          <AppStep choice={choice} onChoose={setChoice} />
        ) : step === 1 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-medium">{levelsHeading}</h3>
            <RadioGroup
              aria-label={levelsHeading}
              value={access}
              onValueChange={(value) => setPicked(value as AuthMcpClientAccess)}
            >
              {AuthMcpClientAccess.literals.map((level) => (
                <AccessOption
                  key={level}
                  access={level}
                  selected={level === access}
                  disabledReason={levels.get(level)}
                  description={
                    level === "full-access"
                      ? gt("Runs commands and edits files without asking")
                      : null
                  }
                />
              ))}
            </RadioGroup>
          </section>
        ) : choice !== null && (serverApproval || access !== null) ? (
          <ConnectStep
            environment={environment}
            mcpUrl={gate.mcpUrl}
            choice={choice}
            access={serverApproval ? null : access}
          />
        ) : null}
      </WizardPanel>
      {open ? (
        <WizardFooter
          leading={step === 2 ? <ManageAccessButton environment={environment} /> : undefined}
        >
          {step === 1 ? (
            <Button variant="outline" onClick={() => setStep(0)}>
              <T>Back</T>
            </Button>
          ) : null}
          {step === 2 ? (
            <Button onClick={close}>
              <T>Done</T>
            </Button>
          ) : (
            <Button disabled={step === 0 ? choice === null : access === null} onClick={next}>
              <T>Next</T>
            </Button>
          )}
        </WizardFooter>
      ) : null}
    </>
  );
}

/** The level the Access step starts at: Auto, else the next one down that can be granted. */
const DEFAULT_LEVELS: readonly AuthMcpClientAccess[] = [
  "auto",
  "auto-accept-edits",
  "approval-required",
  "read-only",
];

/** Why each level cannot be granted on this environment; absent when it can. */
function useGrantableLevels(environment: EnvironmentPresentation) {
  const environmentId = environment.environmentId;
  const session = useEnvironmentSessionState(environmentId).data;
  const canMint = useEnvironmentScope(environmentId, AuthAccessWriteScope);
  const policy = useManagedPolicy(environmentId);
  const gt = useGT();
  const messages = useMessages();
  // The server refuses codes for any level when its policy keeps remote clients out.
  const remoteDenial = managedCapabilityDenial(policy, "remoteClients", messages);
  return new Map(
    AuthMcpClientAccess.literals.flatMap((level) => {
      const reason =
        remoteDenial ??
        (!canMint
          ? gt("This device needs the Manage access permission on {environment}.", {
              environment: environment.label,
            })
          : session === null ||
              !mcpClientScopes(level).every((scope) => sessionGrantsScope(session, scope))
            ? gt("This device cannot grant this on {environment}.", {
                environment: environment.label,
              })
            : level === "read-only"
              ? undefined
              : managedRuntimeModeDenial(policy, level, messages));
      return reason === undefined ? [] : [[level, reason] as const];
    }),
  );
}

function AppStep({
  choice,
  onChoose,
}: {
  readonly choice: Choice | null;
  readonly onChoose: (choice: Choice) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">
        <T>Which app?</T>
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {MCP_APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            aria-pressed={choice === app}
            onClick={() => onChoose(app)}
            className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-transparent px-1 py-3 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary/8"
          >
            <img
              src={app.logo}
              alt=""
              className="size-10 rounded-lg ring-1 ring-black/10 dark:ring-white/12"
            />
            <span className="max-w-full truncate whitespace-nowrap text-xs font-medium">
              {app.name}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={choice === "other"}
        onClick={() => onChoose("other")}
        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary/8"
      >
        <T>Something else…</T>
      </button>
    </section>
  );
}

function ConnectStep({
  environment,
  mcpUrl,
  choice,
  access,
}: {
  readonly environment: EnvironmentPresentation;
  readonly mcpUrl: string;
  readonly choice: Choice;
  /** Null when the sign-in page asks for the level, so no code is needed. */
  readonly access: AuthMcpClientAccess | null;
}) {
  const [anotherWay, setAnotherWay] = useState(choice === "other");
  const gt = useGT();
  const m = useMessages();
  const app = choice === "other" ? null : choice;
  const code =
    access === null ? (
      <p className="text-sm text-muted-foreground">
        <T>Approve the app on the server’s sign-in page.</T>
      </p>
    ) : (
      <ApprovalCode
        key={access}
        environmentId={environment.environmentId}
        name={environment.label}
        access={access}
      />
    );
  if (anotherWay || app === null) {
    return (
      <section className="space-y-4">
        <CopyRow label={gt("URL")} value={mcpUrl} />
        <ol className="list-decimal space-y-1 ps-5 text-sm">
          {(app?.steps ?? OTHER_MCP_APP_STEPS).map((step) => (
            <li key={step}>{m(step)}</li>
          ))}
        </ol>
        {app === null ? (
          <p className="text-xs text-muted-foreground">
            <T>Apps that require their own client ID cannot connect.</T>
          </p>
        ) : (
          <TextButton onClick={() => openLink(app.docs)}>
            {gt("{app} help", { app: app.name })}
          </TextButton>
        )}
        {code}
        {app === null ? null : (
          <TextButton onClick={() => setAnotherWay(false)}>{gt("Back to commands")}</TextButton>
        )}
        <LinkedLine environment={environment} access={access} />
      </section>
    );
  }
  return (
    <section className="space-y-4">
      <PrimaryAction app={app} mcpUrl={mcpUrl} />
      <CopyRow label={gt("URL")} value={mcpUrl} />
      {code}
      <TextButton onClick={() => setAnotherWay(true)}>
        <T>Set up another way</T>
      </TextButton>
      <LinkedLine environment={environment} access={access} />
    </section>
  );
}

function TextButton({
  onClick,
  children,
}: {
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
    >
      {children}
    </button>
  );
}

function openLink(url: string) {
  void readLocalApi()
    ?.shell.openExternal(url)
    .catch((error: unknown) =>
      toastManager.add({
        type: "error",
        title: m(msg("Could not open the link")),
        description: thrownErrorMessage(error, m) ?? url,
      }),
    );
}

function PrimaryAction({ app, mcpUrl }: { readonly app: McpApp; readonly mcpUrl: string }) {
  const gt = useGT();
  const m = useMessages();
  return (
    <div className="space-y-2">
      {app.commands(mcpUrl).map((command) => (
        <CommandBlock key={command} command={command} />
      ))}
      <p className="text-xs text-muted-foreground">
        {gt("Run these where {app} runs.", { app: app.name })}
      </p>
      {app.note ? <p className="text-xs text-muted-foreground">{m(app.note)}</p> : null}
    </div>
  );
}

function ApprovalCode({
  environmentId,
  name,
  access,
}: {
  readonly environmentId: EnvironmentId;
  readonly name: string;
  readonly access: AuthMcpClientAccess;
}) {
  const [code, setCode] = useState<{
    readonly credential: string;
    readonly expiresAt: number;
  } | null>(null);
  const gt = useGT();
  const m = useMessages();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useNowSecond();
  const live = code !== null && now < code.expiresAt;
  const mint = async () => {
    setPending(true);
    setError(null);
    const result = await mintMcpApprovalCodeOn(environmentId, access);
    setPending(false);
    if (Result.isSuccess(result)) {
      setCode({
        credential: result.success.credential,
        expiresAt: result.success.expiresAt.epochMilliseconds,
      });
    } else {
      setError(gt("Could not get a code from {environment}. Try again.", { environment: name }));
    }
  };
  const left = code === null ? 0 : Math.max(0, Math.floor((code.expiresAt - now) / 1000));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm">
          <T>
            Code to approve{" "}
            <span className="font-medium">
              <Var>{m(accessConfig[access].label)}</Var>
            </span>
          </T>
        </span>
        {live ? null : (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => void mint()}>
            {pending ? gt("Getting code…") : code === null ? gt("Get code") : gt("New code")}
          </Button>
        )}
      </div>
      {code !== null ? (
        live ? (
          <>
            <CopyRow label={gt("Code", { $context: "approval code" })} value={code.credential} />
            <p className="text-xs text-muted-foreground">
              {gt("Expires {time} · one use", {
                time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`,
              })}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            <T>The code expired.</T>
          </p>
        )
      ) : null}
      {error ? <p className="text-xs text-destructive-foreground">{error}</p> : null}
    </div>
  );
}

function CopyRow({ label, value }: { readonly label: string; readonly value: string }) {
  const { copyToClipboard, isCopied } = useCopyToClipboard({
    timeout: 1500,
    target: namedClipboardTarget(label),
  });
  const gt = useGT();
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-sm">{value}</span>
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={gt("Copy {label}", { label })}
        onClick={() => copyToClipboard(value, undefined)}
      >
        {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      </Button>
    </div>
  );
}

const levelRank = (level: AuthMcpClientAccess) => AuthMcpClientAccess.literals.indexOf(level);

/** Machines this environment links to, at the level a call forwarded there gets. */
function LinkedLine({
  environment,
  access,
}: {
  readonly environment: EnvironmentPresentation;
  /** Null when the level is picked later; each link then shows its own. */
  readonly access: AuthMcpClientAccess | null;
}) {
  const offered = offersLinkedEnvironments(environment.serverConfig);
  const links = useEnvironmentQuery(
    offered
      ? peerLinkEnvironment.list({ environmentId: environment.environmentId, input: {} })
      : null,
  ).data?.links;
  const identities = useEnvironmentIdentities();
  const gt = useGT();
  const m = useMessages();
  if (!offered || links === undefined || links.length === 0) return null;
  const named = links.map((link) => {
    const name =
      identities.find((identity) => identity.environmentId === link.environmentId)?.label ??
      link.label;
    // A forwarded call keeps the lower of the app's level and the link's own.
    const level =
      access === null || levelRank(link.access) < levelRank(access) ? link.access : access;
    return `${name} · ${link.status === "expired" ? gt("Expired") : m(accessConfig[level].label)}`;
  });
  return (
    <p className="text-xs text-muted-foreground">
      {gt("Linked: {environments}", { environments: named.join(", ") })}
    </p>
  );
}

function ManageAccessButton({ environment }: { readonly environment: EnvironmentPresentation }) {
  const navigate = useNavigate();
  const gt = useGT();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        close();
        void navigate({ to: "/settings/access", search: { machine: environment.environmentId } });
      }}
    >
      {gt("Manage access")}
    </Button>
  );
}
