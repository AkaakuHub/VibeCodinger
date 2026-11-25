import { expect } from "e2e";

import { test, WEB } from "./vc.ts";

test(
  "Tab moves from the add-project Git URL field to its submit button",
  WEB,
  async ({ vc, app, screen, browser }) => {
    await vc.project("demo");
    await vc.open();

    await screen.getByRole("combobox", "Projects").tap();
    await screen.getByRole("option", "Add project").tap();
    await screen.getByText("Git URL").tap();
    await screen.getByRole("combobox").fill("https://github.com/pingdotgg/t3code.git");
    const submit = screen.getByRole("button", "Continue (Enter)");
    await expect(submit).toBeEnabled();

    await browser.keyboard.press("Tab");
    await app.screenshot("after-tab");
    await expect(submit).toBeFocused();
  },
);
