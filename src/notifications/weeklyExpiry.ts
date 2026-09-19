import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SOON_EXPIRING_DAYS } from '../constants';
import { listExpiringOnOrBefore } from '../db/repository';
import { t } from '../i18n';

/** Stable id so we can cancel/replace on each app start (fresh body). */
export const WEEKLY_EXPIRY_NOTIFICATION_ID = 'balance.weekly-expiry';

const ANDROID_CHANNEL_ID = 'weekly-expiry';

/** Sunday in expo-notifications WeeklyTrigger (1 = Sunday … 7 = Saturday). */
const SUNDAY = 1;
const HOUR_LOCAL = 18;
const MINUTE_LOCAL = 0;

/** Expo Go — Android push APIs removed in SDK 53; loading the module can crash. */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function horizonIsoDate(daysAhead: number): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  utc.setUTCDate(utc.getUTCDate() + daysAhead);
  return utc.toISOString().slice(0, 10);
}

function buildBody(count: number): string {
  if (count > 0) {
    return t('notifWeeklyBodySome', { count });
  }
  return t('notifWeeklyBodyNone');
}

/**
 * ME-6: request permission (graceful deny), set Android channel, cancel prior
 * weekly schedule, and schedule Sunday 18:00 device-local with a fresh body.
 *
 * Expo Go on Android (SDK 53+): no-op — do not import/call expo-notifications
 * (push token listeners crash). Use a development / EAS build for Android
 * weekly reminders. iOS Expo Go still schedules local notifications.
 */
export async function scheduleWeeklyExpiryReminder(): Promise<void> {
  try {
    if (isExpoGo() && Platform.OS === 'android') {
      return;
    }

    // Dynamic import so Android Expo Go never loads the notifications module.
    const Notifications = await import('expo-notifications');

    const current = await Notifications.getPermissionsAsync();
    let allowed =
      current.granted ||
      current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!allowed) {
      if (!current.canAskAgain && current.status === 'denied') {
        return;
      }
      const requested = await Notifications.requestPermissionsAsync();
      allowed =
        requested.granted ||
        requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    if (!allowed) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: t('notifChannelName'),
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const horizon = horizonIsoDate(SOON_EXPIRING_DAYS);
    const soonOrExpired = await listExpiringOnOrBefore(horizon);
    const body = buildBody(soonOrExpired.length);

    await Notifications.cancelScheduledNotificationAsync(WEEKLY_EXPIRY_NOTIFICATION_ID);

    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_EXPIRY_NOTIFICATION_ID,
      content: {
        title: t('notifWeeklyTitle'),
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: SUNDAY,
        hour: HOUR_LOCAL,
        minute: MINUTE_LOCAL,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  } catch {
    // Soft-fail: notifications must never break app start.
  }
}
