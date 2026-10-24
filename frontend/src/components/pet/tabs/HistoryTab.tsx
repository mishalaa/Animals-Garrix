import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { STATUS_TONE } from '../tones';
import { byDateDesc, openPetForm } from './helpers';
import { ConditionRow } from './rows';
import { IconTile, ListItem } from '@/components/common/ListItem';
import { EmptyState, SectionTitle, T } from '@/components/ui';
import type { PetData } from '@/hooks/usePetData';
import { colors, space } from '@/theme';
import type { Condition } from '@/types';

export function HistoryTab({ data }: { data: PetData }) {
  const { t } = useTranslation();
  const { pet } = data;
  const groups: Condition['status'][] = ['active', 'managed', 'resolved'];

  return (
    <View>
      <SectionTitle
        title={t('allergy.title')}
        action={t('common.add')}
        onAction={() => openPetForm(pet, 'allergy')}
      />
      {data.allergies.length ? (
        <View style={{ gap: space.sm }}>
          {data.allergies.map((a) => (
            <ListItem
              key={a.id}
              icon={<IconTile name="alert-circle" bg={colors.dangerSoft} fg={colors.danger} />}
              title={a.allergen}
              subtitle={a.reaction}
              meta={t(`allergyKind.${a.kind}`)}
              onPress={() => openPetForm(pet, 'allergy', a.id)}
            />
          ))}
        </View>
      ) : (
        <T size={14} color={colors.muted}>
          {t('pet.noAllergies')}
        </T>
      )}

      <SectionTitle
        title={t('pet.tabs.history')}
        action={t('common.add')}
        onAction={() => openPetForm(pet, 'condition')}
      />
      {data.conditions.length ? (
        groups.map((g) => {
          const rows = byDateDesc(
            data.conditions.filter((c) => c.status === g),
            (c) => c.diagnosed_on,
          );
          if (!rows.length) return null;
          return (
            <View key={g} style={{ marginBottom: space.lg }}>
              <T size={13} weight="semibold" color={STATUS_TONE[g].fg} style={{ marginBottom: space.sm }}>
                {t(`conditionStatus.${g}`)}
              </T>
              <View style={{ gap: space.sm }}>
                {rows.map((c) => (
                  <ConditionRow key={c.id} c={c} pet={pet} />
                ))}
              </View>
            </View>
          );
        })
      ) : (
        <EmptyState
          icon="medkit-outline"
          body={t('condition.empty')}
          action={t('condition.newTitle')}
          onAction={() => openPetForm(pet, 'condition')}
        />
      )}
    </View>
  );
}
