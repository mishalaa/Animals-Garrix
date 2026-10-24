import { useTranslation } from 'react-i18next';

import { IconTile, ListItem } from '@/components/common/ListItem';
import { MedicineIcon } from '@/components/schedule/DoseItem';
import { Badge, Button } from '@/components/ui';
import { REPORT_ICON, STATUS_TONE } from '../tones';
import { openPetForm } from './helpers';
import { useFileUrl } from '@/hooks/queries';
import { formatDate, formatNumber, parseISODate, today } from '@/lib/dates';
import { openFile } from '@/lib/platform';
import { courseProgress, isDueDateItem } from '@/lib/schedule';
import { colors } from '@/theme';
import type { Condition, DoseLog, Medicine, Pet, Report, Visit } from '@/types';

// List rows shared by the pet profile tabs.

export function ConditionRow({ c, pet }: { c: Condition; pet: Pet }) {
  const { t, i18n } = useTranslation();
  const tone = STATUS_TONE[c.status];
  return (
    <ListItem
      icon={
        <IconTile
          name={
            c.kind === 'surgery' ? 'cut-outline' : c.kind === 'injury' ? 'bandage-outline' : 'medkit-outline'
          }
          bg={tone.bg}
          fg={tone.fg}
        />
      }
      title={c.name}
      subtitle={c.treatment || c.symptoms}
      meta={[
        t(`conditionKind.${c.kind}`),
        c.diagnosed_on ? formatDate(c.diagnosed_on, i18n.language) : null,
        c.pre_adoption ? t('condition.preAdoption') : null,
      ]
        .filter(Boolean)
        .join(' · ')}
      right={<Badge label={t(`conditionStatus.${c.status}`)} bg={tone.bg} fg={tone.fg} />}
      onPress={() => openPetForm(pet, 'condition', c.id)}
    />
  );
}

export function VisitRow({ v, pet }: { v: Visit; pet: Pet }) {
  const { i18n } = useTranslation();
  return (
    <ListItem
      icon={<IconTile name="business-outline" bg={colors.sky} fg={colors.skyInk} />}
      title={v.reason || v.diagnosis || v.clinic || '—'}
      subtitle={v.diagnosis && v.reason ? v.diagnosis : null}
      meta={[
        formatDate(v.visit_date, i18n.language),
        [v.vet_name, v.clinic].filter(Boolean).join(', '),
        v.cost != null ? `৳${formatNumber(v.cost, i18n.language, 0)}` : null,
      ]
        .filter(Boolean)
        .join(' · ')}
      onPress={() => openPetForm(pet, 'visit', v.id)}
    />
  );
}

export function MedicineRow({ m, pet, logs }: { m: Medicine; pet: Pet; logs: DoseLog[] }) {
  const { t, i18n } = useTranslation();
  const prog = courseProgress(m, logs);
  const dueDate = parseISODate(m.next_due);
  const overdue = !!dueDate && dueDate < today() && m.active;

  let meta: string;
  if (isDueDateItem(m)) {
    meta = m.next_due
      ? t('medicine.due', { date: formatDate(m.next_due, i18n.language) })
      : t('frequency.once');
  } else if (prog.total) {
    meta = t('medicine.progress', { given: prog.given, total: prog.total });
  } else {
    meta = [t(`frequency.${m.frequency}`), m.times?.join(', ')].filter(Boolean).join(' · ');
  }

  return (
    <ListItem
      icon={<MedicineIcon kind={m.kind} />}
      title={m.name}
      subtitle={m.dose}
      meta={meta}
      right={
        overdue ? <Badge label={t('schedule.overdue')} bg={colors.dangerSoft} fg={colors.danger} /> : null
      }
      onPress={() => openPetForm(pet, 'medicine', m.id)}
    />
  );
}

export function ReportRow({ r, pet }: { r: Report; pet: Pet }) {
  const { t, i18n } = useTranslation();
  const url = useFileUrl(r.file_path);
  return (
    <ListItem
      icon={<IconTile name={REPORT_ICON[r.kind]} bg={colors.lavender} fg={colors.lavenderInk} />}
      title={r.title}
      subtitle={r.notes}
      meta={`${t(`reportKind.${r.kind}`)} · ${formatDate(r.report_date, i18n.language)}`}
      right={
        url.data ? (
          <Button
            title={t('common.open')}
            small
            variant="light"
            icon="open-outline"
            onPress={() => openFile(url.data!)}
          />
        ) : null
      }
      onPress={() => openPetForm(pet, 'report', r.id)}
    />
  );
}
