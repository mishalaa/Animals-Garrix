import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { byDateDesc, openPetForm } from './helpers';
import { ReportRow } from './rows';
import { EmptyState, SectionTitle } from '@/components/ui';
import type { PetData } from '@/hooks/usePetData';
import { space } from '@/theme';

export function ReportsTab({ data }: { data: PetData }) {
  const { t } = useTranslation();
  const { pet } = data;
  const rows = byDateDesc(data.reports, (r) => r.report_date);
  return (
    <View>
      <SectionTitle
        title={t('pet.tabs.reports')}
        action={t('common.add')}
        onAction={() => openPetForm(pet, 'report')}
      />
      {rows.length ? (
        <View style={{ gap: space.sm }}>
          {rows.map((r) => (
            <ReportRow key={r.id} r={r} pet={pet} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="folder-open-outline"
          body={t('report.empty')}
          action={t('report.newTitle')}
          onAction={() => openPetForm(pet, 'report')}
        />
      )}
    </View>
  );
}
