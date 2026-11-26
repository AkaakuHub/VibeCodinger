const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const { RELEASE_PACKAGE_FILES, setReleaseVersion } = require("./set-release-version.cjs");

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

const steps = (block) => block.split(/^ {4,6}- /m).slice(1);
const runsProjectCode = (block) =>
  /setup-vp@|setup-ci-deps|\b(?:vp|pnpm|npm|npx|xcodebuild) /.test(block);

test("npm publishing is bound to the environment that admits only main and v* tags", () => {
  const publish = jobs("workflows/release.yml").publish_cli;
  assert.match(publish, /^ {6}id-token: write$/m);
  assert.match(publish, /^ {4}environment: production$/m);
});

test("the iPhone package job has read-only repository access", () => {
  const { package: build, "draft-release": publish } = jobs("workflows/fork-ios-ipa.yml");
  assert.match(build, /^ {6}contents: read$/m);
  assert.doesNotMatch(build, /secrets\.|contents: write/);
  assert.match(publish, /^ {6}contents: write$/m);
  assert.ok(!runsProjectCode(publish), "the draft release job runs build code with a write token");
});

test("the release version bump is pushed by a job that installs nothing, with a token for this repository only", () => {
  const { finalize } = jobs("workflows/release.yml");
  const mint = steps(finalize).find((step) => step.includes("create-github-app-token"));
  assert.doesNotMatch(mint, /^\s+(?:owner|repositories):/m);
  assert.match(mint, /^\s+permission-contents: write$/m);
  assert.ok(!runsProjectCode(finalize), "finalize holds a write token and runs code");
  assert.match(finalize, /run: node \.github\/scripts\/set-release-version\.cjs /);
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

test("a release version bump rewrites only the version of each release manifest", () => {
  const listed = /releasePackageFiles = \[\n([^\]]+)\]/.exec(
    read("../scripts/lib/tagged-source-version.ts"),
  )[1];
  assert.deepEqual(
    RELEASE_PACKAGE_FILES,
    Array.from(listed.matchAll(/"([^"]+)"/g), (m) => m[1]),
  );
  for (const file of RELEASE_PACKAGE_FILES) {
    const manifest = read(`../${file}`);
    const next = setReleaseVersion(manifest, "98.7.6");
    assert.equal(JSON.parse(next).version, "98.7.6");
    assert.deepEqual(
      { ...JSON.parse(next), version: "" },
      { ...JSON.parse(manifest), version: "" },
    );
    assert.equal(setReleaseVersion(next, "98.7.6"), next);
    assert.deepEqual(
      next.split("\n").filter((line, index) => line !== manifest.split("\n")[index]).length,
      1,
    );
  }
  for (const version of ["", "1", "1.2", "v1.2.3", '1.2.3", "x": "y']) {
    assert.throws(() => setReleaseVersion('{\n  "version": "1.0.0"\n}\n', version), /Invalid/);
  }
  assert.equal(
    setReleaseVersion('{\n  "version": "1.0.0"\n}\n', "1.2.3-rc.1"),
    '{\n  "version": "1.2.3-rc.1"\n}\n',
  );
  assert.throws(() => setReleaseVersion('{\n  "name": "x"\n}\n', "1.2.3"), /exactly one/);
});
