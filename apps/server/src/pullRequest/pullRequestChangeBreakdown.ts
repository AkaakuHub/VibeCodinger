import type { PullRequestChangeBreakdown } from "@vibecodinger/contracts";
import { summarizeChangedFiles } from "@vibecodinger/shared/changedFileKind";
import type { ProviderFileStats } from "@vibecodinger/source-control-core/server/PullRequestProvider";

export function toChangeBreakdown(stats: ProviderFileStats): PullRequestChangeBreakdown {
  if (stats.truncated) return null;
  return summarizeChangedFiles(stats.files);
}
