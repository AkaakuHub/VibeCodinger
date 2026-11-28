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
<<<<<<< 7fa8be15bd9b767bd51bc62484531cfe73d3a751
  ["git@github.com:ExampleOrg/t3code.git", "ExampleOrg/t3code"],
  ["github.com:ExampleOrg/t3code.git", "ExampleOrg/t3code"],
  ["gitlab.com:ExampleOrg/platform/t3code", "ExampleOrg/platform/t3code"],
  ["https://github.com/ExampleOrg/t3code.git", "ExampleOrg/t3code"],
  ["https://github.com/ExampleOrg/t3code.git?view=compact", "ExampleOrg/t3code"],
  ["https://github.com/ExampleOrg/t3code.git#section", "ExampleOrg/t3code"],
=======
  ["git@github.com:T3Tools/t3code.git", "T3Tools/t3code"],
  ["git@github.com:/T3Tools/t3code.git", "T3Tools/t3code"],
  ["github.com:T3Tools/t3code.git", "T3Tools/t3code"],
  ["github.com:/T3Tools/t3code.git", "T3Tools/t3code"],
  ["gitlab.com:T3Tools/platform/t3code", "T3Tools/platform/t3code"],
  ["hg::user@host:Owner/Repo.git", null],
  ["https://github.com/T3Tools/t3code.git", "T3Tools/t3code"],
  ["https://github.com/T3Tools/t3code.git?view=compact", "T3Tools/t3code"],
  ["https://github.com/T3Tools/t3code.git#section", "T3Tools/t3code"],
>>>>>>> ab1915b658e54d665e29fef824087a41186706cd
  ["C:/repos/t3code", null],
  ["file:///tmp/T3Tools/t3code.git", null],
])("reads the repository path of %s", (remoteUrl, expected) => {
  assert.strictEqual(repositoryPathFromRemoteUrl(remoteUrl), expected);
});
