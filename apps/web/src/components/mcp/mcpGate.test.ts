import { describe, expect, it } from "vite-plus/test";
import {
  BearerConnectionTarget,
  RelayConnectionTarget,
  SshConnectionTarget,
} from "@vibecodinger/client-runtime/connection";
import { EnvironmentId } from "@vibecodinger/contracts";

import { resolveMcpGate } from "./mcpGate";

const identity = { environmentId: EnvironmentId.make("host"), label: "Host" };
const direct = new BearerConnectionTarget({ ...identity, connectionId: "direct" });
const ready = {
  connected: true,
  approvalCodes: true,
  connection: {
    target: direct,
    httpBaseUrl: "https://host.example.ts.net/base?token=value#fragment",
  },
};

describe("direct MCP setup", () => {
  it("uses the active host without forwarding the request path or credentials", () => {
    expect(resolveMcpGate(ready)).toEqual({
      kind: "open",
      mcpUrl: "https://host.example.ts.net/mcp",
    });
  });

  it.each(["http://127.0.0.1:3773", "http://[::1]:3773"])(
    "allows local setup at %s",
    (httpBaseUrl) => {
      expect(resolveMcpGate({ ...ready, connection: { target: direct, httpBaseUrl } })).toEqual({
        kind: "open",
        mcpUrl: httpBaseUrl + "/mcp",
      });
    },
  );

  it.each([
    "http://host.example.ts.net",
    "https://user:pass@host.example.ts.net",
    "https://host(example).test",
    "http://0.0.0.0:3773",
    "file:///mcp",
  ])("does not publish an MCP address from %s", (httpBaseUrl) => {
    expect(resolveMcpGate({ ...ready, connection: { target: direct, httpBaseUrl } }).kind).toBe(
      "unavailable",
    );
  });

  it.each([
    new RelayConnectionTarget(identity),
    new SshConnectionTarget({ ...identity, connectionId: "forward" }),
  ])("does not use the %s address", (target) => {
    expect(resolveMcpGate({ ...ready, connection: { ...ready.connection, target } }).kind).toBe(
      "unavailable",
    );
  });

  it("waits for both the connection and the approval capability", () => {
    expect(resolveMcpGate({ ...ready, connected: false }).kind).toBe("disconnected");
    expect(resolveMcpGate({ ...ready, connection: null }).kind).toBe("checking");
    expect(resolveMcpGate({ ...ready, approvalCodes: undefined }).kind).toBe("checking");
    expect(resolveMcpGate({ ...ready, approvalCodes: false }).kind).toBe("update");
  });
});
