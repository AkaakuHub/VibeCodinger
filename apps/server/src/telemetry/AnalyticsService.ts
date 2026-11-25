import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export class AnalyticsService extends Context.Service<
  AnalyticsService,
  {
    /** Whether the event was queued to send; false when telemetry is off. */
    readonly record: (
      event: string,
      properties?: Readonly<Record<string, unknown>>,
    ) => Effect.Effect<boolean>;
  }
>()("t3/telemetry/AnalyticsService") {}

export const layerDisabled = Layer.succeed(AnalyticsService, {
  record: Effect.fn("AnalyticsService.record")(() => Effect.succeed(false)),
});
