import {
  EnvironmentId,
  ProviderInstanceId,
  RunId,
  ThreadId,
  type OrchestrationV2RunStatus,
} from "@t3tools/contracts";
import { describe, expect, it, vi } from "vite-plus/test";

import { observeRunCompletions } from "./runCompletions";

const runId = RunId.make("run");
const time = "2026-11-25T12:00:00.000Z";

function thread(environment: string, status: OrchestrationV2RunStatus) {
  return {
    environmentId: EnvironmentId.make(environment),
    id: ThreadId.make("thread"),
    latestRun: {
      runId,
      status,
      requestedAt: time,
      startedAt: time,
      completedAt: status === "running" ? null : time,
      assistantMessageId: null,
    },
    runtime: {
      status,
      activeRunId: status === "running" ? runId : null,
      providerInstanceId: ProviderInstanceId.make("provider"),
      providerName: null,
      lastError: null,
      updatedAt: time,
    },
  };
}

describe("session completion notifications", () => {
  it("notifies once when an observed run finishes after reconnecting", () => {
    const notify = vi.fn();
    const observe = observeRunCompletions(notify);
    observe([thread("remote", "running")]);
    observe([]);
    observe([thread("remote", "completed")]);
    observe([thread("remote", "completed")]);

    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("ignores earlier completions and failed runs with the same ID on another server", () => {
    const notify = vi.fn();
    const observe = observeRunCompletions(notify);
    observe([thread("remote", "running"), thread("other", "completed")]);
    observe([thread("remote", "failed"), thread("other", "completed")]);

    expect(notify).not.toHaveBeenCalled();
  });
});
