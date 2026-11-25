import { assert, it } from "@effect/vitest";

import {
  repositoryPathFromRemoteUrl,
  transportSafeSourceControlErrorValue,
} from "./SourceControlProvider.ts";

it("removes URL credentials, query parameters, and fragments from error transport values", () => {
  assert.strictEqual(
    transportSafeSourceControlErrorValue(
      "https://user:secret@example.test/org/repo/pull/42?token=secret#discussion",
    ),
    "https://example.test/org/repo/pull/42",
  );
});

it.each([
  ["git@github.com:VibeCodingerTools/t3code.git", "VibeCodingerTools/t3code"],
  ["github.com:VibeCodingerTools/t3code.git", "VibeCodingerTools/t3code"],
  ["gitlab.com:VibeCodingerTools/platform/t3code", "VibeCodingerTools/platform/t3code"],
  ["https://github.com/VibeCodingerTools/t3code.git", "VibeCodingerTools/t3code"],
  ["https://github.com/VibeCodingerTools/t3code.git?view=compact", "VibeCodingerTools/t3code"],
  ["https://github.com/VibeCodingerTools/t3code.git#section", "VibeCodingerTools/t3code"],
  ["C:/repos/t3code", null],
])("reads the repository path of %s", (remoteUrl, expected) => {
  assert.strictEqual(repositoryPathFromRemoteUrl(remoteUrl), expected);
});
