import { describe, expect, it } from "vite-plus/test";

import { resolveDesktopPairingUrl } from "./pairingUrls";

describe("settings pairing URL helpers", () => {
  it.each(["http://192.168.1.44:3773", "https://host.tailnet.example.ts.net:3773"])(
    "uses the selected backend origin for %s",
    (endpoint) => {
      const url = new URL(resolveDesktopPairingUrl(endpoint, "PAIRCODE"));
      expect(url.origin).toBe(endpoint);
      expect(url.pathname).toBe("/pair");
      expect(url.search).toBe("");
      expect(url.hash).toBe("#token=PAIRCODE");
    },
  );
});
