import type { EnvironmentCloudLinkStateResult } from "@t3tools/contracts";
import type { RelayManagedEndpointProviderKind } from "@t3tools/contracts/relay";

// Require managed discovery: stale tunnel config after a publish-only switch causes endpoint_provider_not_managed.
export function isManagedTunnelActive(
  linkState: EnvironmentCloudLinkStateResult,
  relayProviderKind: RelayManagedEndpointProviderKind | undefined,
) {
  const localManagedTunnel = linkState.managedTunnelActive ?? linkState.linked;
  return (
    linkState.linkRevoked !== true &&
    localManagedTunnel &&
    (relayProviderKind === undefined || relayProviderKind === "cloudflare_tunnel")
  );
}

/**
 * Whether reaching `desired` links or relinks the environment, which needs `relay:configure`.
 * Unlinking and preference changes on the current link only need `relay:write`.
 */
export function cloudChangeReplacesLink(
  linkState: EnvironmentCloudLinkStateResult,
  relayProviderKind: RelayManagedEndpointProviderKind | undefined,
  desired: { readonly managedTunnel: boolean; readonly publish: boolean },
) {
  return (
    (desired.managedTunnel || desired.publish) &&
    (!linkState.linked ||
      linkState.linkRevoked === true ||
      isManagedTunnelActive(linkState, relayProviderKind) !== desired.managedTunnel)
  );
}

/** Where T3 Connect can be turned on for an environment: from here, only by policy, or on its host. */
export type T3ConnectTurnOn =
  | { readonly kind: "here" }
  | { readonly kind: "policy"; readonly reason: string }
  | { readonly kind: "on-host" };

/**
 * Show the Turn on control only when linking works.
 * `linkableHere` is the environment's own answer for this session (its link state).
 */
export function resolveT3ConnectTurnOn(input: {
  readonly linkableHere: boolean;
  readonly cloudConfigured: boolean;
  readonly canReadRelay: boolean;
  readonly canWriteRelay: boolean;
  readonly connectDenial: string | undefined;
}): T3ConnectTurnOn {
  if (input.connectDenial !== undefined) return { kind: "policy", reason: input.connectDenial };
  return input.linkableHere && input.cloudConfigured && input.canReadRelay && input.canWriteRelay
    ? { kind: "here" }
    : { kind: "on-host" };
}
