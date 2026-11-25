import {
  threadRuntimeIsActive,
  type EnvironmentThreadShell,
} from "@t3tools/client-runtime/state/models";
import type { RunId } from "@t3tools/contracts";

type Thread = Pick<EnvironmentThreadShell, "environmentId" | "id" | "latestRun" | "runtime">;

export function observeRunCompletions(notify: (id: string) => void) {
  const running = new Map<string, RunId>();
  return (threads: readonly Thread[]) => {
    for (const thread of threads) {
      const run = thread.latestRun;
      if (!run) continue;
      const key = JSON.stringify([thread.environmentId, thread.id]);
      if (
        thread.runtime?.activeRunId === run.runId &&
        threadRuntimeIsActive(thread.runtime) &&
        run.completedAt === null
      ) {
        running.set(key, run.runId);
        continue;
      }
      if (
        running.get(key) === run.runId &&
        run.status === "completed" &&
        run.completedAt !== null
      ) {
        notify(JSON.stringify([thread.environmentId, thread.id, run.runId]));
      }
      running.delete(key);
    }
  };
}
