import { requireOptionalNativeModule } from "expo";
import { msg } from "gt-react-native";
import { Linking, PermissionsAndroid, Platform } from "react-native";

import { m } from "../../i18n/messages";
import { appAtomRegistry } from "../../state/atom-registry";
import { environmentThreadShells } from "../../state/threads";
import { observeRunCompletions } from "./runCompletions";

const notifications = requireOptionalNativeModule<{
  requestCompletionPermission?: () => Promise<boolean>;
  showCompletion: (id: string, title: string) => Promise<void>;
}>("VibeCodingerAgentNotifications");

export async function openCompletionNotificationSettings(): Promise<void> {
  if (Platform.OS === "ios" && (await notifications?.requestCompletionPermission?.())) return;
  if (Platform.OS === "android" && Platform.Version >= 33) {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (
      !(await PermissionsAndroid.check(permission)) &&
      (await PermissionsAndroid.request(permission)) === PermissionsAndroid.RESULTS.GRANTED
    ) {
      return;
    }
  }
  await Linking.openSettings();
}

export function installCompletionNotifications(): () => void {
  if (!notifications) return () => {};
  const post = notifications.showCompletion;
  const observe = observeRunCompletions((id) => {
    void post(id, m(msg("Session complete"))).catch(console.error);
  });
  return appAtomRegistry.subscribe(environmentThreadShells.threadShellsAtom, observe, {
    immediate: true,
  });
}
