import type { AgentFeedbackMode } from "@vibecodinger/contracts";
import type { V2TurnStartParams__AdditionalContextEntry } from "effect-codex-app-server/schema";
import { buildRuntimeInstructions } from "@vibecodinger/provider-core/server/runtimeInstructions";

import {
  VIBECODINGER_BROWSER_TOOL_INSTRUCTIONS,
  VIBECODINGER_DEVICE_TOOL_INSTRUCTIONS,
  VIBECODINGER_ORCHESTRATION_SECTIONS,
} from "@vibecodinger/provider-core/server/orchestrationInstructions";

/** Codex silently truncates additionalContext values over 1,000 tokens, counted as UTF-8 bytes / 4. */
export const CODEX_ADDITIONAL_CONTEXT_VALUE_MAX_BYTES = 4_000;

export interface VibeCodingerToolAvailability {
  readonly browser: boolean;
  readonly device: boolean;
}

const normalizeAvailability = (
  availability: boolean | VibeCodingerToolAvailability,
): VibeCodingerToolAvailability =>
  typeof availability === "boolean" ? { browser: availability, device: false } : availability;

/** Instructions for unavailable tools would steer the model away from its remaining automation. */
const toolInstructions = (availability: boolean | VibeCodingerToolAvailability): string => {
  const tools = normalizeAvailability(availability);
  return [
    tools.browser ? VIBECODINGER_BROWSER_TOOL_INSTRUCTIONS : "",
    tools.device ? VIBECODINGER_DEVICE_TOOL_INSTRUCTIONS : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};

export interface CodexRuntimeInfo {
  readonly agentFeedback?: AgentFeedbackMode;
  readonly model: string;
  readonly modelName?: string | undefined;
  readonly reasoningEffort?: string | undefined;
}

/** Keep this outside collaboration mode; model-catalog mode text overrides client developer_instructions. */
export function buildCodexAdditionalContext(
  runtime: CodexRuntimeInfo,
  toolsAvailable: boolean | VibeCodingerToolAvailability = true,
): Record<string, V2TurnStartParams__AdditionalContextEntry> {
  const tools = toolInstructions(toolsAvailable);
  // Split values to fit per-entry caps; number keys because Codex emits them in key order.
  return {
    ...Object.fromEntries(
      VIBECODINGER_ORCHESTRATION_SECTIONS.map((section, index) => [
        `vibe_codinger_orchestration_${String(index + 1).padStart(2, "0")}`,
        { kind: "application" as const, value: section },
      ]),
    ),
    vibe_codinger_runtime: {
      kind: "application",
      value: buildRuntimeInstructions({ harness: "Codex", ...runtime }),
    },
    ...(tools ? { vibe_codinger_tools: { kind: "application", value: tools } } : {}),
  };
}
