import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { DoseItem } from '@/components/schedule/DoseItem';
import { EmptyState, Loading, Screen, SectionTitle, T } from '@/components/ui';
import { usePets, useRecords } from '@/hooks/queries';
import { addDays, localeTag, today } from '@/lib/dates';
import { buildAgenda, dosesBetween } from '@/lib/schedule';
import { colors, radius, space } from '@/theme';

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const pets = usePets();
  const meds = useRecords('medicines');
  const logs = useRecords('dose_logs');
  const [offset, setOffset] = useState(0); // selected day, relative to today

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today(), i)), []);
  const agenda = useMemo(
    () => buildAgenda(meds.data ?? [], logs.data ?? [], pets.data ?? []),
    [meds.data, logs.data, pets.data],
  );
  const selected = days[offset];
  const dayDoses = useMemo(
    () =>
      dosesBetween(meds.data ?? [], logs.data ?? [], pets.data ?? [], selected, addDays(selected, 1)).filter(
        (d) => d.at < addDays(selected, 1),
      ),
    [meds.data, logs.data, pets.data, selected],
  );
  const countFor = (d: Date) =>
    dosesBetween(meds.data ?? [], logs.data ?? [], pets.data ?? [], d, addDays(d, 1)).filter(
      (x) => x.at < addDays(d, 1) && x.status === 'pending',
    ).length;

  if (pets.isLoading || meds.isLoading) return <Loading />;
  const tag = localeTag(i18n.language);

  return (
    <Screen bottomSpace={140}>
      <T size={26} weight="bold" style={{ marginBottom: space.lg }}>
        {t('schedule.title')}
      </T>

      {/* Week strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: space.sm }}
      >
        {days.map((d, i) => {
          const active = i === offset;
          const pending = countFor(d);
          return (
            <Pressable
              key={i}
              onPress={() => setOffset(i)}
              style={[
                {
                  width: 58,
                  paddingVertical: space.md,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  backgroundColor: active ? colors.ink : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.ink : colors.border,
                },
                shadow,
              ]}
            >
              <T size={12} color={active ? '#B0BAC5' : colors.muted} weight="medium">
                {d.toLocaleDateString(tag, { weekday: 'short' })}
              </T>
              <T size={18} weight="bold" color={active ? colors.white : colors.ink}>
                {d.toLocaleDateString(tag, { day: 'numeric' })}
              </T>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 4,
                  backgroundColor: pending ? (active ? colors.white : colors.primary) : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {offset === 0 && agenda.overdue.length ? (
        <>
          <SectionTitle title={`${t('schedule.overdue')} (${agenda.overdue.length})`} />
          <View style={{ gap: space.md }}>
            {agenda.overdue.map((d) => (
              <DoseItem key={d.key} dose={d} overdue />
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle
        title={
          offset === 0
            ? t('schedule.today')
            : selected.toLocaleDateString(tag, { weekday: 'long', day: 'numeric', month: 'long' })
        }
      />
      {dayDoses.length ? (
        <View style={{ gap: space.md }}>
          {dayDoses.map((d) => (
            <DoseItem key={d.key} dose={d} />
          ))}
        </View>
      ) : (
        <EmptyState icon="calendar-outline" body={t('schedule.empty')} />
      )}
    </Screen>
  );
}
