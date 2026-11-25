import hermesLogo from "./logos/hermes.png";
import openClawLogo from "./logos/openclaw.png";
import { msg } from "gt-react";

export interface McpApp {
  readonly id: string;
  readonly name: string;
  readonly logo: string;
  readonly commands: (url: string) => readonly string[];
  readonly steps: readonly string[];
  readonly note?: string;
  readonly docs: string;
}

export const MCP_APPS: readonly McpApp[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    logo: openClawLogo,
    commands: (url) => [
      // Its MCP commands refuse to write while the Gateway runs.
      "openclaw gateway stop",
      `openclaw mcp add vibecodinger --url '${url}' --transport streamable-http --auth oauth`,
      "openclaw mcp login vibecodinger",
      "openclaw gateway start",
    ],
    steps: [
      msg("Open the Control UI, then + and Plugins, and choose Add MCP server."),
      msg("Paste the URL, and choose Streamable HTTP and OAuth."),
      msg("Select Sign in for it under Settings → MCP."),
    ],
    docs: "https://docs.openclaw.ai/tools/mcp",
  },
  {
    id: "hermes-agent",
    name: "Hermes Agent",
    logo: hermesLogo,
    commands: (url) => [
      // `add` signs in on its first connection (30 s by default, too short to get a code);
      // `login` would clear that sign-in and need a second code.
      `hermes mcp add vibecodinger --url '${url}' --auth oauth --connect-timeout 315`,
    ],
    steps: [
      msg(
        "Add vibecodinger under mcp_servers in ~/.hermes/config.yaml, with the URL and auth: oauth.",
      ),
      msg("Run hermes mcp login vibecodinger."),
    ],
    note: msg("On a remote host, paste the final URL back when asked."),
    docs: "https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp",
  },
];

export const OTHER_MCP_APP_STEPS = [msg("Add a remote MCP server with OAuth.")] as const;
