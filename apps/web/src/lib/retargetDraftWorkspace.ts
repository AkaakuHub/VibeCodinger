<<<<<<< 334bfa7258208f9b0a5daecdd42b9d9aa4fffe67
import { DEFAULT_SERVER_SETTINGS, type ScopedProjectRef } from "@vibecodinger/contracts";
import {
  resolveNewThreadEnvMode,
  resolveProjectSettings,
} from "@vibecodinger/shared/projectSettings";
=======
import {
  DEFAULT_SERVER_SETTINGS,
  type ScopedProjectRef,
  type T3ProjectFile,
} from "@vibecodinger/contracts";
import { resolveNewThreadEnvMode, resolveProjectSettings } from "@vibecodinger/shared/projectSettings";
>>>>>>> 3f2ddfba8b8ec877afb6a6c68554a748cb55bf94

import type { DraftSessionState } from "../composerDraftStore";
import { readProject, readThreadShells } from "../state/entities";
import { readEnvironment } from "../state/environments";
import { readUnloadedThreadCount } from "../state/olderSettledShelf";
import { resolveNewDraftStartFromOrigin } from "./chatThreadActions";
<<<<<<< 334bfa7258208f9b0a5daecdd42b9d9aa4fffe67
import { peekVibeCodingerProjectFile } from "./vibeCodingerProjectFileDefaults";
=======
import { peekT3ProjectFile, readT3ProjectFile } from "./t3ProjectFileDefaults";
>>>>>>> 3f2ddfba8b8ec877afb6a6c68554a748cb55bf94

function readWorkspaceContext(projectRef: ScopedProjectRef) {
  const project = readProject(projectRef);
  const serverConfig = readEnvironment(projectRef.environmentId)?.serverConfig;
  return { project, serverConfig, settings: serverConfig?.settings ?? DEFAULT_SERVER_SETTINGS };
}

async function newThreadWorkspace(projectRef: ScopedProjectRef, signal: AbortSignal) {
  let { project, serverConfig, settings } = readWorkspaceContext(projectRef);
  let projectFile: T3ProjectFile | null = null;
  const workspaceRoot = project?.workspaceRoot;
  if (
    workspaceRoot &&
    resolveProjectSettings(settings, projectRef.projectId, project).settings
<<<<<<< 334bfa7258208f9b0a5daecdd42b9d9aa4fffe67
      .defaultThreadEnvMode === null &&
    appAtomRegistry
      .get(environmentSummaries.connectedEnvironmentIdsAtom)
      .includes(projectRef.environmentId);
  const projectFile = consultProjectFile
    ? (peekVibeCodingerProjectFile(projectRef.environmentId, project.workspaceRoot) ?? null)
    : null;
=======
      .defaultThreadEnvMode === null
  ) {
    const cached = peekT3ProjectFile(projectRef.environmentId, workspaceRoot);
    if (cached === undefined) {
      // A paired project can appear before its connection summary reports connected.
      projectFile = await readT3ProjectFile(projectRef.environmentId, workspaceRoot, signal);
      ({ project, serverConfig, settings } = readWorkspaceContext(projectRef));
    } else {
      projectFile = cached;
    }
  }
>>>>>>> 3f2ddfba8b8ec877afb6a6c68554a748cb55bf94
  const projectSettings = resolveProjectSettings(
    settings,
    projectRef.projectId,
    project,
    projectFile,
  );
  const envMode = resolveNewThreadEnvMode({
    projectSettings,
    workspaceRoot: project?.workspaceRoot ?? null,
    newProjectsRoot: serverConfig?.newProjectsRoot,
    projectHasThreads:
      readThreadShells().some(
        (thread) =>
          thread.environmentId === projectRef.environmentId &&
          thread.projectId === projectRef.projectId,
      ) ||
      readUnloadedThreadCount(
        [{ environmentId: projectRef.environmentId, id: projectRef.projectId }],
        [],
      ) > 0,
  });
  return {
    envMode,
    startFromOrigin: resolveNewDraftStartFromOrigin({
      envMode,
      newWorktreesStartFromOrigin: projectSettings.settings.newWorktreesStartFromOrigin,
    }),
  };
}

/**
 * The workspace for a draft moving to another project or machine: the default a new thread
 * there starts with, unless the user chose one, which carries over.
 */
export async function retargetDraftWorkspace(
  draft: Pick<DraftSessionState, "workspaceExplicit" | "worktreePath">,
  projectRef: ScopedProjectRef,
  signal: AbortSignal,
): Promise<{ envMode?: DraftSessionState["envMode"]; startFromOrigin?: boolean }> {
  return draft.workspaceExplicit || draft.worktreePath !== null
    ? {}
    : newThreadWorkspace(projectRef, signal);
}
