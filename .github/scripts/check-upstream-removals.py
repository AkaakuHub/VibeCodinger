"""Preserve fork-owned routes and check upstream proposals without executing their code."""

import argparse
import os
import re
import subprocess
import sys
from functools import cache
from pathlib import Path
from tempfile import TemporaryDirectory

OLD_PACKAGE_SCOPE = b"@" + b"t3tools/"
PACKAGE_SCOPE = b"@vibecodinger/"

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
    "apps/web/src/components/guest",
    "apps/server/src/cloud/ManagedEndpointRuntime.ts",
    "apps/server/src/cloud/RelayClientLedger.ts",
    "packages/shared/src/relayClient.ts",
    "apps/server/src/triage/triagePrompt.ts",
    "apps/server/src/triage/triagePrompt.test.ts",
    "apps/desktop/src/app/ClerkTokenStore.ts",
    "apps/desktop/src/app/ClerkTokenStore.test.ts",
    "apps/desktop/src/app/DesktopClerk.ts",
    "apps/desktop/src/app/DesktopClerk.test.ts",
    "apps/mobile/src/features/cloud",
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
    rb"ProcessGroupMetrics\.layer|otelEnvironment:\s*(?:OtelEnvironment|otel)\b|"
    rb"getRelayTelemetryEnabled|parsePersistedServerObservabilitySettings|observabilitySettings\.otlp|"
    rb"\b(?:t3Home|t3_home|t3-home)\b|"
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
    ("apps/web/vite.config.ts", b'const configuredRelayUrl = "";'),
    ("apps/web/vite.config.ts", b'const configuredClerkPublishableKey = "";'),
)


def git(*args, data=None, env=None):
    return subprocess.run(["git", *args], input=data, env=env, capture_output=True, check=True).stdout


@cache
def renamed_package_blob(object_id):
    contents = git("cat-file", "blob", object_id)
    return git("hash-object", "-w", "--stdin", data=contents.replace(OLD_PACKAGE_SCOPE, PACKAGE_SCOPE)).strip()


def normalize_package_names(tree):
    matches = subprocess.run(
        ["git", "grep", "-I", "-l", "-z", "-F", "--no-textconv", OLD_PACKAGE_SCOPE.decode(), tree, "--"],
        capture_output=True,
    )
    if matches.returncode == 1:
        return git("rev-parse", f"{tree}^{{tree}}").decode().strip()
    matches.check_returncode()
    paths = {record.split(b":", 1)[1] for record in matches.stdout.split(b"\0") if record}
    updates = []
    for entry in git("ls-tree", "-r", "-z", tree).split(b"\0"):
        if not entry:
            continue
        metadata, path = entry.split(b"\t", 1)
        mode, _, object_id = metadata.split()
        if path in paths and mode in (b"100644", b"100755"):
            updates.append(mode + b" " + renamed_package_blob(object_id) + b"\t" + path + b"\0")
    with TemporaryDirectory(prefix="vibecodinger-upstream-index-") as temp:
        env = {**os.environ, "GIT_INDEX_FILE": str(Path(temp) / "index")}
        git("read-tree", tree, env=env)
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
