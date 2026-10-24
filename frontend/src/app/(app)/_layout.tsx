import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { usePets, useRecords } from '@/hooks/queries';
import { syncReminders } from '@/lib/notifications';
import { colors } from '@/theme';

/** Everything behind sign-in. Also keeps phone reminders in sync with medicines. */
export default function AppLayout() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/welcome" />;
  return (
    <>
      <ReminderSync />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

function ReminderSync() {
  const { t } = useTranslation();
  const pets = usePets();
  const meds = useRecords('medicines');
  useEffect(() => {
    if (!pets.data || !meds.data) return;
    syncReminders(meds.data, pets.data, (m, pet) =>
      t('schedule.reminderTitle', { pet: pet?.name ?? '', name: m.name }),
    ).catch(() => {});
  }, [pets.data, meds.data, t]);
  return null;
}
