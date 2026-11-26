import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import {
  VIBECODINGER_PROJECT_FILE_NAME,
  type VibeCodingerProjectFile,
} from "@vibecodinger/contracts";
import { VibeCodingerProjectFileFromJson } from "@vibecodinger/shared/vibeCodingerProjectFile";

const decodeVibeCodingerProjectFileJson = Schema.decodeEffect(VibeCodingerProjectFileFromJson);

export class VibeCodingerProjectFileLoadError extends Schema.TaggedError<VibeCodingerProjectFileLoadError>()(
  "VibeCodingerProjectFileLoadError",
  {
    operation: Schema.Literals(["read", "decode"]),
    workspaceRoot: Schema.String,
    filePath: Schema.String,
    cause: Schema.Defect(),
  },
) {
  override get message(): string {
    return `Failed to ${this.operation} ${VIBECODINGER_PROJECT_FILE_NAME} at ${this.filePath}.`;
  }
}

export class VibeCodingerProjectFileLoader extends Context.Service<
  VibeCodingerProjectFileLoader,
  {
    /** Never fails; missing/unreadable/invalid files return none, with warnings for invalid files. */
    readonly load: (workspaceRoot: string) => Effect.Effect<Option.Option<VibeCodingerProjectFile>>;
  }
>()("vibecodinger/project/VibeCodingerProjectFileLoader") {}

const logVibeCodingerProjectFileLoadError = (error: VibeCodingerProjectFileLoadError) =>
  Effect.logWarning(error).pipe(
    Effect.annotateLogs({
      operation: error.operation,
      workspaceRoot: error.workspaceRoot,
      filePath: error.filePath,
      errorTag: error._tag,
    }),
  );

/** @public */
export const make = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const load: VibeCodingerProjectFileLoader["Service"]["load"] = Effect.fn(
    "VibeCodingerProjectFileLoader.load",
  )(function* (workspaceRoot) {
    const filePath = path.join(workspaceRoot, VIBECODINGER_PROJECT_FILE_NAME);
    const raw = yield* fileSystem.readFileString(filePath).pipe(
      Effect.asSome,
      Effect.catchTags({
        PlatformError: (error) =>
          error.reason._tag === "NotFound"
            ? Effect.succeed(Option.none<string>())
            : logVibeCodingerProjectFileLoadError(
                new VibeCodingerProjectFileLoadError({
                  operation: "read",
                  workspaceRoot,
                  filePath,
                  cause: error,
                }),
              ).pipe(Effect.as(Option.none<string>())),
      }),
    );
    if (Option.isNone(raw)) {
      return Option.none<VibeCodingerProjectFile>();
    }
    return yield* decodeVibeCodingerProjectFileJson(raw.value).pipe(
      Effect.asSome,
      Effect.catchTags({
        SchemaError: (error) =>
          logVibeCodingerProjectFileLoadError(
            new VibeCodingerProjectFileLoadError({
              operation: "decode",
              workspaceRoot,
              filePath,
              cause: error,
            }),
          ).pipe(Effect.as(Option.none<VibeCodingerProjectFile>())),
      }),
    );
  });

  return VibeCodingerProjectFileLoader.of({ load });
});

export const layer = Layer.effect(VibeCodingerProjectFileLoader, make);
