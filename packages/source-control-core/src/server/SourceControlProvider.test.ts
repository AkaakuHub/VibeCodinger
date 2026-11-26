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
  ["git@github.com:ExampleOrg/t3code.git", "ExampleOrg/t3code"],
  ["github.com:ExampleOrg/t3code.git", "ExampleOrg/t3code"],
  ["gitlab.com:ExampleOrg/platform/t3code", "ExampleOrg/platform/t3code"],
  ["https://github.com/ExampleOrg/t3code.git", "ExampleOrg/t3code"],
  ["https://github.com/ExampleOrg/t3code.git?view=compact", "ExampleOrg/t3code"],
  ["https://github.com/ExampleOrg/t3code.git#section", "ExampleOrg/t3code"],
  ["C:/repos/t3code", null],
])("reads the repository path of %s", (remoteUrl, expected) => {
  assert.strictEqual(repositoryPathFromRemoteUrl(remoteUrl), expected);
});
