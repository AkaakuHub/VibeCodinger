import type {
  AdvertisedEndpoint,
  DesktopBridge,
  DesktopServerExposureState,
} from "@vibecodinger/contracts";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { AsyncResult, Atom } from "effect/reactivity";

import { appAtomRegistry } from "~/rpc/atomRegistry";
import { msg } from "gt-react";

import { m } from "../i18n/messages";

const DESKTOP_NETWORK_ACCESS_STALE_TIME_MS = 30_000;

export function isTailscaleHttpsEndpoint(endpoint: AdvertisedEndpoint): boolean {
  return endpoint.id.startsWith("tailscale-magicdns:");
}

type DesktopNetworkAccessBridge = Pick<
  DesktopBridge,
  "getAdvertisedEndpoints" | "getServerExposureState"
>;

export interface DesktopNetworkAccessSnapshot {
  readonly advertisedEndpoints: ReadonlyArray<AdvertisedEndpoint>;
  readonly serverExposureState: DesktopServerExposureState;
}

class DesktopNetworkAccessUnavailableError extends Schema.TaggedError<DesktopNetworkAccessUnavailableError>()(
  "DesktopNetworkAccessUnavailableError",
  {},
) {
  override get message(): string {
    return m(msg("Desktop network access is unavailable."));
  }
}

class DesktopServerExposureStateLoadError extends Schema.TaggedError<DesktopServerExposureStateLoadError>()(
  "DesktopServerExposureStateLoadError",
  { cause: Schema.Defect() },
) {
  override get message(): string {
    return m(msg("Failed to load desktop server exposure state."));
  }
}

class DesktopAdvertisedEndpointsLoadError extends Schema.TaggedError<DesktopAdvertisedEndpointsLoadError>()(
  "DesktopAdvertisedEndpointsLoadError",
  { cause: Schema.Defect() },
) {
  override get message(): string {
    return m(msg("Failed to load advertised desktop endpoints."));
  }
}

function getDesktopNetworkAccessBridge(): DesktopNetworkAccessBridge | undefined {
  return typeof window === "undefined" ? undefined : window.desktopBridge;
}

function createDesktopNetworkAccessStateAtom(
  getBridge: () => DesktopNetworkAccessBridge | undefined,
) {
  const loadDesktopNetworkAccess = Effect.fn("loadDesktopNetworkAccess")(function* () {
    const bridge = getBridge();
    if (!bridge) {
      return yield* new DesktopNetworkAccessUnavailableError();
    }
    const [serverExposureState, advertisedEndpoints] = yield* Effect.all(
      [
        Effect.tryPromise({
          try: () => bridge.getServerExposureState(),
          catch: (cause) => new DesktopServerExposureStateLoadError({ cause }),
        }),
        Effect.tryPromise({
          try: () => bridge.getAdvertisedEndpoints(),
          catch: (cause) => new DesktopAdvertisedEndpointsLoadError({ cause }),
        }),
      ],
      { concurrency: "unbounded" },
    );
    return {
      advertisedEndpoints,
      serverExposureState,
    } satisfies DesktopNetworkAccessSnapshot;
  });

  return Atom.make(loadDesktopNetworkAccess()).pipe(
    // Retain the snapshot, but let the SWR wrapper revalidate when Settings remounts.
    Atom.keepAlive,
    Atom.swr({
      staleTime: DESKTOP_NETWORK_ACCESS_STALE_TIME_MS,
      revalidateOnMount: true,
    }),
    Atom.withLabel("desktop:network-access"),
  );
}

const desktopNetworkAccessStateAtom = createDesktopNetworkAccessStateAtom(
  getDesktopNetworkAccessBridge,
);

export const retryingDesktopNetworkAccessStateAtom = Atom.make((get) => {
  const result = get(desktopNetworkAccessStateAtom);
  const snapshot = AsyncResult.getOrElse(result, () => null);
  if (
    snapshot?.serverExposureState.tailscaleServeEnabled &&
    !snapshot.advertisedEndpoints.some(
      (endpoint) => isTailscaleHttpsEndpoint(endpoint) && endpoint.status === "available",
    )
  ) {
    const timer = setTimeout(() => get.refresh(desktopNetworkAccessStateAtom), 5_000);
    get.addFinalizer(() => clearTimeout(timer));
  }
  return result;
});

export function refreshDesktopNetworkAccessState(): void {
  appAtomRegistry.refresh(desktopNetworkAccessStateAtom);
}
