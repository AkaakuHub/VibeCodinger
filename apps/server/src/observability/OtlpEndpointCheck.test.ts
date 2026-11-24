import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import * as OtlpEndpointCheck from "./OtlpEndpointCheck.ts";

it.effect("rejects endpoint checks without an HTTP client", () =>
  Effect.gen(function* () {
    const checker = yield* OtlpEndpointCheck.OtlpEndpointCheck;
    const result = yield* checker.check({
      signal: "traces",
      url: "https://collector.example.test/v1/traces",
    });
    assert.equal(result._tag, "Unreachable");
  }).pipe(Effect.provide(OtlpEndpointCheck.layer)),
);
