"""Preserve fork-owned routes and check upstream proposals without executing their code."""

import argparse
import re
import subprocess
import sys

PROTECTED_PATHS = (
    ".task-cache.json",
    ".github/actions",
    ".github/scripts",
    ".github/workflows",
    "apps/mobile/src/features/cloud",
    "apps/server/src/cli/connect.ts",
    "apps/server/src/cloud/CliTokenManager.ts",
    "apps/server/src/cloud/CloudLink.ts",
    "apps/server/src/cloud/ConnectReachability.ts",
    "apps/server/src/cloud/http.ts",
    "apps/server/src/observability/HeapSnapshot.ts",
    "apps/server/src/relay",
    "apps/server/src/telemetry",
    "apps/web/src/cloud",
    "apps/web/src/components/clerk",
    "apps/web/src/routes/connect.tsx",
    "infra/relay",
)
FORBIDDEN = re.compile(
    rb"posthog|captureException\s*\(|sendBeacon\s*\(|opentelemetry/exporter|"
    rb"otlp.{0,48}(?:endpoint|exporter)|cloudflared|"
    rb"tailscale.{0,48}funnel|--allow-funnel|https?://[^\s'\x22]*(?:relay|clerk)\.t3\.codes|"
    rb"t3-task-cache\.pinglabs\.workers\.dev|"
    rb"@clerk/(?:expo|react|electron)|cloudAuthProvider|managedAuthShell|"
    rb"connectSubcommands|writeHeapSnapshot\s*\(",
    re.IGNORECASE,
)
SOURCE_SUFFIXES = (".js", ".ts", ".mjs", ".cjs", ".tsx", ".jsx", ".json", ".yml", ".yaml", ".sh", ".ps1", ".swift", ".kt")
FORK_GUARDS = (
    ("apps/server/src/policy/ManagedPolicy.ts", b"connectDisabled: true"),
    ("apps/web/vite.config.ts", b'const configuredRelayUrl = "";'),
    ("apps/web/vite.config.ts", b'const configuredClerkPublishableKey = "";'),
)


def git(*args, data=None):
    return subprocess.run(["git", *args], input=data, capture_output=True, check=True).stdout


def changed_paths(base, target, paths=()):
    raw = git("diff", "--no-ext-diff", "--no-textconv", "--no-renames", "--name-only", "-z", base, target, "--", *paths)
    return tuple(path.decode(errors="surrogateescape") for path in raw.split(b"\0") if path)


def restore(base, target):
    paths = changed_paths(base, target, PROTECTED_PATHS)
    if not paths:
        return
    candidate = git("ls-files", "-z", "--", *PROTECTED_PATHS)
    git("update-index", "--force-remove", "-z", "--stdin", data=candidate)
    original = git("ls-tree", "-r", "-z", base, "--", *PROTECTED_PATHS)
    git("update-index", "-z", "--index-info", data=original)
    for path in paths:
        print(repr(path))


def verify(base, target):
    violations = [(path, "fork-owned file changed") for path in changed_paths(base, target, PROTECTED_PATHS)]
    changed = changed_paths(base, target)
    for path, marker in FORK_GUARDS:
        if path in changed:
            entries = git("ls-tree", target, "--", path)
            if not entries or marker not in git("show", f"{target}:{path}"):
                violations.append((path, f"fork safeguard missing: {marker.decode()}"))
    for path in changed:
        if not path.endswith(SOURCE_SUFFIXES):
            continue
        diff = git("diff", "--no-ext-diff", "--no-textconv", "--no-renames", "--no-color", "-U0", base, target, "--", path)
        if any(line.startswith(b"+") and not line.startswith(b"+++") and FORBIDDEN.search(line[1:]) for line in diff.splitlines()):
            violations.append((path, "added code matches a removed feature"))
    for path, reason in violations:
        print(f"{path!r} — {reason}", file=sys.stderr)
    return bool(violations)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["restore", "verify"])
    parser.add_argument("base")
    parser.add_argument("target")
    args = parser.parse_args()
    if args.mode == "restore":
        restore(args.base, args.target)
        return 0
    return int(verify(args.base, args.target))


if __name__ == "__main__":
    sys.exit(main())
