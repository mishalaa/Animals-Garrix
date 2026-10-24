import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormScreen, orNull, useRecordForm } from '@/components/forms/RecordForm';
import { ChipGroup, DateField, Field, Loading, ToggleRow } from '@/components/ui';
import { isValidISODate } from '@/lib/dates';
import type { ConditionKind, ConditionStatus, Severity } from '@/types';

const KINDS: ConditionKind[] = ['illness', 'chronic', 'injury', 'surgery'];
const STATUSES: ConditionStatus[] = ['active', 'managed', 'resolved'];
const SEVERITIES: Severity[] = ['mild', 'moderate', 'severe'];

export default function ConditionForm() {
  const { t } = useTranslation();
  const f = useRecordForm('conditions');
  const e = f.existing;

  const [name, setName] = useState('');
  const [kind, setKind] = useState<ConditionKind>('illness');
  const [status, setStatus] = useState<ConditionStatus>('active');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [diagnosed, setDiagnosed] = useState('');
  const [resolved, setResolved] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [by, setBy] = useState('');
  const [pre, setPre] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!e) return;
    setName(e.name);
    setKind(e.kind);
    setStatus(e.status);
    setSeverity(e.severity);
    setDiagnosed(e.diagnosed_on ?? '');
    setResolved(e.resolved_on ?? '');
    setSymptoms(e.symptoms ?? '');
    setTreatment(e.treatment ?? '');
    setBy(e.diagnosed_by ?? '');
    setPre(e.pre_adoption);
    setNotes(e.notes ?? '');
  }, [e]);

  if (f.loading) return <Loading />;

  const save = () => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = t('common.required', { field: t('condition.name') });
    if (diagnosed && !isValidISODate(diagnosed)) err.diagnosed = t('common.invalidDate');
    if (resolved && !isValidISODate(resolved)) err.resolved = t('common.invalidDate');
    setErrors(err);
    if (Object.keys(err).length) return;
    f.submit({
      name: name.trim(),
      kind,
      status,
      severity,
      diagnosed_on: orNull(diagnosed),
      resolved_on: status === 'resolved' ? orNull(resolved) : null,
      symptoms: orNull(symptoms),
      treatment: orNull(treatment),
      diagnosed_by: orNull(by),
      pre_adoption: pre,
      notes: orNull(notes),
    });
  };

  return (
    <FormScreen
      title={f.itemId ? t('condition.editTitle') : t('condition.newTitle')}
      onSave={save}
      onDelete={f.itemId ? f.destroy : undefined}
      saving={f.saving}
    >
      <Field
        label={t('condition.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('condition.nameHint')}
        error={errors.name}
      />
      <ChipGroup
        label={t('condition.kind')}
        options={KINDS.map((v) => ({ value: v, label: t(`conditionKind.${v}`) }))}
        value={kind}
        onChange={(v) => v && setKind(v)}
      />
      <ChipGroup
        label={t('condition.status')}
        options={STATUSES.map((v) => ({ value: v, label: t(`conditionStatus.${v}`) }))}
        value={status}
        onChange={(v) => v && setStatus(v)}
      />
      <ChipGroup
        label={t('condition.severity')}
        options={SEVERITIES.map((v) => ({ value: v, label: t(`severity.${v}`) }))}
        value={severity}
        onChange={setSeverity}
        allowEmpty
      />
      <DateField
        label={t('condition.diagnosedOn')}
        value={diagnosed}
        onChange={setDiagnosed}
        error={errors.diagnosed}
      />
      {status === 'resolved' ? (
        <DateField
          label={t('condition.resolvedOn')}
          value={resolved}
          onChange={setResolved}
          error={errors.resolved}
        />
      ) : null}
      <Field label={t('condition.symptoms')} value={symptoms} onChangeText={setSymptoms} multiline />
      <Field label={t('condition.treatment')} value={treatment} onChangeText={setTreatment} multiline />
      <Field label={t('condition.diagnosedBy')} value={by} onChangeText={setBy} />
      <ToggleRow label={t('condition.preAdoption')} value={pre} onChange={setPre} />
      <Field label={t('condition.notes')} value={notes} onChangeText={setNotes} multiline />
    </FormScreen>
  );
}
