import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { byDateDesc, openPetForm } from './helpers';
import { VisitRow } from './rows';
import { EmptyState, SectionTitle } from '@/components/ui';
import type { PetData } from '@/hooks/usePetData';
import { space } from '@/theme';

export function VisitsTab({ data }: { data: PetData }) {
  const { t } = useTranslation();
  const { pet } = data;
  const rows = byDateDesc(data.visits, (v) => v.visit_date);
  return (
    <View>
      <SectionTitle
        title={t('pet.tabs.visits')}
        action={t('common.add')}
        onAction={() => openPetForm(pet, 'visit')}
      />
      {rows.length ? (
        <View style={{ gap: space.sm }}>
          {rows.map((v) => (
            <VisitRow key={v.id} v={v} pet={pet} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="business-outline"
          body={t('visit.empty')}
          action={t('visit.newTitle')}
          onAction={() => openPetForm(pet, 'visit')}
        />
      )}
    </View>
  );
}
