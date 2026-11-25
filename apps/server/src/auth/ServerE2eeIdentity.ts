import { identityPublicKeyFromSeed, type E2eeIdentityKeypair } from "@t3tools/shared/socketE2ee";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import * as ServerSecretStore from "./ServerSecretStore.ts";

export class ServerE2eeIdentity extends Context.Service<
  ServerE2eeIdentity,
  { readonly keypair: Effect.Effect<E2eeIdentityKeypair, ServerSecretStore.SecretStoreError> }
>()("t3/auth/ServerE2eeIdentity") {}

export const layer = Layer.effect(
  ServerE2eeIdentity,
  Effect.gen(function* () {
    const store = yield* ServerSecretStore.ServerSecretStore;
    const keypair = yield* store.getOrCreateRandom("e2ee-identity-seed-v1", 32).pipe(
      Effect.map((value) => {
        const seed = Uint8Array.from(value);
        return { seed, publicKey: identityPublicKeyFromSeed(seed) };
      }),
      Effect.cached,
    );
    return ServerE2eeIdentity.of({ keypair });
  }),
);
