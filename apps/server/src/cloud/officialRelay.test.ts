import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Result from "effect/Result";
import * as HttpClient from "effect/http/HttpClient";

import { layerWithoutOfficialRelay } from "./officialRelay.ts";

it.effect("blocks official relay requests at the HTTP transport", () =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const result = yield* client.get("https://relay.t3.codes./v1/config").pipe(Effect.result);
    assert.isTrue(Result.isFailure(result));
    if (Result.isFailure(result)) {
      assert.isUndefined(result.failure.reason.cause);
    }
  }).pipe(Effect.provide(layerWithoutOfficialRelay)),
);
