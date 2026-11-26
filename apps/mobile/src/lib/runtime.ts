import { getRandomValues } from "expo-crypto";
import * as SecureRandom from "effect/crypto/SecureRandom";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";

import { ManagedRelay } from "@vibecodinger/client-runtime/relay";
import { layerRemoteHttpClient } from "@vibecodinger/client-runtime/rpc";

import * as Dpop from "../features/cloud/dpop";
import * as DpopSigner from "../features/cloud/dpopSigner";
import * as NativeWebSocket from "../native/nativeWebSocket";
import * as Persistence from "../persistence/layer";
import { disposeOnFoundationReplace, type FoundationHotModule } from "./foundation-fast-refresh";
import { whenProtectedDataAvailable } from "./protectedData";

declare const module: { readonly hot?: FoundationHotModule } | undefined;

const layerHttpClient = layerRemoteHttpClient(fetch);
const layerSecureRandom = Layer.succeed(
  SecureRandom.SecureRandom,
  SecureRandom.make((size) => getRandomValues(new Uint8Array(size))),
);

type RuntimeLayerSource =
  | typeof ManagedRelay.layer
  | typeof DpopSigner.layer
  | typeof NativeWebSocket.layer
  | typeof Dpop.layer
  | typeof layerHttpClient
  | typeof Persistence.layer
  | typeof layerSecureRandom;

const layerRuntime = Layer.mergeAll(
  ManagedRelay.layer,
  DpopSigner.layer,
  NativeWebSocket.layer,
).pipe(
  Layer.provideMerge(Dpop.layer),
  Layer.provideMerge(layerHttpClient),
  Layer.provideMerge(Persistence.layer),
  Layer.provideMerge(layerSecureRandom),
  // These layers read the keychain and the database while they build, and a
  // failed build is kept for the life of the process.
  Layer.provide(Layer.effectDiscard(Effect.promise(whenProtectedDataAvailable))),
);

export const runtime: ManagedRuntime.ManagedRuntime<
  Layer.Success<RuntimeLayerSource>,
  Layer.Error<RuntimeLayerSource>
> = ManagedRuntime.make(layerRuntime);

export const layer: Layer.Layer<
  Layer.Success<RuntimeLayerSource>,
  Layer.Error<RuntimeLayerSource>
> = Layer.effectContext(runtime.contextEffect);

disposeOnFoundationReplace(typeof module === "undefined" ? undefined : module.hot, () =>
  runtime.dispose(),
);
