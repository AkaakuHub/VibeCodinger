import type { ServerProviderUsageWindow } from "@vibecodinger/contracts";
import * as DateTime from "effect/DateTime";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

const UsageOutput = Schema.Struct({
  status: Schema.Literal("SUCCESS"),
  command: Schema.Struct({
    name: Schema.Literal("usage"),
    data: Schema.Struct({
      groups: Schema.Array(
        Schema.Struct({
          name: Schema.NonEmptyString,
          buckets: Schema.Array(
            Schema.Struct({
              id: Schema.NonEmptyString,
              name: Schema.NonEmptyString,
              window: Schema.String,
              remaining_fraction: Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 })),
              reset_time: Schema.optional(Schema.String),
            }),
          ),
        }),
      ),
    }),
  }),
});

const decodeUsageOutput = Schema.decodeUnknownOption(Schema.fromJsonString(UsageOutput));

export function parseAntigravityCliUsage(stdout: string): ReadonlyArray<ServerProviderUsageWindow> {
  const decoded = decodeUsageOutput(stdout);
  if (Option.isNone(decoded)) return [];
  return decoded.value.command.data.groups.flatMap((group) =>
    group.buckets.map((bucket) => {
      const reset = bucket.reset_time ? DateTime.make(bucket.reset_time) : Option.none();
      const isWeekly = bucket.window === "weekly";
      const isSession = bucket.window === "5h";
      return {
        id: bucket.id,
        label: `${group.name}: ${bucket.name}`,
        kind: isWeekly ? "weekly" : isSession ? "session" : "other",
        usedPercent: (1 - bucket.remaining_fraction) * 100,
        ...(Option.isSome(reset) ? { resetsAt: DateTime.formatIso(reset.value) } : {}),
        ...(isWeekly
          ? { windowDurationMins: 10_080 }
          : isSession
            ? { windowDurationMins: 300 }
            : {}),
      };
    }),
  );
}
