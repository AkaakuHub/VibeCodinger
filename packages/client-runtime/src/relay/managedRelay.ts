import {
  type RelayClientEnvironmentRecord,
  RelayDpopAccessTokenScope,
  type RelayEnvironmentConnectResponse,
  type RelayEnvironmentStatusResponse,
  RelayProtectedError,
} from "@vibecodinger/contracts/relay";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import type * as HttpMethod from "effect/http/HttpMethod";
import { msg } from "gt-i18n";
import { NETWORK_BLOCKING_HINT } from "../errors/network.ts";
import { type MarkedText, markedTextEnglish } from "../errors/translatable.ts";
import { relayRequestFailureText } from "./errorPresentation.ts";

export interface ManagedRelayDpopProofInput {
  readonly method: HttpMethod.HttpMethod;
  readonly url: string;
  readonly accessToken?: string;
}

export class ManagedRelayDpopKeyLoadError extends Schema.TaggedError<ManagedRelayDpopKeyLoadError>()(
  "ManagedRelayDpopKeyLoadError",
  {
    keyStore: Schema.Literals(["expo-secure-store", "indexed-db"]),
    cause: Schema.Defect(),
  },
) {
  override get message(): string {
    return markedTextEnglish(this.i18nMessage);
  }

  get i18nMessage(): MarkedText {
    return [msg("Could not load relay DPoP proof key.")];
  }
}

export class ManagedRelayDpopProofCreationError extends Schema.TaggedError<ManagedRelayDpopProofCreationError>()(
  "ManagedRelayDpopProofCreationError",
  {
    method: Schema.String,
    url: Schema.String,
    cause: Schema.Defect(),
  },
) {
  override get message(): string {
    return `Could not create the relay DPoP proof for ${this.method} ${this.url}.`;
  }
}

export const ManagedRelayDpopSignerError = Schema.Union([
  ManagedRelayDpopKeyLoadError,
  ManagedRelayDpopProofCreationError,
]);
export type ManagedRelayDpopSignerError = typeof ManagedRelayDpopSignerError.Type;

export const ManagedRelayRequestAction = Schema.Literals([
  "exchange relay DPoP access token",
  "list relay-managed environments",
  "get relay environment status",
  "connect relay environment",
]);
export type ManagedRelayRequestAction = typeof ManagedRelayRequestAction.Type;

export const ManagedRelayRequestActivity = Schema.Literals([
  "Relay DPoP access token exchange",
  "Relay environment listing",
  "Relay environment status request",
  "Relay environment connection",
]);
export type ManagedRelayRequestActivity = typeof ManagedRelayRequestActivity.Type;

const REQUEST_TIMED_OUT_TEXT: Record<ManagedRelayRequestActivity, string> = {
  "Relay DPoP access token exchange": msg("Relay DPoP access token exchange timed out."),
  "Relay environment listing": msg("Relay environment listing timed out."),
  "Relay environment status request": msg("Relay environment status request timed out."),
  "Relay environment connection": msg("Relay environment connection timed out."),
};

export class ManagedRelayRequestTimeoutError extends Schema.TaggedError<ManagedRelayRequestTimeoutError>()(
  "ManagedRelayRequestTimeoutError",
  {
    activity: ManagedRelayRequestActivity,
    timeoutMs: Schema.Number,
    traceId: Schema.NullOr(Schema.String),
  },
) {
  override get message(): string {
    return markedTextEnglish(this.i18nMessage);
  }

  get i18nMessage(): MarkedText {
    return [REQUEST_TIMED_OUT_TEXT[this.activity], NETWORK_BLOCKING_HINT];
  }
}

export class ManagedRelayUrlInvalidError extends Schema.TaggedError<ManagedRelayUrlInvalidError>()(
  "ManagedRelayUrlInvalidError",
  {
    relayUrl: Schema.String,
  },
) {
  override get message(): string {
    return markedTextEnglish(this.i18nMessage);
  }

  get i18nMessage(): MarkedText {
    return [msg("Relay URL must be a secure absolute HTTPS origin.")];
  }
}

const REQUEST_FAILED_TEXT: Record<
  ManagedRelayRequestAction,
  { readonly failed: string; readonly failedWithDetail: string }
> = {
  "exchange relay DPoP access token": {
    failed: msg("Could not exchange relay DPoP access token."),
    failedWithDetail: msg("Could not exchange relay DPoP access token:"),
  },
  "list relay-managed environments": {
    failed: msg("Could not list relay-managed environments."),
    failedWithDetail: msg("Could not list relay-managed environments:"),
  },
  "get relay environment status": {
    failed: msg("Could not get relay environment status."),
    failedWithDetail: msg("Could not get relay environment status:"),
  },
  "connect relay environment": {
    failed: msg("Could not connect relay environment."),
    failedWithDetail: msg("Could not connect relay environment:"),
  },
};

export class ManagedRelayRequestFailedError extends Schema.TaggedError<ManagedRelayRequestFailedError>()(
  "ManagedRelayRequestFailedError",
  {
    action: ManagedRelayRequestAction,
    transportFailed: Schema.optionalKey(Schema.Boolean),
    cause: Schema.Defect(),
    relayError: Schema.optional(RelayProtectedError),
    status: Schema.optional(Schema.Number),
    traceId: Schema.optional(Schema.String),
  },
) {
  override get message(): string {
    return markedTextEnglish(this.i18nMessage);
  }

  get i18nMessage(): MarkedText {
    const text = REQUEST_FAILED_TEXT[this.action];
    if (this.transportFailed) return [text.failed, NETWORK_BLOCKING_HINT];
    const detail = relayRequestFailureText(this);
    return detail ? [text.failedWithDetail, ...detail] : [text.failed];
  }
}

export class ManagedRelayAccessTokenScopesUnexpectedError extends Schema.TaggedError<ManagedRelayAccessTokenScopesUnexpectedError>()(
  "ManagedRelayAccessTokenScopesUnexpectedError",
  {
    requestedScopes: Schema.Array(RelayDpopAccessTokenScope),
    grantedScope: Schema.String,
  },
) {
  override get message(): string {
    return markedTextEnglish(this.i18nMessage);
  }

  get i18nMessage(): MarkedText {
    return [msg("Relay granted unexpected DPoP access token scopes.")];
  }
}

export class ManagedRelayTokenProofCreationError extends Schema.TaggedError<ManagedRelayTokenProofCreationError>()(
  "ManagedRelayTokenProofCreationError",
  {
    method: Schema.String,
    url: Schema.String,
    cause: Schema.Defect(),
  },
) {
  override get message(): string {
    return markedTextEnglish(this.i18nMessage);
  }

  get i18nMessage(): MarkedText {
    return [msg("Could not create relay token DPoP proof.")];
  }
}

export class ManagedRelayRequestProofCreationError extends Schema.TaggedError<ManagedRelayRequestProofCreationError>()(
  "ManagedRelayRequestProofCreationError",
  {
    method: Schema.String,
    url: Schema.String,
    cause: Schema.Defect(),
  },
) {
  override get message(): string {
    return markedTextEnglish(this.i18nMessage);
  }

  get i18nMessage(): MarkedText {
    return [msg("Could not create relay request DPoP proof.")];
  }
}

export const ManagedRelayClientError = Schema.Union([
  ManagedRelayUrlInvalidError,
  ManagedRelayRequestFailedError,
  ManagedRelayRequestTimeoutError,
  ManagedRelayAccessTokenScopesUnexpectedError,
  ManagedRelayDpopKeyLoadError,
  ManagedRelayTokenProofCreationError,
  ManagedRelayRequestProofCreationError,
]);
export type ManagedRelayClientError = typeof ManagedRelayClientError.Type;

export class ManagedRelayDpopSigner extends Context.Service<
  ManagedRelayDpopSigner,
  {
    readonly thumbprint: Effect.Effect<string, ManagedRelayDpopKeyLoadError>;
    readonly createProof: (
      input: ManagedRelayDpopProofInput,
    ) => Effect.Effect<string, ManagedRelayDpopProofCreationError>;
  }
>()("@vibecodinger/client-runtime/relay/managedRelay/ManagedRelayDpopSigner") {}

export const MANAGED_RELAY_REQUEST_TIMEOUT_MS = 10_000;

export interface ManagedRelayAuthorization {
  readonly accessToken: string;
  readonly proof: string;
  readonly thumbprint: string;
}

export class ManagedRelayClient extends Context.Service<
  ManagedRelayClient,
  {
    readonly relayUrl: string;
    readonly listEnvironments: (input: {
      readonly clerkToken: string;
    }) => Effect.Effect<ReadonlyArray<RelayClientEnvironmentRecord>, ManagedRelayClientError>;
    readonly getEnvironmentStatus: (input: {
      readonly clerkToken: string;
      readonly scopes: ReadonlyArray<RelayDpopAccessTokenScope>;
      readonly environmentId: RelayClientEnvironmentRecord["environmentId"];
    }) => Effect.Effect<RelayEnvironmentStatusResponse, ManagedRelayClientError>;
    readonly connectEnvironment: (input: {
      readonly clerkToken: string;
      readonly scopes: ReadonlyArray<RelayDpopAccessTokenScope>;
      readonly environmentId: RelayClientEnvironmentRecord["environmentId"];
      readonly deviceId?: string;
    }) => Effect.Effect<RelayEnvironmentConnectResponse, ManagedRelayClientError>;
  }
>()("@vibecodinger/client-runtime/relay/managedRelay/ManagedRelayClient") {}

function disabledManagedRelayClient(): ManagedRelayClient["Service"] {
  const relayUrl = "";
  const unavailable = (spanName: string) =>
    Effect.fn(spanName)(function* () {
      return yield* new ManagedRelayUrlInvalidError({ relayUrl });
    });
  return ManagedRelayClient.of({
    relayUrl,
    listEnvironments: unavailable("clientRuntime.managedRelay.listEnvironments"),
    getEnvironmentStatus: unavailable("clientRuntime.managedRelay.getEnvironmentStatus"),
    connectEnvironment: unavailable("clientRuntime.managedRelay.connectEnvironment"),
  });
}

export const layer = Layer.succeed(ManagedRelayClient, disabledManagedRelayClient());
