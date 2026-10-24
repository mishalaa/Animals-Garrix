import { Platform } from 'react-native';

import { parseISODate } from './dates';
import { isDueDateItem } from './schedule';
import type { Medicine, Pet } from '@/types';

/**
 * Local reminders on iOS/Android. On web this is a no-op; the Schedule tab shows what's due.
 * Strategy: cancel everything and re-schedule from the current medicine list, which keeps
 * notifications in sync without storing notification ids.
 */
export async function syncReminders(
  medicines: Medicine[],
  pets: Pet[],
  title: (m: Medicine, pet?: Pet) => string,
) {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');

  const perm = await Notifications.getPermissionsAsync();
  let granted = perm.granted;
  if (!granted && perm.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Pet care reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const petById = new Map(pets.map((p) => [p.id, p]));
  const now = new Date();

  for (const m of medicines) {
    if (!m.active || m.deleted_at || !petById.has(m.pet_id)) continue;
    const pet = petById.get(m.pet_id);
    const content = { title: title(m, pet), body: m.dose ?? '', data: { petId: m.pet_id, medicineId: m.id } };
    const times = (m.times?.length ? m.times : ['09:00']).map((t) => t.split(':').map(Number));

    if (isDueDateItem(m)) {
      const due = parseISODate(m.next_due);
      if (!due) continue;
      const [h, mi] = times[0];
      due.setHours(h || 9, mi || 0, 0, 0);
      if (due > now) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: due,
            channelId: 'reminders',
          },
        });
      }
      continue;
    }

    const end = parseISODate(m.end_date);
    if (end && end < now) continue;
    for (const [h, mi] of times) {
      if (m.frequency === 'weekly') {
        const start = parseISODate(m.start_date) ?? now;
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: start.getDay() + 1, // 1 = Sunday
            hour: h || 9,
            minute: mi || 0,
            channelId: 'reminders',
          },
        });
      } else if (m.frequency === 'daily' || m.frequency === 'twice_daily') {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h || 9,
            minute: mi || 0,
            channelId: 'reminders',
          },
        });
      }
    }
  }
}

export async function configureNotificationHandler() {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: false,
    }),
  });
}
