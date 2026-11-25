import * as Schema from "effect/Schema";

const RelayClientStatusSchema = Schema.Union([
  Schema.Struct({
    status: Schema.Literal("available"),
    executablePath: Schema.String,
    source: Schema.Literals(["override", "managed", "path"]),
    version: Schema.String,
  }),
  Schema.Struct({
    status: Schema.Literal("missing"),
    version: Schema.String,
  }),
  Schema.Struct({
    status: Schema.Literal("unsupported"),
    platform: Schema.String,
    arch: Schema.String,
    version: Schema.String,
  }),
]);

const RelayClientInstallProgressStageSchema = Schema.Literals([
  "checking",
  "waiting_for_lock",
  "downloading",
  "verifying",
  "installing",
  "validating",
  "activating",
]);
export type RelayClientInstallProgressStage = typeof RelayClientInstallProgressStageSchema.Type;

const RelayClientInstallProgressEventSchema = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("progress"),
    stage: RelayClientInstallProgressStageSchema,
  }),
  Schema.Struct({
    type: Schema.Literal("complete"),
    status: RelayClientStatusSchema,
  }),
]);
export type RelayClientInstallProgressEvent = typeof RelayClientInstallProgressEventSchema.Type;
