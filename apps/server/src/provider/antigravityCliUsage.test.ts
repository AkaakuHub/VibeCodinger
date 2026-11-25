import { expect, it } from "vite-plus/test";

import { parseAntigravityCliUsage } from "./antigravityCliUsage.ts";

it("maps the CLI's quota groups to session and weekly limits", () => {
  const stdout = JSON.stringify({
    status: "SUCCESS",
    command: {
      name: "usage",
      data: {
        groups: [
          {
            name: "Gemini Models",
            buckets: [
              { id: "gemini-5h", name: "Session", window: "5h", remaining_fraction: 0.25 },
              {
                id: "gemini-weekly",
                name: "Weekly",
                window: "weekly",
                remaining_fraction: 0.75,
                reset_time: "2026-11-29T08:00:00Z",
              },
            ],
          },
        ],
      },
    },
  });

  expect(parseAntigravityCliUsage(stdout)).toMatchObject([
    { kind: "session", usedPercent: 75, windowDurationMins: 300 },
    {
      kind: "weekly",
      usedPercent: 25,
      windowDurationMins: 10_080,
      resetsAt: "2026-11-29T08:00:00.000Z",
    },
  ]);
  expect(parseAntigravityCliUsage('{"status":"ERROR"}')).toEqual([]);
});
