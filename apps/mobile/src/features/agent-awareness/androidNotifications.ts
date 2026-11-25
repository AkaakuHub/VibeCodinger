import Constants from "expo-constants";
import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

interface AndroidAgentNotifications {
  showShowcaseActivity(scheme: string, data: Record<string, string>): boolean;
}

const native =
  Platform.OS === "android"
    ? requireOptionalNativeModule<AndroidAgentNotifications>("VibeCodingerAgentNotifications")
    : null;

function appScheme(): string {
  const scheme = Constants.expoConfig?.scheme;
  return (Array.isArray(scheme) ? scheme[0] : scheme) ?? "vibecodinger";
}

export function showAndroidShowcaseAgentActivity(data: Record<string, string>): boolean {
  return native?.showShowcaseActivity(appScheme(), data) ?? false;
}
