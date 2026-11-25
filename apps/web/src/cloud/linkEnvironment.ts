import * as Effect from "effect/Effect";
import { msg } from "gt-react";
import * as Schema from "effect/Schema";
import type { HttpClient } from "effect/http";
import {
  EnvironmentCloudEndpointUnavailableError,
  type EnvironmentCloudLinkStateResult,
  EnvironmentHttpBadRequestError,
  EnvironmentHttpConflictError,
  EnvironmentHttpForbiddenError,
  EnvironmentHttpInternalServerError,
  EnvironmentHttpUnauthorizedError,
  EnvironmentId,
} from "@t3tools/contracts";
import { EnvironmentRegistry } from "@t3tools/client-runtime/connection";
import { executeConnectedEnvironmentHttpRequest } from "@t3tools/client-runtime/state/environmentHttpAuth";

import { m } from "../i18n/messages";

class CloudEnvironmentLinkError extends Schema.TaggedError<CloudEnvironmentLinkError>()(
  "CloudEnvironmentLinkError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
    traceId: Schema.optional(Schema.String),
  },
) {}

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

export interface CloudLinkTarget {
  readonly environmentId: EnvironmentId;
}

type CloudLinkState = EnvironmentCloudLinkStateResult;

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
