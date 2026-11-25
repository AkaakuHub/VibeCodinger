import { expect } from "e2e";

import { test, WEB } from "./vc.ts";

test(
  "A seeded thread opens by its link and shows its history",
  WEB,
  async ({ vc, app, screen }) => {
    const project = await vc.project("demo");
    const thread = await vc.thread({
      project,
      title: "Earlier work",
      messages: ["first", "second"],
    });
    await vc.open(thread);

    await expect(screen.getByText("second fixture turn complete", { exact: false })).toBeVisible();
    await app.screenshot("thread");
  },
);
