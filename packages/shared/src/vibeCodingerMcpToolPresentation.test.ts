import { describe, expect, it } from "vite-plus/test";

import {
  VIBECODINGER_MCP_TOOL_NAMES,
  resolveVibeCodingerMcpSummaryAction,
  resolveVibeCodingerMcpToolDefinition,
  resolveVibeCodingerMcpToolPresentation,
} from "./vibeCodingerMcpToolPresentation.ts";

describe("resolveVibeCodingerMcpToolPresentation", () => {
  it("recognizes every T3 tool across provider prefixes and completion suffixes", () => {
    for (const tool of VIBECODINGER_MCP_TOOL_NAMES) {
      const presentation = resolveVibeCodingerMcpToolPresentation(tool);
      for (const prefix of [
        "mcp__vibe-codinger__",
        "mcp__vibe_codinger__",
        "mcp__vibecodinger__",
        "Vibe-Codinger.",
        "vibecodinger.",
        "vibe-codinger-direct.",
        "mcp__vibe_codinger_direct__",
        "vibe_codinger/",
        "vibecodinger:",
        "mcp_vibe-codinger_",
        "VibeCodinger ",
        "vibe-codinger · ",
      ]) {
        expect(resolveVibeCodingerMcpToolPresentation(`${prefix}${tool} completed`), tool).toEqual(
          presentation,
        );
      }
      expect(
        resolveVibeCodingerMcpToolPresentation(`mcp__another-server__${tool}`),
        tool,
      ).toBeNull();
    }
  });

  it("matches OpenCode 2's per-thread server names, whose thread ids hold underscores", () => {
    expect(
      resolveVibeCodingerMcpToolPresentation("vibe-codinger-thread_opencode2-adapter_delegate_task")
        ?.displayName,
    ).toBe("Delegate a child task");
    expect(
      resolveVibeCodingerMcpToolPresentation("vibe-codinger-thread_opencode2-adapter_not_a_tool"),
    ).toBeNull();
  });
});

describe("resolveVibeCodingerMcpToolDefinition", () => {
  it("labels an action tool call as the action it ran", () => {
    expect(
      resolveVibeCodingerMcpToolDefinition("mcp__vibe-codinger__preview_act", { action: "type" })
        ?.labels,
    ).toEqual(resolveVibeCodingerMcpToolDefinition("preview_type")?.labels);
    expect(
      resolveVibeCodingerMcpToolDefinition("vc_thread_transfer", { action: "fork" })?.displayName,
    ).toBe(resolveVibeCodingerMcpToolDefinition("vc_thread_fork")?.displayName);
    expect(
      resolveVibeCodingerMcpToolDefinition("preview_act", { action: "unknown" })?.labels[2],
    ).toBe("Used");
  });
});

describe("resolveVibeCodingerMcpSummaryAction", () => {
  it("summarizes an action tool by the action each call ran", () => {
    expect(
      resolveVibeCodingerMcpSummaryAction("mcp__vibe-codinger__vc_queue", { action: "list" }),
    ).toBe("queue-list");
    expect(resolveVibeCodingerMcpSummaryAction("vc_queue", { action: "edit" })).toBe("queue-edit");
    expect(resolveVibeCodingerMcpSummaryAction("vc_thread_transfer", { action: "status" })).toBe(
      "thread-transfers",
    );
    expect(resolveVibeCodingerMcpSummaryAction("vc_thread_configure", {})).toBe(
      "thread-configuration",
    );
    expect(
      resolveVibeCodingerMcpSummaryAction("schedule_task", { scheduledTaskId: "task-1" }),
    ).toBe("schedule-update");
    expect(resolveVibeCodingerMcpSummaryAction("delegate_task", { task: "x" })).toBe("delegate");
  });
});
