import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconTile } from '@/components/common/ListItem';
import { Card, Detail, EmptyState, Row, SectionTitle, T } from '@/components/ui';
import type { PetData } from '@/hooks/usePetData';
import { formatDate } from '@/lib/dates';
import { colors, space } from '@/theme';

export function OriginTab({ data }: { data: PetData }) {
  const { t, i18n } = useTranslation();
  const { pet, origin } = data;
  const edit = () => router.push(`/pet/${pet.id}/edit`);
  return (
    <View>
      <SectionTitle title={t('origin.title')} action={t('common.edit')} onAction={edit} />
      {origin ? (
        <Card>
          <Row gap={space.md}>
            <IconTile
              name={
                origin.source === 'street_rescue' ? 'heart' : origin.source === 'shelter' ? 'home' : 'paw'
              }
              bg={colors.peach}
              fg={colors.primaryDark}
            />
            <View style={{ flex: 1 }}>
              <T size={16} weight="semibold">
                {t(`originSource.${origin.source}`)}
              </T>
              {origin.acquired_date ? (
                <T size={13} color={colors.muted}>
                  {t('origin.joined')}: {formatDate(origin.acquired_date, i18n.language)}
                </T>
              ) : null}
            </View>
          </Row>
          {origin.found_location ? (
            <Row gap={6} style={{ marginTop: space.md }}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <T size={14} style={{ flex: 1 }}>
                {origin.found_location}
              </T>
            </Row>
          ) : null}
          <Detail label={t('origin.condition')} value={origin.condition_at_rescue} />
          <Detail label={t('origin.by')} value={origin.rescuer_or_shelter} />
          {origin.notes ? (
            <T size={14} color={colors.inkSoft} style={{ marginTop: space.md, fontStyle: 'italic' }}>
              “{origin.notes}”
            </T>
          ) : null}
        </Card>
      ) : (
        <EmptyState
          icon="map-outline"
          body={t('origin.empty', { name: pet.name })}
          action={t('common.add')}
          onAction={edit}
        />
      )}

      <SectionTitle title={t('petForm.identity')} />
      <Card>
        <Detail label={t('petForm.breed')} value={[pet.breed, pet.breed_mix].filter(Boolean).join(' — ')} />
        <Detail
          label={t('petForm.coatType')}
          value={[pet.coat_type && t(`coat.${pet.coat_type}`, pet.coat_type), pet.coat_pattern]
            .filter(Boolean)
            .join(', ')}
        />
        <Detail
          label={t('petForm.neutered')}
          value={pet.neutered == null ? null : pet.neutered ? t('common.yes') : t('common.no')}
        />
        <Detail label={t('petForm.microchip')} value={pet.microchip} />
        <Detail label={t('petForm.marks')} value={pet.distinguishing_marks} />
        <Detail
          label={t('petForm.birthDate')}
          value={
            pet.birth_date
              ? `${formatDate(pet.birth_date, i18n.language)}${pet.birth_date_estimated ? ` (${t('common.estimated')})` : ''}`
              : null
          }
        />
      </Card>
    </View>
  );
}
