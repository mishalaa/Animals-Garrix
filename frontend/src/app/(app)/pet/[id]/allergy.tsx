import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormScreen, orNull, useRecordForm } from '@/components/forms/RecordForm';
import { ChipGroup, Field, Loading } from '@/components/ui';
import type { AllergyKind } from '@/types';

const KINDS: AllergyKind[] = ['food', 'medicine', 'environment', 'other'];

export default function AllergyForm() {
  const { t } = useTranslation();
  const f = useRecordForm('allergies');
  const [allergen, setAllergen] = useState('');
  const [kind, setKind] = useState<AllergyKind>('food');
  const [reaction, setReaction] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!f.existing) return;
    setAllergen(f.existing.allergen);
    setKind(f.existing.kind);
    setReaction(f.existing.reaction ?? '');
  }, [f.existing]);

  if (f.loading) return <Loading />;

  return (
    <FormScreen
      title={f.itemId ? t('allergy.editTitle') : t('allergy.newTitle')}
      saving={f.saving}
      onDelete={f.itemId ? f.destroy : undefined}
      onSave={() => {
        if (!allergen.trim()) return setError(t('common.required', { field: t('allergy.allergen') }));
        f.submit({ allergen: allergen.trim(), kind, reaction: orNull(reaction) });
      }}
    >
      <Field
        label={t('allergy.allergen')}
        value={allergen}
        onChangeText={setAllergen}
        placeholder={t('allergy.allergenHint')}
        error={error}
      />
      <ChipGroup
        label={t('allergy.kind')}
        options={KINDS.map((v) => ({ value: v, label: t(`allergyKind.${v}`) }))}
        value={kind}
        onChange={(v) => v && setKind(v)}
      />
      <Field label={t('allergy.reaction')} value={reaction} onChangeText={setReaction} multiline />
    </FormScreen>
  );
}
