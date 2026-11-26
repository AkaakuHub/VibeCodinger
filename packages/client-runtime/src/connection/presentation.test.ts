import { describe, expect, it } from "@effect/vitest";

import { ConnectionTransientError, type SupervisorConnectionState } from "./model.ts";
import {
  connectionStatusText,
  connectionStatusTitle,
  presentConnectionState,
} from "./presentation.ts";

function supervisorState(overrides: Partial<SupervisorConnectionState>): SupervisorConnectionState {
  return {
    desired: true,
    network: "online",
    phase: "connecting",
    stage: "preparing",
    attempt: 1,
    generation: 0,
    lastFailure: null,
    retryAt: null,
    refusedRouteIds: [],
    ...overrides,
  };
}

describe("connection presentation", () => {
  it("distinguishes initial connection, reconnect, and retry errors", () => {
    expect(presentConnectionState(supervisorState({ phase: "connecting", attempt: 1 }))).toEqual({
      phase: "connecting",
      error: null,
      traceId: null,
    });
    expect(
      presentConnectionState(
        supervisorState({
          phase: "connecting",
          attempt: 2,
          lastFailure: new ConnectionTransientError({
            reason: "transport",
            detail: "Socket closed.",
            traceId: "trace-previous",
          }),
        }),
      ),
    ).toEqual({
      phase: "reconnecting",
      error: "Socket closed.",
      traceId: "trace-previous",
    });
    expect(
      presentConnectionState(
        supervisorState({
          phase: "backoff",
          attempt: 2,
          retryAt: 1,
          lastFailure: new ConnectionTransientError({
            reason: "transport",
            detail: "Disconnected.",
            traceId: "trace-1",
          }),
        }),
      ),
    ).toEqual({
      phase: "reconnecting",
      error: "Disconnected.",
      traceId: "trace-1",
    });
    const awaitingApproval = presentConnectionState(
      supervisorState({
        phase: "backoff",
        attempt: 1,
        retryAt: 1,
        lastFailure: new ConnectionTransientError({
          reason: "approval-pending",
          detail: "Approve this device on Mac mini. It shows code K7QM-2XFD.",
          traceId: "trace-2",
        }),
      }),
    );
    expect(awaitingApproval).toEqual({
      phase: "reconnecting",
      error: "Approve this device on Mac mini. It shows code K7QM-2XFD.",
      traceId: "trace-2",
      awaitingApproval: true,
    });
    expect(connectionStatusText(awaitingApproval)).toBe(
      "Approve this device on Mac mini. It shows code K7QM-2XFD.",
    );
    expect(connectionStatusTitle(awaitingApproval)).toBe("Waiting for approval");
  });

  it("preserves an explicitly available environment while offline", () => {
    expect(
      presentConnectionState(
        supervisorState({
          desired: false,
          network: "offline",
          phase: "available",
          stage: null,
          attempt: 0,
        }),
      ),
    ).toEqual({
      phase: "available",
      error: null,
      traceId: null,
    });
  });
});
