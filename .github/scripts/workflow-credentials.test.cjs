const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const read = (path) => readFileSync(join(__dirname, "..", path), "utf8");

function jobs(path) {
  const body = read(path).split(/^jobs:\n/m)[1];
  const found = {};
  for (const block of body.split(/^(?=  [\w-]+:\n)/m)) {
    const name = /^  ([\w-]+):\n/.exec(block)?.[1];
    if (name) found[name] = block;
  }
  return found;
}

const runsProjectCode = (block) =>
  /setup-vp@|setup-ci-deps|\b(?:vp|pnpm|npm|npx|xcodebuild) /.test(block);

test("the iPhone package job has read-only repository access", () => {
  const { package: build } = jobs("workflows/fork-ios-ipa.yml");
  assert.match(build, /^ {6}contents: read$/m);
  assert.doesNotMatch(read("workflows/fork-ios-ipa.yml"), /secrets\.|contents: write/);
});

test("fork release write access is isolated from build jobs", () => {
  const {
    desktop,
    ios,
    android,
    "update-manifests": manifests,
    publish,
  } = jobs("workflows/fork-build.yml");
  for (const build of [desktop, ios, android, manifests]) {
    assert.match(build, /^ {6}contents: read$/m);
    assert.doesNotMatch(build, /: write\b/);
  }
  assert.doesNotMatch(ios + android + manifests, /secrets:/);
  assert.doesNotMatch(desktop, /secrets: inherit/);
  assert.deepEqual(Array.from(desktop.matchAll(/secrets\.(\w+)/g), (match) => match[1]).sort(), [
    "APPLE_API_ISSUER",
    "APPLE_API_KEY",
    "APPLE_API_KEY_ID",
    "CSC_KEY_PASSWORD",
    "CSC_LINK",
    "MACOS_PROVISIONING_PROFILE",
  ]);
  assert.match(publish, /^ {6}contents: write$/m);
  assert.doesNotMatch(publish, /actions\/checkout@/);
  assert.ok(!runsProjectCode(publish), "the fork release job runs build code with a write token");
});

test("the Vite+ toolchain is cached before the job installs or runs project code", () => {
  const names = Array.from(
    read("actions/setup-ci-deps/action.yml").matchAll(
      /^ {4}- name: (.+)\n(?: {6}.*\n)*? {6}uses: (\S+)|^ {4}- name: (.+)$/gm,
    ),
    (match) => ({ name: match[1] ?? match[3], uses: match[2] ?? "" }),
  );
  const index = (name) => names.findIndex((step) => step.name === name);
  assert.match(names[index("Restore Vite+")].uses, /^actions\/cache\/restore@/);
  assert.match(names[index("Save Vite+")].uses, /^actions\/cache\/save@/);
  assert.ok(index("Save Vite+") < index("Resolve pnpm store"));
  assert.ok(index("Save Vite+") < index("Install dependencies"));
  // The combined action saves at the end of the job, after everything ran.
  assert.ok(names.every((step) => !step.uses.startsWith("actions/cache@")));
});
