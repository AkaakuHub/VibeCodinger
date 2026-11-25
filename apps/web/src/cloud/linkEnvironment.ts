import * as Effect from "effect/Effect";
import { msg } from "gt-react";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as SubscriptionRef from "effect/SubscriptionRef";
import type { HttpClient } from "effect/http";
import {
  EnvironmentCloudEndpointUnavailableError,
  type EnvironmentCloudLinkStateResult,
  type EnvironmentConnectReachability,
  EnvironmentHttpBadRequestError,
  EnvironmentHttpConflictError,
  EnvironmentHttpForbiddenError,
  EnvironmentHttpInternalServerError,
  EnvironmentHttpUnauthorizedError,
  EnvironmentId,
} from "@t3tools/contracts";
import {
  type RelayEnvironmentLinkResponse,
  type RelayManagedEndpointProviderKind,
} from "@t3tools/contracts/relay";
import { EnvironmentRegistry, EnvironmentSupervisor } from "@t3tools/client-runtime/connection";
import { ManagedRelay, relayRequestFailureDetail } from "@t3tools/client-runtime/relay";
import { executeConnectedEnvironmentHttpRequest } from "@t3tools/client-runtime/state/environmentHttpAuth";

import { m } from "../i18n/messages";
import { resolveCloudPublicConfig } from "./publicConfig";
function relayUrl(): string | null {
  return resolveCloudPublicConfig().relayUrl;
}

export class CloudEnvironmentLinkError extends Schema.TaggedError<CloudEnvironmentLinkError>()(
  "CloudEnvironmentLinkError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
    traceId: Schema.optional(Schema.String),
  },
) {}

export const isCloudEnvironmentLinkError = Schema.is(CloudEnvironmentLinkError);

const isEnvironmentCloudApiError = Schema.is(
  Schema.Union([
    EnvironmentHttpBadRequestError,
    EnvironmentHttpUnauthorizedError,
    EnvironmentHttpForbiddenError,
    EnvironmentHttpConflictError,
    EnvironmentHttpInternalServerError,
    EnvironmentCloudEndpointUnavailableError,
  ]),
);

function decodedRelayClientError(message: string) {
  return (cause: ManagedRelay.ManagedRelayClientError) => {
    const failed = cause._tag === "ManagedRelayRequestFailedError" ? cause : undefined;
    const traceId = "traceId" in cause ? cause.traceId : undefined;
    const detail = (failed && relayRequestFailureDetail(failed)) ?? cause.message;
    return new CloudEnvironmentLinkError({
      message: detail ? m(msg("{message}: {detail}", { message, detail })) : message,
      cause,
      ...(traceId ? { traceId } : {}),
    });
  };
}

function findEnvironmentCloudApiError(cause: unknown): { readonly message: string } | null {
  if (isEnvironmentCloudApiError(cause)) {
    return cause;
  }
  if (typeof cause !== "object" || cause === null) {
    return null;
  }
  return "cause" in cause ? findEnvironmentCloudApiError(cause.cause) : null;
}

/** `msg()` sentences: the failure alone, and the same failure followed by the server's `{detail}`. */
interface EnvironmentFailureCopy {
  readonly message: string;
  readonly withDetail: string;
}

const environmentApiError = (copy: EnvironmentFailureCopy) => (cause: unknown) => {
  const environmentError = findEnvironmentCloudApiError(cause);
  return new CloudEnvironmentLinkError({
    message: environmentError
      ? m(copy.withDetail, { detail: environmentError.message })
      : m(copy.message),
    cause,
  });
};

function endpointOrigin(httpBaseUrl: string) {
  const url = new URL(httpBaseUrl);
  return {
    localHttpHost: "127.0.0.1",
    localHttpPort: Number(url.port || (url.protocol === "https:" ? 443 : 80)),
  };
}

const MANAGED_ENDPOINT_PROVIDER_KIND =
  "cloudflare_tunnel" satisfies RelayManagedEndpointProviderKind;

function ensureLinkedEnvironmentMatches(input: {
  readonly expectedEnvironmentId: string;
  readonly expectedProviderKind: RelayManagedEndpointProviderKind;
  readonly link: RelayEnvironmentLinkResponse;
}): Effect.Effect<void, CloudEnvironmentLinkError> {
  if (input.link.environmentId !== input.expectedEnvironmentId) {
    return new CloudEnvironmentLinkError({
      message: m(msg("Relay returned credentials for a different environment.")),
    });
  }
  if (input.link.endpoint.providerKind !== input.expectedProviderKind) {
    return new CloudEnvironmentLinkError({
      message: m(msg("Relay returned credentials for a different endpoint provider.")),
    });
  }
  return Effect.void;
}

export interface CloudLinkTarget {
  readonly environmentId: EnvironmentId;
}

export type CloudLinkState = EnvironmentCloudLinkStateResult;

// Linking can install the relay client and start a managed tunnel before it answers.
const CLOUD_LINK_REQUEST_TIMEOUT_MS = 60_000;

type ConnectedEnvironmentHttpRequest<A, E, R> = Parameters<
  typeof executeConnectedEnvironmentHttpRequest<"connect", A, E, R>
>[0];

/** Runs on the target environment with this client's own credentials for it. */
const connectRequest = <A, E, R>(
  target: CloudLinkTarget,
  input: Omit<ConnectedEnvironmentHttpRequest<A, E, R>, "group" | "timeoutMs">,
  failure: EnvironmentFailureCopy,
) =>
  Effect.flatMap(EnvironmentRegistry.EnvironmentRegistry, (registry) =>
    registry.run(
      target.environmentId,
      executeConnectedEnvironmentHttpRequest({
        ...input,
        group: "connect",
        timeoutMs: CLOUD_LINK_REQUEST_TIMEOUT_MS,
      }),
    ),
  ).pipe(Effect.mapError(environmentApiError(failure)));

const preparedEndpoint = (target: CloudLinkTarget) =>
  Effect.flatMap(EnvironmentRegistry.EnvironmentRegistry, (registry) =>
    registry.run(
      target.environmentId,
      Effect.flatMap(EnvironmentSupervisor.EnvironmentSupervisor, (supervisor) =>
        SubscriptionRef.get(supervisor.prepared),
      ),
    ),
  ).pipe(
    Effect.mapError(
      environmentApiError({
        message: msg("Could not reach the environment."),
        withDetail: msg("Could not reach the environment: {detail}"),
      }),
    ),
    Effect.flatMap(
      Option.match({
        onNone: () =>
          Effect.fail(
            new CloudEnvironmentLinkError({ message: m(msg("The environment is not connected.")) }),
          ),
        onSome: ({ httpBaseUrl, target }) =>
          Effect.succeed({
            httpBaseUrl,
            wsBaseUrl:
              target._tag === "PrimaryConnectionTarget"
                ? target.wsBaseUrl
                : httpBaseUrl.replace(/^http/, "ws"),
          }),
      }),
    ),
  );

type CloudLinkServices = EnvironmentRegistry.EnvironmentRegistry | HttpClient.HttpClient;

export const readCloudLinkState: (input: {
  readonly target: CloudLinkTarget;
}) => Effect.Effect<CloudLinkState | null, CloudEnvironmentLinkError, CloudLinkServices> =
  Effect.fn("linkEnvironment.readCloudLinkState")(function* (input: {
    readonly target: CloudLinkTarget;
  }) {
    return yield* connectRequest(
      input.target,
      {
        method: "GET",
        url: (urls) => urls.linkState(),
        request: ({ client, headers }) => client.linkState({ headers }),
      },
      {
        message: msg("Could not read environment cloud link state."),
        withDetail: msg("Could not read environment cloud link state: {detail}"),
      },
    );
  });

/** Runs the environment's T3 Connect reachability check now; the link state then reports it. */
export const checkCloudReachability: (input: {
  readonly target: CloudLinkTarget;
}) => Effect.Effect<EnvironmentConnectReachability, CloudEnvironmentLinkError, CloudLinkServices> =
  Effect.fn("linkEnvironment.checkCloudReachability")(function* (input: {
    readonly target: CloudLinkTarget;
  }) {
    return yield* connectRequest(
      input.target,
      {
        method: "POST",
        url: (urls) => urls.checkReachability(),
        request: ({ client, headers }) => client.checkReachability({ headers }),
      },
      {
        message: msg("Could not check T3 Connect."),
        withDetail: msg("Could not check T3 Connect: {detail}"),
      },
    );
  });

export const updateCloudPreferences: (input: {
  readonly target: CloudLinkTarget;
  readonly publishAgentActivity: boolean;
  readonly holdWebhooksWhileOffline?: boolean;
}) => Effect.Effect<CloudLinkState, CloudEnvironmentLinkError, CloudLinkServices> = Effect.fn(
  "linkEnvironment.updateCloudPreferences",
)(function* (input: {
  readonly target: CloudLinkTarget;
  readonly publishAgentActivity: boolean;
  readonly holdWebhooksWhileOffline?: boolean;
}) {
  const { target, ...payload } = input;
  return yield* connectRequest(
    target,
    {
      method: "POST",
      url: (urls) => urls.preferences(),
      request: ({ client, headers }) => client.preferences({ headers, payload }),
    },
    {
      message: msg("Could not update environment cloud preferences."),
      withDetail: msg("Could not update environment cloud preferences: {detail}"),
    },
  );
});

export const unlinkEnvironmentFromCloud: (input: {
  readonly target: CloudLinkTarget;
  readonly clerkToken: string | null;
}) => Effect.Effect<
  void,
  CloudEnvironmentLinkError,
  CloudLinkServices | ManagedRelay.ManagedRelayClient
> = Effect.fn("linkEnvironment.unlinkEnvironmentFromCloud")(function* (input: {
  readonly target: CloudLinkTarget;
  readonly clerkToken: string | null;
}) {
  yield* connectRequest(
    input.target,
    {
      method: "POST",
      url: (urls) => urls.unlink(),
      request: ({ client, headers }) => client.unlink({ headers }),
    },
    {
      message: msg("Could not unlink the environment from cloud."),
      withDetail: msg("Could not unlink the environment from cloud: {detail}"),
    },
  );

  const configuredRelayUrl = relayUrl();
  if (configuredRelayUrl && input.clerkToken) {
    const relayClient = yield* ManagedRelay.ManagedRelayClient;
    yield* relayClient
      .unlinkEnvironment({
        clerkToken: input.clerkToken,
        environmentId: input.target.environmentId,
      })
      .pipe(
        Effect.mapError(
          decodedRelayClientError(
            m(
              msg(
                "Disconnected locally, but T3 Connect did not confirm it removed this environment",
              ),
            ),
          ),
        ),
      );
  }
});

export type CloudLinkMode = "managed" | "publish_only";

const PUBLISH_ONLY_PROVIDER_KIND = "manual" satisfies RelayManagedEndpointProviderKind;

export const linkEnvironmentToCloud: (input: {
  readonly target: CloudLinkTarget;
  readonly clerkToken: string;
  readonly mode?: CloudLinkMode;
}) => Effect.Effect<
  void,
  CloudEnvironmentLinkError,
  CloudLinkServices | ManagedRelay.ManagedRelayClient
> = Effect.fn("linkEnvironment.linkEnvironmentToCloud")(function* (input: {
  readonly target: CloudLinkTarget;
  readonly clerkToken: string;
  readonly mode?: CloudLinkMode;
}) {
  const configuredRelayUrl = relayUrl();
  if (!configuredRelayUrl) {
    return yield* new CloudEnvironmentLinkError({
      message: m(msg("{name} is not configured.", { name: "VIBECODINGER_RELAY_URL" })),
    });
  }
  const managedTunnelsEnabled = (input.mode ?? "managed") === "managed";
  const providerKind = managedTunnelsEnabled
    ? MANAGED_ENDPOINT_PROVIDER_KIND
    : PUBLISH_ONLY_PROVIDER_KIND;
  const relayClient = yield* ManagedRelay.ManagedRelayClient;
  // The environment only signs a proof for the loopback origin this request reaches it on.
  const endpoint = yield* preparedEndpoint(input.target);
  const challenge = yield* relayClient
    .createEnvironmentLinkChallenge({
      clerkToken: input.clerkToken,
      payload: {
        notificationsEnabled: true,
        liveActivitiesEnabled: true,
        managedTunnelsEnabled,
      },
    })
    .pipe(
      Effect.mapError(
        decodedRelayClientError(
          m(
            msg("{url} failed", {
              url: `${configuredRelayUrl}/v1/client/environment-link-challenges`,
            }),
          ),
        ),
      ),
    );
  const proof = yield* connectRequest(
    input.target,
    {
      method: "POST",
      url: (urls) => urls.linkProof(),
      request: ({ client, headers }) =>
        client.linkProof({
          headers,
          payload: {
            challenge: challenge.challenge,
            relayIssuer: configuredRelayUrl,
            endpoint: { ...endpoint, providerKind },
            origin: endpointOrigin(endpoint.httpBaseUrl),
          },
        }),
    },
    {
      message: msg("Could not obtain environment link proof."),
      withDetail: msg("Could not obtain environment link proof: {detail}"),
    },
  );
  const link = yield* relayClient
    .linkEnvironment({
      clerkToken: input.clerkToken,
      payload: {
        proof,
        notificationsEnabled: true,
        liveActivitiesEnabled: true,
        managedTunnelsEnabled,
      },
    })
    .pipe(
      Effect.mapError(
        decodedRelayClientError(
          m(msg("{url} failed", { url: `${configuredRelayUrl}/v1/client/environment-links` })),
        ),
      ),
    );
  yield* ensureLinkedEnvironmentMatches({
    expectedEnvironmentId: input.target.environmentId,
    expectedProviderKind: providerKind,
    link,
  });

  yield* connectRequest(
    input.target,
    {
      method: "POST",
      url: (urls) => urls.relayConfig(),
      request: ({ client, headers }) =>
        client.relayConfig({
          headers,
          payload: {
            relayUrl: configuredRelayUrl,
            relayIssuer: link.relayIssuer,
            cloudUserId: link.cloudUserId,
            environmentCredential: link.environmentCredential,
            cloudMintPublicKey: link.cloudMintPublicKey,
            endpointRuntime: link.endpointRuntime,
          },
        }),
    },
    {
      message: msg("Could not configure environment relay access."),
      withDetail: msg("Could not configure environment relay access: {detail}"),
    },
  );
});
