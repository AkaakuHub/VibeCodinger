import * as Schema from "effect/Schema";
import { describe, expect, it } from "vite-plus/test";

import {
  parseVibeCodingerProjectFile,
  VibeCodingerProjectFileFromJson,
} from "./vibeCodingerProjectFile.ts";

const decodeJson = Schema.decodeUnknownSync(VibeCodingerProjectFileFromJson);

describe("VibeCodingerProjectFileFromJson", () => {
  it("decodes lenient JSONC with comments and trailing commas", () => {
    const decoded = decodeJson(`{
      // team scripts
      "iconPath": "assets/logo.svg",
      "scripts": [
        { "name": "Dev", "command": "pnpm dev", "stopOnSettle": true, },
      ],
    }`);

    expect(decoded.iconPath).toBe("assets/logo.svg");
    expect(decoded.scripts?.[0]).toEqual({ name: "Dev", command: "pnpm dev", stopOnSettle: true });
  });
});

describe("parseVibeCodingerProjectFile", () => {
  it("reads project defaults from JSONC with a URL in a block comment", () => {
    expect(
      parseVibeCodingerProjectFile(`{
        /* See https://raw.githubusercontent.com/AkaakuHub/VibeCodinger/main/docs/schema/vibecodinger.json */
        "defaultThreadEnvMode": "worktree"
      }`),
    ).toEqual({ defaultThreadEnvMode: "worktree" });
  });
});
