import { expect } from "e2e";

import { test, WEB } from "./vc.ts";

test("An invalid host filter keeps the Issues page open", WEB, async ({ vc, app, browser }) => {
  await vc.project("demo");
  await vc.open("/issues?host=true");

  await app.screenshot("issues-invalid-host");
  await expect(browser.locator("h1")).toHaveText("Issues");
});
