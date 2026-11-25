import { resolveFilesystemReadAccess } from "@vibecodinger/client-runtime/state/filesystem";
import { isScratchProject } from "@vibecodinger/client-runtime/state/projects";
import type { EnvironmentProject } from "@vibecodinger/client-runtime/state/shell";
import type { ProjectReadFileResult } from "@vibecodinger/contracts";
import { DEFAULT_SERVER_SETTINGS, VIBECODINGER_PROJECT_FILE_NAME } from "@vibecodinger/contracts";
import {
  resolveNewThreadEnvMode,
  resolveProjectSettings,
} from "@vibecodinger/shared/projectSettings";
import { parseVibeCodingerProjectFile } from "@vibecodinger/shared/vibeCodingerProjectFile";

import { m } from "../../i18n/messages";
import { useEnvironmentServerConfig } from "../../state/entities";
import { useEnvironmentPresentation } from "../../state/presentation";
import { useProjectHasThreads } from "../../state/project-has-threads";
import { projectEnvironment } from "../../state/projects";
import { useEnvironmentQuery } from "../../state/query";
import { environmentSession } from "../../state/session";

/**
 * A project's new-task defaults: server settings merged with its vibecodinger.json. The
 * new-task flow and the home pending-drafts list both read the default
 * workspace mode here, so a draft that never picked one shows what it sends.
 * Every read is a shared per-environment or per-project atom.
 */
export function useNewTaskProjectDefaults(project: EnvironmentProject | null) {
  const serverConfig = useEnvironmentServerConfig(project?.environmentId ?? null);
  const isScratch =
    project !== null && isScratchProject(project, serverConfig?.scratchWorkspaceRoot);
  const hasWorkspace = project !== null && project.workspaceRoot !== "";
  const fileAccessSession = useEnvironmentQuery(
    hasWorkspace ? environmentSession.sessionStateAtom(project.environmentId) : null,
  );
  const fileEnvironment = useEnvironmentPresentation(project?.environmentId ?? null);
  const fileAccess = resolveFilesystemReadAccess(
    {
      isCatalogReady: fileEnvironment.isReady,
      connection: fileEnvironment.presentation?.connection ?? null,
      session: fileAccessSession.data,
      sessionError: fileAccessSession.error,
    },
    m,
  );
  const fileAccessPending = hasWorkspace && fileAccess.isPending;
  const vibeCodingerProjectFileQuery = useEnvironmentQuery(
    fileAccess.canReadFiles && hasWorkspace
      ? projectEnvironment.readFile({
          environmentId: project.environmentId,
          input: {
            cwd: project.workspaceRoot,
            relativePath: VIBECODINGER_PROJECT_FILE_NAME,
            allowMissing: true,
          },
        })
      : null,
  );
  const vibeCodingerProjectFileData =
    vibeCodingerProjectFileQuery.data as ProjectReadFileResult | null;
  const vibeCodingerProjectFile =
    vibeCodingerProjectFileData === null ||
    vibeCodingerProjectFileData.exists === false ||
    vibeCodingerProjectFileData.truncated
      ? null
      : parseVibeCodingerProjectFile(vibeCodingerProjectFileData.contents);
  const projectSettings = resolveProjectSettings(
    serverConfig?.settings ?? DEFAULT_SERVER_SETTINGS,
    project?.id ?? null,
    project,
    vibeCodingerProjectFile,
  );
  const projectHasThreads = useProjectHasThreads(project);
  const defaultWorkspaceMode = isScratch
    ? "local"
    : resolveNewThreadEnvMode({
        projectSettings,
        workspaceRoot: project?.workspaceRoot ?? null,
        newProjectsRoot: serverConfig?.newProjectsRoot,
        projectHasThreads,
      });
  // While vibecodinger.json loads, the environment default is provisional; vibecodinger.json may replace it.
  const defaultWorkspaceModeSettled =
    projectSettings.sources.defaultThreadEnvMode !== "environment" ||
    (!vibeCodingerProjectFileQuery.isPending && !fileAccessPending);
  return {
    serverConfig,
    isScratch,
    projectSettings,
    defaultWorkspaceMode,
    defaultWorkspaceModeSettled,
  };
}
