import * as NodeHttp from "node:http";
import * as NodeNet from "node:net";
import * as NodeTls from "node:tls";
import { HttpServerRequest } from "effect/http";
import { describe, expect, it } from "vite-plus/test";

import { requiresSocketE2ee } from "./transportTls.ts";

const makeRequest = (
  socket: NodeNet.Socket,
  host: string,
  forwardedProto?: string,
): HttpServerRequest.HttpServerRequest => {
  const request = HttpServerRequest.fromWeb(
    new Request(`http://${host}/ws`, {
      headers: {
        host,
        ...(forwardedProto === undefined ? {} : { "x-forwarded-proto": forwardedProto }),
      },
    }),
  );
  return Object.create(request, {
    source: { value: new NodeHttp.IncomingMessage(socket) },
    headers: { value: request.headers },
  });
};

const socketFrom = (address: string) => {
  const socket = new NodeNet.Socket();
  Object.defineProperty(socket, "remoteAddress", { value: address });
  return socket;
};

describe("WebSocket transport encryption", () => {
  it("requires E2EE on Tailscale HTTPS when forwarded by the local host", () => {
    for (const peer of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
      expect(
        requiresSocketE2ee(makeRequest(socketFrom(peer), "host.example.ts.net:8443", "https")),
      ).toBe(true);
    }
  });

  it("restricts forwarded encryption negotiation to the local Tailnet HTTPS route", () => {
    expect(
      requiresSocketE2ee(makeRequest(socketFrom("100.64.1.2"), "host.example.ts.net", "https")),
    ).toBe(false);
    expect(requiresSocketE2ee(makeRequest(socketFrom("127.0.0.1"), "host.example.ts.net"))).toBe(
      false,
    );
    expect(
      requiresSocketE2ee(
        makeRequest(socketFrom("127.0.0.1"), "host.example.ts.net.evil.test", "https"),
      ),
    ).toBe(false);
  });

  it("requires E2EE when the application itself terminates TLS", () => {
    const socket = new NodeTls.TLSSocket(socketFrom("100.64.1.2"));
    try {
      expect(requiresSocketE2ee(makeRequest(socket, "host.example.ts.net"))).toBe(true);
    } finally {
      socket.destroy();
    }
  });
});
