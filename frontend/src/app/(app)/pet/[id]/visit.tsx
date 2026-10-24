import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FormScreen, orNull, useRecordForm } from '@/components/forms/RecordForm';
import { ChipGroup, DateField, Field, Loading, T, ToggleRow } from '@/components/ui';
import { api } from '@/services';
import { invalidateTable, useRecords } from '@/hooks/queries';
import { isValidISODate, toISODate } from '@/lib/dates';
import { colors, radius, space } from '@/theme';

export default function VisitForm() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const f = useRecordForm('visits');
  const conditions = useRecords('conditions', f.petId);

  const [date, setDate] = useState(toISODate(new Date()));
  const [clinic, setClinic] = useState('');
  const [vet, setVet] = useState('');
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [resolve, setResolve] = useState(false);
  const [addMed, setAddMed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const e = f.existing;
    if (!e) return;
    setDate(e.visit_date);
    setClinic(e.clinic ?? '');
    setVet(e.vet_name ?? '');
    setReason(e.reason ?? '');
    setDiagnosis(e.diagnosis ?? '');
    setNotes(e.notes ?? '');
    setCost(e.cost != null ? String(e.cost) : '');
    setConditionId(e.condition_id);
  }, [f.existing]);

  if (f.loading || conditions.isLoading) return <Loading />;

  const linked = conditions.data?.find((c) => c.id === conditionId);
  const canResolve = linked && linked.status !== 'resolved';

  const save = () => {
    const err: Record<string, string> = {};
    if (!isValidISODate(date)) err.date = t('common.invalidDate');
    if (cost && isNaN(Number(cost))) err.cost = t('common.error');
    setErrors(err);
    if (Object.keys(err).length) return;
    f.submit(
      {
        visit_date: date,
        clinic: orNull(clinic),
        vet_name: orNull(vet),
        reason: orNull(reason),
        diagnosis: orNull(diagnosis),
        notes: orNull(notes),
        cost: cost ? Number(cost) : null,
        currency: 'BDT',
        condition_id: conditionId,
      },
      async (saved) => {
        if (resolve && linked) {
          await api.update('conditions', linked.id, { status: 'resolved', resolved_on: date });
          await invalidateTable(qc, 'conditions');
        }
        if (addMed) {
          const q = `visitId=${saved.id}${conditionId ? `&conditionId=${conditionId}` : ''}`;
          return `/pet/${f.petId}/medicine?${q}`;
        }
      },
    );
  };

  const open = (conditions.data ?? []).filter((c) => c.status !== 'resolved' || c.id === conditionId);

  return (
    <FormScreen
      title={f.itemId ? t('visit.editTitle') : t('visit.newTitle')}
      onSave={save}
      onDelete={f.itemId ? f.destroy : undefined}
      saving={f.saving}
    >
      <DateField label={t('visit.date')} value={date} onChange={setDate} error={errors.date} />
      <Field label={t('visit.reason')} value={reason} onChangeText={setReason} />
      <Field label={t('visit.clinic')} value={clinic} onChangeText={setClinic} />
      <Field label={t('visit.vet')} value={vet} onChangeText={setVet} />
      <Field label={t('visit.diagnosis')} value={diagnosis} onChangeText={setDiagnosis} multiline />
      <Field label={t('visit.notes')} value={notes} onChangeText={setNotes} multiline />
      <Field
        label={t('visit.cost')}
        value={cost}
        onChangeText={setCost}
        keyboardType="decimal-pad"
        error={errors.cost}
      />

      {open.length ? (
        <ChipGroup
          label={t('visit.condition')}
          options={open.map((c) => ({ value: c.id, label: c.name }))}
          value={conditionId}
          onChange={(v) => {
            setConditionId(v);
            setResolve(false);
          }}
          allowEmpty
        />
      ) : null}

      {canResolve ? (
        <View
          style={{
            backgroundColor: colors.mint,
            borderRadius: radius.md,
            padding: space.md,
            marginBottom: space.lg,
          }}
        >
          <T size={13} weight="semibold" color={colors.mintInk} style={{ marginBottom: space.sm }}>
            {t('visit.followUp')}
          </T>
          <ToggleRow
            label={t('visit.resolveCondition', { name: linked!.name })}
            value={resolve}
            onChange={setResolve}
          />
        </View>
      ) : null}

      {!f.itemId ? <ToggleRow label={t('visit.addMedicine')} value={addMed} onChange={setAddMed} /> : null}
    </FormScreen>
  );
}
