import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { PetCard } from '@/components/pet/PetCard';
import {
  Chip,
  EmptyState,
  Loading,
  Row,
  Screen,
  SectionTitle,
  SpeciesIcon,
  T,
  useFont,
} from '@/components/ui';
import { usePets, useProfile, useRecords } from '@/hooks/queries';
import { buildAgenda } from '@/lib/schedule';
import { colors, radius, shadow, space } from '@/theme';
import type { Species } from '@/types';

export default function Home() {
  const { t } = useTranslation();
  const font = useFont();
  const profile = useProfile();
  const pets = usePets();
  const meds = useRecords('medicines');
  const logs = useRecords('dose_logs');
  const conditions = useRecords('conditions');
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<Species | 'all'>('all');

  const agenda = useMemo(
    () => buildAgenda(meds.data ?? [], logs.data ?? [], pets.data ?? []),
    [meds.data, logs.data, pets.data],
  );
  const pendingToday = agenda.today.filter((d) => d.status === 'pending').length;

  const attention = useMemo(() => {
    const s = new Set<string>();
    (conditions.data ?? []).filter((c) => c.status === 'active').forEach((c) => s.add(c.pet_id));
    agenda.overdue.forEach((d) => s.add(d.medicine.pet_id));
    return s;
  }, [conditions.data, agenda.overdue]);

  if (pets.isLoading) return <Loading />;
  const all = pets.data ?? [];
  const speciesPresent = Array.from(new Set(all.map((p) => p.species)));
  const shown = all.filter(
    (p) =>
      (species === 'all' || p.species === species) &&
      (!query.trim() || `${p.name} ${p.breed ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const firstName = (profile.data?.full_name ?? '').split(' ')[0];

  return (
    <Screen bottomSpace={140}>
      {/* Greeting */}
      <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
        <View>
          <T size={13} color={colors.muted} weight="medium">
            {t('home.hello')}
          </T>
          <T size={24} weight="bold">
            {firstName || t('app.name')} 👋
          </T>
        </View>
        <Pressable
          onPress={() => router.push('/profile')}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.peach,
            borderWidth: 1.5,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T size={18} weight="bold" color={colors.primaryDark}>
            {(firstName || 'P').charAt(0).toUpperCase()}
          </T>
        </Pressable>
      </Row>

      {/* Search */}
      <Row
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            paddingHorizontal: space.lg,
            height: 52,
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadow,
        ]}
      >
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('common.search')}
          placeholderTextColor="#9EA8B3"
          style={{ flex: 1, fontFamily: font('regular'), fontSize: 15, color: colors.ink, height: '100%', marginLeft: 8 }}
        />
      </Row>

      {/* Due today banner */}
      <Pressable
        onPress={() => router.push('/schedule')}
        style={({ pressed }) => ({
          marginTop: space.lg,
          backgroundColor: colors.primary,
          borderRadius: radius.xl,
          padding: space.xl,
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
          opacity: pressed ? 0.94 : 1,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          shadowColor: colors.primary,
          shadowOpacity: 0.25,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        })}
      >
        <View style={{ flex: 1 }}>
          <Row gap={6} style={{ marginBottom: 4 }}>
            <Ionicons name="sparkles" size={14} color="#FFF0ED" />
            <T size={13} color="#FFF0ED" weight="medium">
              {t('home.dueToday')}
            </T>
          </Row>
          <T size={22} weight="bold" color={colors.white}>
            {pendingToday ? t('home.tasksToday', { count: pendingToday }) : t('home.allDone')}
          </T>
          {agenda.overdue.length ? (
            <View
              style={{
                marginTop: space.md,
                alignSelf: 'flex-start',
                backgroundColor: colors.white,
                borderRadius: radius.pill,
                paddingHorizontal: 12,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Ionicons name="alert-circle" size={14} color={colors.danger} />
              <T size={12} weight="bold" color={colors.danger}>
                {t('home.overdue', { count: agenda.overdue.length })}
              </T>
            </View>
          ) : null}
        </View>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <Ionicons name={pendingToday ? 'alarm' : 'checkmark-done'} size={36} color={colors.white} />
        </View>
      </Pressable>

      {/* Pets */}
      <SectionTitle title={t('home.yourPets')} />
      {speciesPresent.length > 1 ? (
        <Row style={{ flexWrap: 'wrap', marginBottom: space.lg }}>
          <Chip label={t('home.filterAll')} selected={species === 'all'} onPress={() => setSpecies('all')} />
          {speciesPresent.map((s) => (
            <Chip
              key={s}
              label={t(`speciesPlural.${s}`)}
              selected={species === s}
              onPress={() => setSpecies(s)}
              icon={<SpeciesIcon species={s} size={16} color={species === s ? colors.white : colors.ink} />}
            />
          ))}
        </Row>
      ) : null}

      {all.length === 0 ? (
        <EmptyState
          title={t('home.noPets')}
          body={t('home.noPetsBody')}
          action={t('home.addPet')}
          onAction={() => router.push('/pet/new')}
        />
      ) : (
        <View style={{ gap: space.md }}>
          {chunk(shown, 2).map((pair, i) => (
            <Row key={i} gap={space.md} style={{ alignItems: 'stretch' }}>
              {pair.map((p) => (
                <PetCard key={p.id} pet={p} alert={attention.has(p.id)} />
              ))}
              {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </Row>
          ))}
        </View>
      )}
    </Screen>
  );
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
