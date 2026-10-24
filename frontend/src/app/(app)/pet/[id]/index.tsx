import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAgeLabel } from '@/components/pet/PetCard';
import {
  HistoryTab,
  MedicinesTab,
  OriginTab,
  OverviewTab,
  ReportsTab,
  VisitsTab,
} from '@/components/pet/tabs';
import { usePetData } from '@/hooks/usePetData';
import { Chip, EmptyState, IconButton, Loading, PetImage, Row, StatTile, T, goBack } from '@/components/ui';
import { useDeletePet, useOrigin, usePet, useRecords } from '@/hooks/queries';
import { formatNumber } from '@/lib/dates';
import { confirm } from '@/lib/platform';
import { colors, MAX_WIDTH, pastelFor, radius, shadow, space } from '@/theme';

const TABS = ['overview', 'history', 'visits', 'medicines', 'reports', 'origin'] as const;
type Tab = (typeof TABS)[number];

export default function PetDetail() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const age = useAgeLabel();
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : 'overview');

  const pet = usePet(id);
  const origin = useOrigin(id);
  const conditions = useRecords('conditions', id);
  const allergies = useRecords('allergies', id);
  const visits = useRecords('visits', id);
  const medicines = useRecords('medicines', id);
  const logs = useRecords('dose_logs', id);
  const reports = useRecords('reports', id);
  const del = useDeletePet();

  const data = usePetData({
    pet: pet.data,
    origin: origin.data,
    conditions: conditions.data,
    allergies: allergies.data,
    visits: visits.data,
    medicines: medicines.data,
    logs: logs.data,
    reports: reports.data,
  });

  if (pet.isLoading) return <Loading />;
  if (!data) {
    return (
      <View
        style={{ flex: 1, padding: space.xl, paddingTop: insets.top + space.xl, backgroundColor: colors.bg }}
      >
        <EmptyState body={t('pet.notFound')} />
      </View>
    );
  }

  const p = data.pet;
  const tone = pastelFor(p.id);

  const onDelete = async () => {
    if (await confirm(t('pet.deletePetConfirm', { name: p.name }), t('common.delete'), t('common.cancel'))) {
      await del.mutateAsync(p.id);
      router.replace('/');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40, alignItems: 'center' }}
    >
      <View style={{ width: '100%', maxWidth: MAX_WIDTH }}>
        {/* Hero: pastel backdrop with the pet front and centre */}
        <View
          style={{
            backgroundColor: tone.bg,
            paddingTop: insets.top + space.sm,
            paddingBottom: 56,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: space.lg,
          }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <IconButton icon="arrow-back" onPress={goBack} label={t('common.back')} />
            <IconButton
              icon="create-outline"
              onPress={() => router.push(`/pet/${p.id}/edit`)}
              label={t('common.edit')}
            />
          </Row>
          <View style={{ alignItems: 'center', marginTop: space.sm }}>
            <View
              style={{
                padding: 10,
                borderRadius: 110,
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              <PetImage pet={p} size={180} rounded={90} />
            </View>
          </View>
        </View>

        <View
          style={{
            width: '100%',
            paddingHorizontal: space.lg,
            marginTop: -40,
          }}
        >
          {/* Name card */}
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: space.xl,
                borderWidth: 1,
                borderColor: colors.border,
              },
              shadow,
            ]}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <T size={26} weight="bold">
                  {p.name}
                </T>
                <T size={14} color={colors.muted} style={{ marginTop: 2 }}>
                  {[p.breed || t(`species.${p.species}`), p.breed_mix].filter(Boolean).join(' · ')}
                </T>
              </View>
              <View
                style={{
                  backgroundColor: tone.bg,
                  borderRadius: radius.pill,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <T size={13} weight="bold" color={tone.fg}>
                  {t(`species.${p.species}`)}
                </T>
              </View>
            </Row>

            <Row gap={space.sm} style={{ marginTop: space.lg }}>
              <StatTile
                value={age(p.birth_date)}
                label={t('pet.age')}
                bg={colors.peach}
                fg={colors.primaryDark}
              />
              <StatTile
                value={t(`sex.${p.sex}`)}
                label={t('pet.sex')}
                bg={colors.sky}
                fg={colors.skyInk}
              />
              <StatTile
                value={
                  p.weight_kg != null ? t('pet.kg', { value: formatNumber(p.weight_kg, i18n.language) }) : '—'
                }
                label={t('pet.weight')}
                bg={colors.mint}
                fg={colors.mintInk}
              />
            </Row>

            {/* Allergies always visible */}
            {data.allergies.length ? (
              <Row
                gap={space.sm}
                style={{
                  marginTop: space.lg,
                  backgroundColor: colors.dangerSoft,
                  borderRadius: radius.md,
                  padding: space.md,
                  alignItems: 'flex-start',
                  borderWidth: 1,
                  borderColor: '#FCD7D7',
                }}
              >
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <T size={13} weight="bold" color={colors.danger}>
                    {t('pet.allergies')}
                  </T>
                  <T size={13} color={colors.ink}>
                    {data.allergies.map((a) => a.allergen).join(', ')}
                  </T>
                </View>
              </Row>
            ) : null}
          </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: space.xl, marginHorizontal: -space.lg }}
          contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}
        >
          {TABS.map((k) => (
            <Chip key={k} label={t(`pet.tabs.${k}`)} selected={tab === k} onPress={() => setTab(k)} />
          ))}
        </ScrollView>

        {tab === 'overview' && <OverviewTab data={data} onDelete={onDelete} />}
        {tab === 'history' && <HistoryTab data={data} />}
        {tab === 'visits' && <VisitsTab data={data} />}
        {tab === 'medicines' && <MedicinesTab data={data} />}
        {tab === 'reports' && <ReportsTab data={data} />}
        {tab === 'origin' && <OriginTab data={data} />}
      </View>
    </View>
  </ScrollView>
);
}

