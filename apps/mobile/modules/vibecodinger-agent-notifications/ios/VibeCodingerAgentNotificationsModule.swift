import ExpoModulesCore
import Foundation
import UserNotifications

public final class VibeCodingerAgentNotificationsModule: Module {
  private let presentation = CompletionNotificationPresentation()

  public func definition() -> ModuleDefinition {
    Name("VibeCodingerAgentNotifications")

    AsyncFunction("requestCompletionPermission") { () async throws -> Bool in
      let center = UNUserNotificationCenter.current()
      guard await center.notificationSettings().authorizationStatus == .notDetermined else {
        return false
      }
      return try await center.requestAuthorization(options: [.alert, .sound])
    }

    AsyncFunction("showCompletion") { (id: String, title: String) async throws -> Void in
      let center = UNUserNotificationCenter.current()
      let status = await center.notificationSettings().authorizationStatus
      guard status == .authorized || status == .provisional else { return }
      center.delegate = self.presentation
      let content = UNMutableNotificationContent()
      content.title = title
      content.sound = .default
      try await center.add(UNNotificationRequest(identifier: id, content: content, trigger: nil))
    }
  }
}

private final class CompletionNotificationPresentation: NSObject, UNUserNotificationCenterDelegate {
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification
  ) async -> UNNotificationPresentationOptions {
    [.banner, .list, .sound]
  }
}
