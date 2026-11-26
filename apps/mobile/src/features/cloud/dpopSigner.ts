import { DpopProof } from "@vibecodinger/client-runtime/relay";

import { loadOrCreateProofKey } from "./dpop";

export const layer = DpopProof.layerSigner({
  keyStore: "expo-secure-store",
  loadOrCreateKey: loadOrCreateProofKey(),
});
