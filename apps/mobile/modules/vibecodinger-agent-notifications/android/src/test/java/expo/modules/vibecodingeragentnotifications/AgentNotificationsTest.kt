package expo.modules.vibecodingeragentnotifications

import android.app.Activity
import android.app.Application
import android.app.Notification
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import androidx.core.app.NotificationCompat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [24, 26, 33, 36], manifest = Config.NONE)
class AgentNotificationsTest {
  private lateinit var context: Application
  private lateinit var manager: NotificationManager

  @Before
  fun setUp() {
    context = RuntimeEnvironment.getApplication()
    manager = context.getSystemService(NotificationManager::class.java)
    shadowOf(manager).setNotificationsEnabled(true)

    val launcher = ComponentName(context, Activity::class.java)
    shadowOf(context.packageManager).addActivityIfNotPresent(launcher)
    shadowOf(context.packageManager).addIntentFilterForActivity(
      launcher,
      IntentFilter(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
    )
  }

  private fun update(alertId: String, active: Boolean) = mapOf(
    "active" to active.toString(),
    "activity_title" to "1 active agent",
    "activity_body" to "Test thread · Working",
    "activity_path" to "/threads/environment/thread",
    "alert_id" to alertId,
    "alert_title" to "Test thread",
    "alert_body" to "Done: Test project",
    "alert_path" to "/threads/environment/thread",
  )

  @Test
  fun expandedActivityShowsFiveRowsAndUsesThePriorityThreadRoute() {
    val lines =
      listOf(
        "Approval: First · Project",
        "Input: Second · Project",
        "Failed: Third · Project",
        "Working: Fourth · Project",
        "Done: Fifth · Project"
      )
    AgentNotifications.showcase(
      context,
      "vibecodinger-dev",
      (update("attention", true) - "alert_id") +
        lines.mapIndexed { index, line -> "activity_line_$index" to line }.toMap()
    )
    val card = manager.activeNotifications.single().notification
    assertEquals(lines.joinToString("\n"), card.extras.getString(Notification.EXTRA_BIG_TEXT))
    assertEquals(
      "vibecodinger-dev://threads/environment/thread",
      shadowOf(card.contentIntent).savedIntent.dataString
    )
  }

  @Test
  fun alertsAndActivityUseVersionAppropriatePriorityAndPromotion() {
    assertTrue(AgentNotifications.showcase(context, "vibecodinger-dev", update("work", true)))
    val alert = manager.activeNotifications.single {
      it.tag == "vibecodinger-agent-alert"
    }.notification
    val card = manager.activeNotifications.single {
      it.tag == "vibecodinger-agent-activity"
    }.notification
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      assertEquals(Notification.PRIORITY_HIGH, alert.priority)
      assertTrue(alert.defaults and Notification.DEFAULT_SOUND != 0)
      assertEquals(Notification.PRIORITY_LOW, card.priority)
      assertEquals(0, card.defaults)
    } else {
      assertEquals(
        NotificationManager.IMPORTANCE_HIGH,
        manager.getNotificationChannel(alert.channelId).importance
      )
      assertEquals(
        NotificationManager.IMPORTANCE_LOW,
        manager.getNotificationChannel(card.channelId).importance
      )
    }
    assertTrue(NotificationCompat.isRequestPromotedOngoing(card))
    assertFalse(NotificationCompat.isRequestPromotedOngoing(alert))
    // Robolectric's API 36 image predates the shipped Live Update rules;
    // its hasPromotableCharacteristics() incorrectly requires colorization.
    assertFalse(card.extras.getBoolean(NotificationCompat.EXTRA_COLORIZED))
    assertTrue(card.flags and Notification.FLAG_ONGOING_EVENT != 0)
    assertEquals(Notification.VISIBILITY_PRIVATE, card.visibility)
  }
}
