import { RelayManagedEndpointRuntimeConfig } from "@t3tools/contracts/relay";
import * as Schema from "effect/Schema";

export const CLOUD_MINT_PUBLIC_KEY = "cloud-mint-ed25519-public-key";
export const CLOUD_ENDPOINT_RUNTIME_CONFIG = "cloud-endpoint-runtime-config";
export const RELAY_URL_SECRET = "cloud-relay-url";
export const RELAY_ISSUER_SECRET = "cloud-relay-issuer";

export const decodeRuntimeConfig = Schema.decodeUnknownOption(
  Schema.fromJsonString(RelayManagedEndpointRuntimeConfig),
);
