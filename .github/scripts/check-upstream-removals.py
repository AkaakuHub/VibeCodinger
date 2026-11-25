"""Preserve fork-owned routes and check upstream proposals without executing their code."""

import argparse
import base64
import hashlib
import os
import re
import subprocess
import sys
from functools import cache
from pathlib import Path
from tempfile import TemporaryDirectory

OLD_PACKAGE_SCOPE = b"@" + b"t3tools/"
PACKAGE_SCOPE = b"@vibecodinger/"

OLD_LINT_PLUGIN = b"oxlint-plugin-" + b"t3code"
LINT_PLUGIN = b"oxlint-plugin-vibecodinger"
OLD_LINT_RULE = b"t3code/" + rb"(no|max|prefer|require|namespace)-"
OLD_LINT_DIAGNOSTIC = b"t3code" + rb"\("
LINT_PLUGIN_METADATA = (b"index.ts", b"test/utils.ts")
PNPMFILE = b".pnpmfile.cjs"
PNPM_LOCKFILE = b"pnpm-lock.yaml"

PROTECTED_PATHS = (
    ".env.example",
    ".task-cache.json",
    "infra/task-cache",
    ".github/actions",
    ".github/scripts",
    ".github/workflows",
    ".github/triage/PLAYBOOK.md",
    "apps/server/src/guest",
    "apps/web/src/routes/guest.tsx",
    "apps/web/public/.well-known/apple-app-site-association.json",
    "apps/web/public/.well-known/assetlinks.json",
    "apps/web/src/components/guest",
    "apps/server/src/cloud/ManagedEndpointRuntime.ts",
    "apps/server/src/cloud/RelayClientLedger.ts",
    "packages/shared/src/relayClient.ts",
    "packages/shared/src/relayTracing.ts",
    "packages/shared/src/relayTracing.test.ts",
    "apps/server/src/triage/triagePrompt.ts",
    "apps/server/src/triage/triagePrompt.test.ts",
    "apps/desktop/src/app/ClerkTokenStore.ts",
    "apps/desktop/src/app/ClerkTokenStore.test.ts",
    "apps/desktop/src/app/DesktopClerk.ts",
    "apps/desktop/src/app/DesktopClerk.test.ts",
    "apps/mobile/src/features/cloud/managedRelayLayer.ts",
    "apps/mobile/src/features/cloud/managedRelayLayer.test.ts",
    "apps/mobile/src/features/cloud/managedRelayTokenStore.ts",
    "apps/mobile/src/features/cloud/managedRelayTokenStore.test.ts",
    "apps/mobile/src/features/cloud/publicConfig.ts",
    "apps/mobile/src/features/cloud/publicConfig.test.ts",
    "apps/web/src/cloud/managedRelayLayer.ts",
    "apps/web/src/cloud/publicConfig.ts",
    "apps/web/src/cloud/publicConfig.test.ts",
    "packages/client-runtime/src/relay/managedRelay.test.ts",
    "packages/client-runtime/src/relay/managedRelayState.ts",
    "packages/client-runtime/src/relay/managedRelayState.test.ts",
    "packages/client-runtime/src/relay/cloudAccountService.ts",
    "packages/client-runtime/src/relay/cloudAccountService.test.ts",
    "apps/mobile/scripts/sourcemap-upload.mts",
    "apps/mobile/scripts/upload-sourcemaps.mts",
    "apps/mobile/modules/t3-agent-notifications",
    "apps/mobile/src/features/agent-awareness/notificationNavigation.ts",
    "apps/mobile/src/features/agent-awareness/remoteRegistration.ts",
    "apps/mobile/src/features/agent-awareness/registrationPayload.ts",
    "apps/mobile/src/features/agent-awareness/liveActivityPreferences.ts",
    "apps/mobile/src/features/connection/CloudEnvironmentRows.tsx",
    "apps/mobile/src/features/connection/ConnectDeviceApprovalCoordinator.tsx",
    "apps/mobile/src/features/connection/connectDeviceApproval.ts",
    "apps/mobile/src/features/settings/SettingsAuthRouteScreen.tsx",
    "apps/mobile/src/features/settings/SettingsNotificationsRouteScreen.tsx",
    "apps/server/src/cli/connect.ts",
    "apps/server/src/cloud/CliState.ts",
    "apps/server/src/cloud/CliTokenManager.ts",
    "apps/server/src/cloud/CloudLink.ts",
    "apps/server/src/cloud/ConnectReachability.ts",
    "apps/server/src/cloud/config.ts",
    "apps/server/src/cloud/http.ts",
    "apps/server/src/cloud/linkChecks.ts",
    "apps/server/src/cloud/publicConfig.ts",
    "apps/server/src/cloud/relayResponse.ts",
    "apps/server/src/cloud/traceRelayRequest.ts",
    "apps/server/src/cloud/traceRelayRequest.test.ts",
    "apps/server/src/cloud/updateHandoff.ts",
    "apps/server/src/cloud/managedTunnelStartup.ts",
    "apps/server/src/cloud/managedTunnelStartup.test.ts",
    "apps/server/src/observability/HeapSnapshot.ts",
    "apps/server/src/observability/OtlpEndpointCheck.ts",
    "apps/server/src/resourceTelemetry/ProcessGroupMetrics.ts",
    "packages/shared/src/otelEnvironment.ts",
    "apps/server/src/relay",
    "apps/server/src/scheduledTasks/RelayDeliveryProof.ts",
    "apps/server/src/telemetry",
    "apps/web/src/cloud",
    "apps/web/src/components/clerk",
    "apps/web/src/components/settings/TelemetryExportSettings.tsx",
    "apps/web/src/components/ConnectDeviceApprovalCoordinator.tsx",
    "apps/web/src/routes/connect.tsx",
    "apps/web/src/routes/approve-agent.tsx",
    "apps/web/src/components/auth/ApproveAgentSurface.tsx",
    "apps/web/src/components/cloud/ConnectOnboardingDialog.tsx",
    "apps/web/src/components/InstallT3Commands.tsx",
    "apps/web/src/state/connectMcpApproval.ts",
    "packages/client-runtime/src/state/connectMcpApproval.ts",
    "infra/relay",
    "packages/client-runtime/src/connectDeviceNotices.ts",
    "packages/client-runtime/src/connectDeviceNotices.test.ts",
)
FORBIDDEN = re.compile(
    re.escape(OLD_PACKAGE_SCOPE) +
    rb"|posthog|captureException\s*\(|sendBeacon\s*\(|opentelemetry/exporter|"
    rb"otlp.{0,48}(?:endpoint|exporter)|cloudflared|"
    rb"server\.checkOtlpEndpoint|TelemetryExportSettings|telemetry-export|"
    rb"ProviderTurnAnalytics|ProviderUsageAnalytics|ProviderDimensions\.ts|ProcessGroupMetrics\.layer|otelEnvironment:\s*(?:OtelEnvironment|otel)\b|"
    rb"RelayClientTracer|withRelayClientTracing|getRelayTelemetryEnabled|parsePersistedServerObservabilitySettings|observabilitySettings\.otlp|"
    rb"\b(?:t3Home|t3_home|t3-home)\b|"
    rb"VIBECODINGER_RELAY_URL|HttpApiClient\.make\(RelayApi\b|"
    rb"relay_public_config|relay.client.tracing.config|VIBECODINGER_TELEMETRY_CHANNEL|"
    rb"MOBILE_SOURCEMAPS_R2|upload-sourcemaps\.mts|mobileSourceMapsUploadCredentials|"
    rb"armAgentAwarenessLiveActivityForLocalWork|setAgentAwarenessRelayTokenProvider|registerLiveActivityWithRelay|"
    rb"expo-notifications|firebase-messaging|com\.google\.firebase\.MESSAGING_EVENT|"
    rb"VIBECODINGER_ANDROID_GOOGLE_SERVICES_FILE|AgentMessagingService|enablePushNotifications\s*[:=]\s*true|"
    rb"tailscale.{0,48}funnel|--allow-funnel|https?://[^\s'\x22]*(?:relay|clerk)\.t3\.codes|"
    rb"t3-task-cache\.pinglabs\.workers\.dev|"
    rb"@clerk/(?:expo|react|electron)|cloudAuthProvider|managedAuthShell|"
    rb"layerCloudDesiredLinkReconcile|managedTunnelStartup|watchManagedTunnelOrigin|hostedApprovalUrl|agentApprovalAppUrlConfig|"
    rb"GuestShareService\.layer|guestShareCreate|guestShare\.create|CloudManagedEndpointRuntime|/api/guest/|"
    rb"cloudGetRelayClientStatus|cloudInstallRelayClient|cloud\.(?:getRelayClientStatus|installRelayClient)|RelayClientInstallDialog|"
    rb"CloudHttp\.layer|HttpApiBuilder\.layer\(EnvironmentHttpApi\).*connect|"
    rb"CODEX_INTERNAL_ORIGINATOR_OVERRIDE\s*:|CLAUDE_CODE_ENTRYPOINT\s*:\s*['\x22]t3-code|"
    rb"com\.t3tools\.t3code|"
    rb"VIBECODINGER_REPOSITORY_URL.{0,64}github\.com/pingdotgg/t3code|"
    rb"usePrimaryCloudLinkState|useCloudLinkState|PhoneConnectLink|WebhookDeliveryMode|"
    rb"CloudLinkRow|CloudRemoteEnvironmentRows|useCloudLinkController|relayHttpBaseUrl|t3ConnectMcpUrl|"
    rb"Outside MCP clients get app\.t3\.codes|"
    rb"https://t3\.codes/(?:install[.]|download|mobile)|buildHostedPairingUrl|resolveHostedPairingUrl|DEFAULT_HOSTED_APP_URL|https://app\.t3\.codes\b|"
    rb"relayHookBaseUrl|RelayDeliveryProof|traceAuthenticatedRelayRequest|connectSubcommands|writeHeapSnapshot\s*\(",
    re.IGNORECASE,
)
SOURCE_SUFFIXES = (
    ".js", ".ts", ".mjs", ".cjs", ".mts", ".cts", ".tsx", ".jsx", ".json", ".yml", ".yaml",
    ".sh", ".ps1", ".swift", ".kt", ".gradle", ".kts", ".xml",
)
FORK_GUARDS = (
    ("apps/server/src/server.ts", b"HttpApiBuilder.layer(EnvironmentServerHttpApi)"),
    ("apps/server/src/policy/ManagedPolicy.ts", b"connectDisabled: true"),
    ("apps/web/vite.config.ts", b'const configuredClerkPublishableKey = "";'),
)


def git(*args, data=None, env=None):
    return subprocess.run(["git", *args], input=data, env=env, capture_output=True, check=True).stdout


def normalized_names(contents, *, lint_metadata=False):
    contents = contents.replace(OLD_PACKAGE_SCOPE, PACKAGE_SCOPE)
    contents = contents.replace(OLD_LINT_PLUGIN, LINT_PLUGIN)
    contents = contents.replace(OLD_LINT_DIAGNOSTIC, rb"vibecodinger\(")
    contents = re.sub(OLD_LINT_RULE, rb"vibecodinger/\1-", contents)
    if lint_metadata:
        contents = contents.replace(b'name: "t3code"', b'name: "vibecodinger"')
    return contents


@cache
def renamed_package_blob(object_id, lint_metadata=False, pnpmfile_checksum=None):
    contents = normalized_names(git("cat-file", "blob", object_id), lint_metadata=lint_metadata)
    if pnpmfile_checksum is not None:
        contents = re.sub(
            rb"(?m)^pnpmfileChecksum: sha256-.*$",
            b"pnpmfileChecksum: sha256-" + pnpmfile_checksum,
            contents,
            count=1,
        )
    return git("hash-object", "-w", "--stdin", data=contents).strip()


def normalize_package_names(tree):
    pattern = b"|".join((OLD_PACKAGE_SCOPE, OLD_LINT_PLUGIN, OLD_LINT_RULE, re.escape(OLD_LINT_DIAGNOSTIC)))
    matches = subprocess.run(
        ["git", "grep", "-I", "-l", "-z", "-E", "--no-textconv", pattern.decode(), tree, "--"],
        capture_output=True,
    )
    if matches.returncode == 1:
        return git("rev-parse", f"{tree}^{{tree}}").decode().strip()
    matches.check_returncode()
    paths = {record.split(b":", 1)[1] for record in matches.stdout.split(b"\0") if record}

    entries = {}
    for entry in git("ls-tree", "-r", "-z", tree).split(b"\0"):
        if entry:
            metadata, path = entry.split(b"\t", 1)
            mode, _, object_id = metadata.split()
            entries[path] = (mode, object_id)

    pnpmfile_checksum = None
    if PNPMFILE in paths and PNPM_LOCKFILE in entries:
        contents = normalized_names(git("cat-file", "blob", entries[PNPMFILE][1]))
        pnpmfile_checksum = base64.b64encode(hashlib.sha256(contents).digest())
        paths.add(PNPM_LOCKFILE)

    updates = []
    obsolete_paths = []
    for path, (mode, object_id) in entries.items():
        target = path
        lint_metadata = False
        if path.startswith(OLD_LINT_PLUGIN + b"/"):
            obsolete_paths.append(path)
            relative = path.removeprefix(OLD_LINT_PLUGIN + b"/")
            target = LINT_PLUGIN + b"/" + relative
            lint_metadata = relative in LINT_PLUGIN_METADATA
        if (path in paths or lint_metadata) and mode in (b"100644", b"100755"):
            object_id = renamed_package_blob(
                object_id,
                lint_metadata=lint_metadata,
                pnpmfile_checksum=pnpmfile_checksum if path == PNPM_LOCKFILE else None,
            )
        if path in paths or target != path:
            updates.append(mode + b" " + object_id + b"\t" + target + b"\0")
    with TemporaryDirectory(prefix="vibecodinger-upstream-index-") as temp:
        env = {**os.environ, "GIT_INDEX_FILE": str(Path(temp) / "index")}
        git("read-tree", tree, env=env)
        if obsolete_paths:
            git("update-index", "--force-remove", "-z", "--stdin", data=b"\0".join(obsolete_paths) + b"\0", env=env)
        git("update-index", "-z", "--index-info", data=b"".join(updates), env=env)
        return git("write-tree", env=env).decode().strip()


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
    parser.add_argument("mode", choices=["normalize-package-names", "restore", "verify"])
    parser.add_argument("base")
    parser.add_argument("target")
    args = parser.parse_args()
    if args.mode == "normalize-package-names":
        print(normalize_package_names(args.base), normalize_package_names(args.target))
        return 0
    if args.mode == "restore":
        restore(args.base, args.target)
        return 0
    return int(verify(args.base, args.target))


if __name__ == "__main__":
    sys.exit(main())
