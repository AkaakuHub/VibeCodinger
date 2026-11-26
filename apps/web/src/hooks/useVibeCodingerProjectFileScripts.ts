import {
  VIBECODINGER_PROJECT_FILE_NAME,
  type EnvironmentId,
  type VibeCodingerProjectFile,
  type VibeCodingerProjectFileScript,
} from "@vibecodinger/contracts";
import { parseVibeCodingerProjectFile } from "@vibecodinger/shared/vibeCodingerProjectFile";

import { useProjectFileQuery } from "~/components/files/projectFilesQueryState";

const NO_SCRIPTS: ReadonlyArray<VibeCodingerProjectFileScript> = [];

export interface VibeCodingerProjectFileState {
  status: "loading" | "missing" | "invalid" | "valid";
  file: VibeCodingerProjectFile | null;
  scripts: ReadonlyArray<VibeCodingerProjectFileScript>;
  refresh: () => void;
}

export function useVibeCodingerProjectFileState(
  environmentId: EnvironmentId,
  cwd: string | null,
): VibeCodingerProjectFileState {
  const query = useProjectFileQuery(
    environmentId,
    cwd ?? "",
    VIBECODINGER_PROJECT_FILE_NAME,
    cwd !== null,
  );
  const contents = query.data && !query.data.truncated ? query.data.contents : null;
  const isPending = query.isPending;
  const refresh = query.refresh;
  if (contents === null) {
    return {
      status: isPending ? "loading" : "missing",
      file: null,
      scripts: NO_SCRIPTS,
      refresh,
    } as const;
  }
  const file = parseVibeCodingerProjectFile(contents);
  if (file === null) {
    return { status: "invalid", file: null, scripts: NO_SCRIPTS, refresh } as const;
  }
  return { status: "valid", file, scripts: file.scripts ?? NO_SCRIPTS, refresh } as const;
}
