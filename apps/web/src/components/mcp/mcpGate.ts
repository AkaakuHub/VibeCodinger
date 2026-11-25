import type { PreparedConnection } from "@vibecodinger/client-runtime/connection";
import { isLocalLoopbackHost } from "@vibecodinger/shared/hostClassification";
import { parseUrl } from "@vibecodinger/shared/url";

type McpGate =
  | { readonly kind: "disconnected" | "checking" | "update" | "unavailable" }
  | { readonly kind: "open"; readonly mcpUrl: string };

export function resolveMcpGate(input: {
  readonly connected: boolean;
  readonly approvalCodes: boolean | undefined;
  readonly connection: Pick<PreparedConnection, "target" | "httpBaseUrl"> | null;
}): McpGate {
  if (!input.connected) return { kind: "disconnected" };
  if (input.approvalCodes === undefined || input.connection === null) return { kind: "checking" };
  if (!input.approvalCodes) return { kind: "update" };
  const { target, httpBaseUrl } = input.connection;
  if (target._tag !== "PrimaryConnectionTarget" && target._tag !== "BearerConnectionTarget") {
    return { kind: "unavailable" };
  }
  const url = parseUrl(httpBaseUrl);
  if (
    url === null ||
    url.username ||
    url.password ||
    !/^[a-z0-9.:[\]-]+$/i.test(url.hostname) ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalLoopbackHost(url.hostname)))
  ) {
    return { kind: "unavailable" };
  }
  return { kind: "open", mcpUrl: new URL("/mcp", url.origin).toString() };
}
