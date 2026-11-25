package expo.modules.vibecodingeragentnotifications

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VibeCodingerAgentNotificationsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VibeCodingerAgentNotifications")

    Function("showShowcaseActivity") { scheme: String, data: Map<String, String> ->
      appContext.reactContext?.let { AgentNotifications.showcase(it, scheme, data) } ?: false
    }
  }
}
