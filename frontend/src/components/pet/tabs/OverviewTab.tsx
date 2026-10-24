import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BreedWatch } from '../BreedPicker';
import { byDateDesc, ended, openPetForm } from './helpers';
import { ConditionRow, MedicineRow, VisitRow } from './rows';
import { Button, SectionTitle, T } from '@/components/ui';
import { breedRisks } from '@/constants/breeds';
import type { PetData } from '@/hooks/usePetData';
import { formatDate } from '@/lib/dates';
import { isDueDateItem } from '@/lib/schedule';
import { colors, space } from '@/theme';

export function OverviewTab({ data, onDelete }: { data: PetData; onDelete: () => void }) {
  const { t, i18n } = useTranslation();
  const { pet } = data;
  const active = data.conditions.filter((c) => c.status !== 'resolved');
  const recurring = data.medicines.filter((m) => m.active && !isDueDateItem(m) && !ended(m));
  const upcoming = data.medicines
    .filter((m) => m.active && isDueDateItem(m) && m.next_due)
    .sort((a, b) => (a.next_due ?? '').localeCompare(b.next_due ?? ''))
    .slice(0, 3);
  const lastVisit = byDateDesc(data.visits, (v) => v.visit_date)[0];
  const risks = breedRisks(pet.species, pet.breed);

  return (
    <View>
      <SectionTitle
        title={t('pet.activeConditions')}
        action={t('common.add')}
        onAction={() => openPetForm(pet, 'condition')}
      />
      {active.length ? (
        <View style={{ gap: space.sm }}>
          {active.map((c) => (
            <ConditionRow key={c.id} c={c} pet={pet} />
          ))}
        </View>
      ) : (
        <T size={14} color={colors.muted}>
          {t('common.none')}
        </T>
      )}

      <SectionTitle
        title={t('pet.currentMeds')}
        action={t('common.add')}
        onAction={() => openPetForm(pet, 'medicine')}
      />
      {recurring.length ? (
        <View style={{ gap: space.sm }}>
          {recurring.map((m) => (
            <MedicineRow key={m.id} m={m} pet={pet} logs={data.logs} />
          ))}
        </View>
      ) : (
        <T size={14} color={colors.muted}>
          {t('common.none')}
        </T>
      )}

      {upcoming.length ? (
        <>
          <SectionTitle title={t('pet.nextDue')} />
          <View style={{ gap: space.sm }}>
            {upcoming.map((m) => (
              <MedicineRow key={m.id} m={m} pet={pet} logs={data.logs} />
            ))}
          </View>
        </>
      ) : null}

      {lastVisit ? (
        <>
          <SectionTitle title={t('pet.lastVisit')} />
          <VisitRow v={lastVisit} pet={pet} />
        </>
      ) : null}

      {risks.length ? (
        <View style={{ marginTop: space.xl }}>
          <BreedWatch risks={risks} />
        </View>
      ) : null}

      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Button
          title={t('pet.vetSummary')}
          icon="document-text-outline"
          onPress={() => router.push(`/pet/${pet.id}/summary`)}
        />
        <Button
          title={t('pet.share')}
          variant="light"
          icon="people-outline"
          onPress={() => router.push(`/pet/${pet.id}/share`)}
        />
        <Button title={t('pet.deletePet')} variant="ghost" small onPress={onDelete} />
      </View>
      <T size={11} color={colors.muted} center style={{ marginTop: space.sm }}>
        {formatDate(pet.created_at.slice(0, 10), i18n.language)}
      </T>
    </View>
  );
}
