import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormScreen, orNull, useFormParams, useRecordForm } from '@/components/forms/RecordForm';
import { ChipGroup, DateField, Field, Loading, ToggleRow } from '@/components/ui';
import { useRecords } from '@/hooks/queries';
import { isValidISODate, toISODate } from '@/lib/dates';
import type { Frequency, MedicineKind } from '@/types';

const KINDS: MedicineKind[] = ['medicine', 'vaccine', 'deworming', 'flea_tick', 'supplement'];
const FREQS: Frequency[] = ['daily', 'twice_daily', 'weekly', 'monthly', 'yearly', 'once'];
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

export default function MedicineForm() {
  const { t } = useTranslation();
  const params = useFormParams();
  const f = useRecordForm('medicines');
  const conditions = useRecords('conditions', f.petId);

  const [name, setName] = useState('');
  const [kind, setKind] = useState<MedicineKind>('medicine');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState<Frequency>('daily');
  const [times, setTimes] = useState('09:00');
  const [start, setStart] = useState(toISODate(new Date()));
  const [end, setEnd] = useState('');
  const [total, setTotal] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [conditionId, setConditionId] = useState<string | null>(params.conditionId ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const e = f.existing;
    if (!e) return;
    setName(e.name);
    setKind(e.kind);
    setDose(e.dose ?? '');
    setFreq(e.frequency);
    setTimes((e.times ?? []).join(', '));
    setStart(e.start_date);
    setEnd(e.end_date ?? '');
    setTotal(e.total_doses != null ? String(e.total_doses) : '');
    setNextDue(e.next_due ?? '');
    setNotes(e.notes ?? '');
    setActive(e.active);
    setConditionId(e.condition_id);
  }, [f.existing]);

  if (f.loading) return <Loading />;

  // Vaccines, deworming and once/yearly items are tracked by a due date rather than daily times.
  const dueStyle = kind === 'vaccine' || kind === 'deworming' || freq === 'once' || freq === 'yearly';

  const pickKind = (k: MedicineKind | null) => {
    if (!k) return;
    setKind(k);
    if (k === 'vaccine' && (freq === 'daily' || freq === 'twice_daily')) setFreq('yearly');
    if (k === 'deworming' && (freq === 'daily' || freq === 'twice_daily')) setFreq('once');
  };

  const pickFreq = (v: Frequency | null) => {
    if (!v) return;
    setFreq(v);
    if (v === 'twice_daily' && !times.includes(',')) setTimes('08:00, 20:00');
  };

  const save = () => {
    const err: Record<string, string> = {};
    const timeList = times
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim()) err.name = t('common.required', { field: t('medicine.name') });
    if (!isValidISODate(start)) err.start = t('common.invalidDate');
    if (end && !isValidISODate(end)) err.end = t('common.invalidDate');
    if (nextDue && !isValidISODate(nextDue)) err.nextDue = t('common.invalidDate');
    if (dueStyle && !nextDue) err.nextDue = t('common.required', { field: t('medicine.nextDue') });
    if (!dueStyle && (!timeList.length || timeList.some((x) => !TIME_RE.test(x))))
      err.times = t('medicine.timesHint');
    if (total && (isNaN(Number(total)) || Number(total) < 1)) err.total = t('common.error');
    setErrors(err);
    if (Object.keys(err).length) return;

    f.submit({
      name: name.trim(),
      kind,
      dose: orNull(dose),
      frequency: freq,
      times: dueStyle
        ? timeList.length && timeList.every((x) => TIME_RE.test(x))
          ? timeList
          : ['09:00']
        : timeList.map(pad),
      start_date: start,
      end_date: dueStyle ? null : orNull(end),
      total_doses: !dueStyle && total ? Number(total) : null,
      next_due: dueStyle ? orNull(nextDue) : null,
      notes: orNull(notes),
      active,
      condition_id: conditionId,
      visit_id: f.existing?.visit_id ?? params.visitId ?? null,
    });
  };

  const conditionOptions = (conditions.data ?? []).filter(
    (c) => c.status !== 'resolved' || c.id === conditionId,
  );

  return (
    <FormScreen
      title={f.itemId ? t('medicine.editTitle') : t('medicine.newTitle')}
      onSave={save}
      onDelete={f.itemId ? f.destroy : undefined}
      saving={f.saving}
    >
      <Field
        label={t('medicine.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('medicine.nameHint')}
        error={errors.name}
      />
      <ChipGroup
        label={t('medicine.kind')}
        options={KINDS.map((v) => ({ value: v, label: t(`medicineKind.${v}`) }))}
        value={kind}
        onChange={pickKind}
      />
      <Field
        label={t('medicine.dose')}
        value={dose}
        onChangeText={setDose}
        placeholder={t('medicine.doseHint')}
      />
      <ChipGroup
        label={t('medicine.frequency')}
        options={FREQS.map((v) => ({ value: v, label: t(`frequency.${v}`) }))}
        value={freq}
        onChange={pickFreq}
      />

      {dueStyle ? (
        <DateField
          label={t('medicine.nextDue')}
          value={nextDue}
          onChange={setNextDue}
          error={errors.nextDue}
        />
      ) : (
        <>
          <Field
            label={t('medicine.times')}
            value={times}
            onChangeText={setTimes}
            placeholder={t('medicine.timesHint')}
            error={errors.times}
          />
          <DateField label={t('medicine.startDate')} value={start} onChange={setStart} error={errors.start} />
          <DateField
            label={`${t('medicine.endDate')} (${t('common.optional')})`}
            value={end}
            onChange={setEnd}
            error={errors.end}
          />
          <Field
            label={`${t('medicine.totalDoses')} (${t('common.optional')})`}
            value={total}
            onChangeText={setTotal}
            keyboardType="number-pad"
            error={errors.total}
          />
        </>
      )}

      {conditionOptions.length ? (
        <ChipGroup
          label={t('medicine.condition')}
          options={conditionOptions.map((c) => ({ value: c.id, label: c.name }))}
          value={conditionId}
          onChange={setConditionId}
          allowEmpty
        />
      ) : null}
      <Field label={t('medicine.notes')} value={notes} onChangeText={setNotes} multiline />
      {f.itemId ? <ToggleRow label={t('medicine.active')} value={active} onChange={setActive} /> : null}
    </FormScreen>
  );
}

function pad(hhmm: string) {
  const [h, m] = hhmm.split(':');
  return `${h.padStart(2, '0')}:${m}`;
}
