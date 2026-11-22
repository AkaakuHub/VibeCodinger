import * as NodeOS from "node:os";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";

export const readAntigravityGlobalInstructions = Effect.fn("readAntigravityGlobalInstructions")(
  function* (fileSystem: FileSystem.FileSystem, path: Path.Path) {
    const filePath = path.join(NodeOS.homedir(), ".gemini", "AGENTS.md");
    if (!(yield* fileSystem.exists(filePath))) return undefined;
    const contents = yield* fileSystem.readFileString(filePath);
    return contents.trim() || undefined;
  },
);
