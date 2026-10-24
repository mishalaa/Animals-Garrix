import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ended, openPetForm } from './helpers';
import { MedicineRow } from './rows';
import { EmptyState, SectionTitle, T } from '@/components/ui';
import type { PetData } from '@/hooks/usePetData';
import { isDueDateItem } from '@/lib/schedule';
import { colors, space } from '@/theme';
import type { Medicine } from '@/types';

export function MedicinesTab({ data }: { data: PetData }) {
  const { t } = useTranslation();
  const { pet } = data;
  const recurring = data.medicines.filter((m) => m.active && !isDueDateItem(m) && !ended(m));
  const dueItems = data.medicines.filter((m) => isDueDateItem(m) && m.active);
  const past = data.medicines.filter((m) => !m.active || (!isDueDateItem(m) && ended(m)));

  const section = (title: string, rows: Medicine[]) =>
    rows.length ? (
      <View style={{ marginBottom: space.lg }}>
        <T size={13} weight="semibold" color={colors.muted} style={{ marginBottom: space.sm }}>
          {title}
        </T>
        <View style={{ gap: space.sm }}>
          {rows.map((m) => (
            <MedicineRow key={m.id} m={m} pet={pet} logs={data.logs} />
          ))}
        </View>
      </View>
    ) : null;

  return (
    <View>
      <SectionTitle
        title={t('pet.tabs.medicines')}
        action={t('common.add')}
        onAction={() => openPetForm(pet, 'medicine')}
      />
      {data.medicines.length ? (
        <>
          {section(t('pet.currentMeds'), recurring)}
          {section(t('medicine.vaccines'), dueItems)}
          {section(t('medicine.ended'), past)}
        </>
      ) : (
        <EmptyState
          icon="medical-outline"
          body={t('medicine.empty')}
          action={t('medicine.newTitle')}
          onAction={() => openPetForm(pet, 'medicine')}
        />
      )}
    </View>
  );
}
