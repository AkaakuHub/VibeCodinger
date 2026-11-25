import Constants from "expo-constants";
import { normalizeSecureRelayUrl } from "@t3tools/shared/relayUrl";

type ExpoExtra = { readonly relay?: { readonly url?: unknown } };

function trimNonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function resolveCloudPublicConfig(
  extra: ExpoExtra | undefined = Constants.expoConfig?.extra,
) {
  return {
    relay: {
      url: normalizeSecureRelayUrl(trimNonEmpty(extra?.relay?.url) ?? ""),
    },
  };
}
