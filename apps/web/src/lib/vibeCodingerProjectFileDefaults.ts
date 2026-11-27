import {
  VIBECODINGER_PROJECT_FILE_NAME,
  type EnvironmentId,
  type ProjectReadFileResult,
  type VibeCodingerProjectFile,
} from "@vibecodinger/contracts";
import { parseVibeCodingerProjectFile } from "@vibecodinger/shared/vibeCodingerProjectFile";
import { executeAtomQuery } from "@vibecodinger/client-runtime/state/runtime";
import { AsyncResult } from "effect/reactivity";

import {
  getProjectFileQueryAtom,
  resolveProjectFileQueryData,
} from "~/components/files/projectFilesQueryState";
import { appAtomRegistry } from "~/rpc/atomRegistry";

function toVibeCodingerProjectFile(
  environmentId: EnvironmentId,
  workspaceRoot: string,
  result: ProjectReadFileResult | null,
): VibeCodingerProjectFile | null {
  const data = resolveProjectFileQueryData(
    environmentId,
    workspaceRoot,
    VIBECODINGER_PROJECT_FILE_NAME,
    result,
  );
  if (data === null || data.exists === false || data.truncated) return null;
  return parseVibeCodingerProjectFile(data.contents);
}

export async function readVibeCodingerProjectFile(
  environmentId: EnvironmentId,
  workspaceRoot: string,
<<<<<<< 334bfa7258208f9b0a5daecdd42b9d9aa4fffe67:apps/web/src/lib/vibeCodingerProjectFileDefaults.ts
): Promise<VibeCodingerProjectFile | null> {
  const result = await executeAtomQuery(
    appAtomRegistry,
    getProjectFileQueryAtom(environmentId, workspaceRoot, VIBECODINGER_PROJECT_FILE_NAME),
    { reportDefect: false, reportFailure: false },
=======
  signal?: AbortSignal,
): Promise<T3ProjectFile | null> {
  const result = await executeAtomQuery(
    appAtomRegistry,
    getProjectFileQueryAtom(environmentId, workspaceRoot, T3_PROJECT_FILE_NAME),
    { reportDefect: false, reportFailure: false, signal },
>>>>>>> 3f2ddfba8b8ec877afb6a6c68554a748cb55bf94:apps/web/src/lib/t3ProjectFileDefaults.ts
  );
  return toVibeCodingerProjectFile(
    environmentId,
    workspaceRoot,
    result._tag === "Success" ? result.value : null,
  );
}

/** The project's vibecodinger.json from an earlier read, or `undefined` when none has loaded yet. */
export function peekVibeCodingerProjectFile(
  environmentId: EnvironmentId,
  workspaceRoot: string,
): VibeCodingerProjectFile | null | undefined {
  const result = appAtomRegistry.get(
    getProjectFileQueryAtom(environmentId, workspaceRoot, VIBECODINGER_PROJECT_FILE_NAME),
  );
  return AsyncResult.isSuccess(result)
    ? toVibeCodingerProjectFile(environmentId, workspaceRoot, result.value)
    : undefined;
}
