import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { PetImage, T } from '@/components/ui';
import { ageParts } from '@/lib/dates';
import { colors, radius, shadow, space } from '@/theme';
import type { Pet } from '@/types';

export function useAgeLabel() {
  const { t } = useTranslation();
  return (birth: string | null) => {
    const a = ageParts(birth);
    if (!a) return t('common.unknown');
    if (a.years === 0) return t('pet.months', { count: a.months });
    return a.months && a.years < 3
      ? `${t('pet.years', { count: a.years })} ${t('pet.months', { count: a.months })}`
      : t('pet.years', { count: a.years });
  };
}

/** Grid card from reference 3: photo tile on top, name and breed beneath. */
export function PetCard({ pet, alert }: { pet: Pet; alert?: boolean }) {
  const { t } = useTranslation();
  const age = useAgeLabel();
  return (
    <Pressable
      onPress={() => router.push(`/pet/${pet.id}`)}
      accessibilityRole="button"
      accessibilityLabel={pet.name}
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: 10,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
        shadow,
      ]}
    >
      <PetImage pet={pet} size="100%" rounded={radius.lg} />
      <View style={{ paddingHorizontal: 6, paddingTop: space.md, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <T size={16} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
            {pet.name}
          </T>
          {alert ? (
            <View
              accessibilityLabel={t('home.needsAttention')}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: colors.dangerSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="medkit" size={13} color={colors.danger} />
            </View>
          ) : null}
        </View>
        <T size={12} color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {[pet.breed || t(`species.${pet.species}`), age(pet.birth_date)].join(' · ')}
        </T>
      </View>
    </Pressable>
  );
}
