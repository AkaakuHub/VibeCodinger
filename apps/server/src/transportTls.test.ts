import { Headers } from "effect/http";
import { describe, expect, it } from "vite-plus/test";

import { isTailscaleHttpsForward } from "./transportTls.ts";

describe("Tailscale HTTPS transport", () => {
  const forwardedHttps = Headers.fromInput({
    host: "host.example.ts.net:8443",
    "x-forwarded-proto": "https",
  });

  it("recognizes IPv4 and IPv6 loopback forwarding", () => {
    for (const peer of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
      expect(isTailscaleHttpsForward(peer, forwardedHttps)).toBe(true);
    }
  });

  it("requires a loopback peer and a Tailnet HTTPS destination", () => {
    expect(isTailscaleHttpsForward("100.64.1.2", forwardedHttps)).toBe(false);
    expect(isTailscaleHttpsForward(undefined, forwardedHttps)).toBe(false);
    expect(
      isTailscaleHttpsForward("127.0.0.1", Headers.remove(forwardedHttps, "x-forwarded-proto")),
    ).toBe(false);
    expect(
      isTailscaleHttpsForward(
        "127.0.0.1",
        Headers.set(forwardedHttps, "host", "host.example.ts.net.evil.test"),
      ),
    ).toBe(false);
  });
});
