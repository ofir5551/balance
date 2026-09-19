import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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

function horizonIsoDate(daysAhead: number): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  utc.setUTCDate(utc.getUTCDate() + daysAhead);
  return utc.toISOString().slice(0, 10);
}

async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  if (!current.canAskAgain && current.status === 'denied') {
    return false;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: t('notifChannelName'),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
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
 */
export async function scheduleWeeklyExpiryReminder(): Promise<void> {
  try {
    const allowed = await ensurePermissions();
    if (!allowed) return;

    await ensureAndroidChannel();

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
