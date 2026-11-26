import { PermissionsAndroid, Platform } from "react-native";

import type { AgentActivityProps } from "../../widgets/AgentActivity";
import {
  getAgentLiveActivities,
  startAgentLiveActivity,
} from "../agent-awareness/agentLiveActivity";
import { showAndroidShowcaseAgentActivity } from "../agent-awareness/androidNotifications";
import { showcaseAndroidActivityData } from "./showcaseAgentActivity";

export async function stageShowcaseAgentActivity(
  activity: AgentActivityProps,
): Promise<true | string> {
  if (Platform.OS === "android") {
    if (Platform.Version >= 33) {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        return `notification permission ${permission}`;
      }
    }
    return (
      showAndroidShowcaseAgentActivity(showcaseAndroidActivityData(activity)) ||
      "android-notification-unavailable"
    );
  }
  if (Platform.OS !== "ios") return `unsupported platform ${Platform.OS}`;

  await Promise.all(getAgentLiveActivities().map((existing) => existing.end("immediate")));
  // ActivityKit needs foreground startup; the runner locks only after this scene is ready.
  return startAgentLiveActivity(activity) !== null || "live-activity-start-failed";
}
