import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Row, T } from '@/components/ui';
import { api } from '@/services';
import { invalidateTable } from '@/hooks/queries';
import { formatDate, formatTime, toISODate } from '@/lib/dates';
import { isDueDateItem, nextDueAfter, type Dose } from '@/lib/schedule';
import { colors, radius, shadow, space } from '@/theme';
import type { MedicineKind } from '@/types';

const KIND_ICON: Record<MedicineKind, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  medicine: 'pill',
  vaccine: 'needle',
  deworming: 'bug-outline',
  flea_tick: 'spray-bottle',
  supplement: 'bottle-tonic-plus-outline',
};
const KIND_TONE: Record<MedicineKind, { bg: string; fg: string }> = {
  medicine: { bg: colors.peach, fg: colors.primaryDark },
  vaccine: { bg: colors.lavender, fg: colors.lavenderInk },
  deworming: { bg: colors.mint, fg: colors.mintInk },
  flea_tick: { bg: colors.butter, fg: colors.butterInk },
  supplement: { bg: colors.sky, fg: colors.skyInk },
};

export function MedicineIcon({ kind, size = 44 }: { kind: MedicineKind; size?: number }) {
  const tone = KIND_TONE[kind] ?? KIND_TONE.medicine;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: tone.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={KIND_ICON[kind] ?? 'pill'} size={size * 0.5} color={tone.fg} />
    </View>
  );
}

/** Mark a dose done or skipped (or undo). Due-date items roll their next_due forward when done. */
export function useDoseActions() {
  const qc = useQueryClient();
  const refresh = () => Promise.all([invalidateTable(qc, 'dose_logs'), invalidateTable(qc, 'medicines')]);

  return {
    async log(dose: Dose, status: 'done' | 'skipped') {
      const m = dose.medicine;
      if (dose.log) await api.update('dose_logs', dose.log.id, { status });
      else
        await api.insert('dose_logs', {
          pet_id: m.pet_id,
          medicine_id: m.id,
          scheduled_for: dose.at.toISOString(),
          status,
        });
      if (status === 'done' && isDueDateItem(m)) {
        const next = nextDueAfter(m, new Date());
        await api.update('medicines', m.id, next ? { next_due: next } : { active: false });
      }
      await refresh();
    },
    async undo(dose: Dose) {
      if (dose.log) await api.remove('dose_logs', dose.log.id);
      await refresh();
    },
  };
}

export function DoseItem({ dose, showDate, overdue }: { dose: Dose; showDate?: boolean; overdue?: boolean }) {
  const { t, i18n } = useTranslation();
  const actions = useDoseActions();
  const m = dose.medicine;
  const done = dose.status !== 'pending';

  const when =
    showDate || overdue
      ? `${formatDate(toISODate(dose.at), i18n.language)} · ${formatTime(dose.at, i18n.language)}`
      : formatTime(dose.at, i18n.language);

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: space.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadow,
        done && { opacity: 0.7 },
      ]}
    >
      <Row gap={space.md}>
        <Pressable onPress={() => router.push(`/pet/${m.pet_id}/medicine?itemId=${m.id}`)}>
          <MedicineIcon kind={m.kind} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <T
            size={15}
            weight="semibold"
            numberOfLines={1}
            style={done && { textDecorationLine: 'line-through' }}
          >
            {m.name}
          </T>
          <T size={12} color={colors.muted} numberOfLines={1}>
            {[dose.pet?.name, m.dose, t(`medicineKind.${m.kind}`)].filter(Boolean).join(' · ')}
          </T>
          <Row gap={4} style={{ marginTop: 2 }}>
            <Ionicons name="time-outline" size={13} color={overdue ? colors.danger : colors.muted} />
            <T
              size={12}
              color={overdue ? colors.danger : colors.muted}
              weight={overdue ? 'medium' : 'regular'}
            >
              {when}
            </T>
          </Row>
        </View>
        {done ? (
          <Pressable onPress={() => actions.undo(dose)} hitSlop={8} style={{ alignItems: 'center' }}>
            <Ionicons
              name={dose.status === 'done' ? 'checkmark-circle' : 'remove-circle'}
              size={28}
              color={dose.status === 'done' ? colors.mintInk : colors.muted}
            />
            <T size={11} color={colors.muted}>
              {t('schedule.undo')}
            </T>
          </Pressable>
        ) : null}
      </Row>
      {!done ? (
        <Row gap={space.sm} style={{ marginTop: space.md }}>
          <Pressable
            onPress={() => actions.log(dose, 'skipped')}
            style={({ pressed }) => [
              pill,
              {
                backgroundColor: colors.surfaceHover,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <T size={14} weight="medium" color={colors.inkSoft}>
              {t('common.skip')}
            </T>
          </Pressable>
          <Pressable
            onPress={() => actions.log(dose, 'done')}
            style={({ pressed }) => [
              pill,
              {
                backgroundColor: colors.ink,
                opacity: pressed ? 0.8 : 1,
                shadowColor: colors.ink,
                shadowOpacity: 0.2,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              },
            ]}
          >
            <Ionicons name="checkmark" size={16} color={colors.white} />
            <T size={14} weight="semibold" color={colors.white}>
              {t('common.done')}
            </T>
          </Pressable>
        </Row>
      ) : null}
    </View>
  );
}

const pill = {
  flex: 1,
  height: 40,
  borderRadius: radius.pill,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexDirection: 'row' as const,
  gap: 6,
};
