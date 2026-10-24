import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FormScreen, orNull, useFormParams, useRecordForm } from '@/components/forms/RecordForm';
import { Button, ChipGroup, DateField, Field, FieldLabel, Loading, Row, T } from '@/components/ui';
import { api } from '@/services';
import { useFileUrl, useRecords } from '@/hooks/queries';
import { formatDate, isValidISODate, toISODate } from '@/lib/dates';
import { notify, openFile, pickDocument, pickImage } from '@/lib/platform';
import { colors, radius, space } from '@/theme';
import type { PickedFile, ReportKind } from '@/types';

const KINDS: ReportKind[] = ['lab', 'xray', 'prescription', 'vaccine_card', 'invoice', 'other'];

export default function ReportForm() {
  const { t, i18n } = useTranslation();
  const params = useFormParams();
  const f = useRecordForm('reports');
  const visits = useRecords('visits', f.petId);
  const conditions = useRecords('conditions', f.petId);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ReportKind>('lab');
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState('');
  const [visitId, setVisitId] = useState<string | null>(params.visitId ?? null);
  const [conditionId, setConditionId] = useState<string | null>(params.conditionId ?? null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const existingUrl = useFileUrl(f.existing?.file_path);

  useEffect(() => {
    const e = f.existing;
    if (!e) return;
    setTitle(e.title);
    setKind(e.kind);
    setDate(e.report_date);
    setNotes(e.notes ?? '');
    setVisitId(e.visit_id);
    setConditionId(e.condition_id);
  }, [f.existing]);

  if (f.loading) return <Loading />;

  const save = async () => {
    const err: Record<string, string> = {};
    if (!title.trim()) err.title = t('common.required', { field: t('report.title') });
    if (!isValidISODate(date)) err.date = t('common.invalidDate');
    setErrors(err);
    if (Object.keys(err).length) return;

    let file_path = f.existing?.file_path ?? null;
    let mime_type = f.existing?.mime_type ?? null;
    if (file) {
      try {
        setUploading(true);
        file_path = await api.uploadFile(f.petId, file);
        mime_type = file.mimeType;
      } catch (e) {
        notify(e instanceof Error ? e.message : t('common.error'));
        return;
      } finally {
        setUploading(false);
      }
    }
    f.submit({
      title: title.trim(),
      kind,
      report_date: date,
      notes: orNull(notes),
      visit_id: visitId,
      condition_id: conditionId,
      file_path,
      mime_type,
    });
  };

  const choose = async (picker: () => Promise<PickedFile | null>) => {
    const picked = await picker();
    if (!picked) return;
    setFile(picked);
    if (!title.trim()) setTitle(picked.name.replace(/\.[^.]+$/, ''));
  };

  return (
    <FormScreen
      title={f.itemId ? t('report.editTitle') : t('report.newTitle')}
      onSave={save}
      onDelete={f.itemId ? f.destroy : undefined}
      saving={f.saving || uploading}
    >
      {/* File */}
      <View style={{ marginBottom: space.lg }}>
        <FieldLabel>{t('report.file')}</FieldLabel>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderStyle: 'dashed',
            padding: space.lg,
            gap: space.md,
          }}
        >
          <Row gap={space.sm}>
            <Ionicons
              name={file || f.existing?.file_path ? 'document-attach' : 'cloud-upload-outline'}
              size={22}
              color={colors.primary}
            />
            <T size={14} style={{ flex: 1 }} numberOfLines={1}>
              {file
                ? t('report.attached', { name: file.name })
                : f.existing?.file_path
                  ? t('report.attached', { name: f.existing.title })
                  : t('report.noFile')}
            </T>
          </Row>
          <Row gap={space.sm}>
            <Button
              title={t('report.pickPhoto')}
              icon="image-outline"
              variant="light"
              small
              style={{ flex: 1 }}
              onPress={() => choose(pickImage)}
            />
            <Button
              title={t('report.pickFile')}
              icon="document-outline"
              variant="light"
              small
              style={{ flex: 1 }}
              onPress={() => choose(pickDocument)}
            />
          </Row>
          {!file && existingUrl.data ? (
            <Button
              title={t('report.openFile')}
              icon="open-outline"
              variant="ghost"
              small
              onPress={() => openFile(existingUrl.data!)}
            />
          ) : null}
          <T size={12} color={colors.muted}>
            {t('report.scanSoon')}
          </T>
        </View>
      </View>

      <Field
        label={t('report.title')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('report.titleHint')}
        error={errors.title}
      />
      <ChipGroup
        label={t('report.kind')}
        options={KINDS.map((v) => ({ value: v, label: t(`reportKind.${v}`) }))}
        value={kind}
        onChange={(v) => v && setKind(v)}
      />
      <DateField label={t('report.date')} value={date} onChange={setDate} error={errors.date} />

      {visits.data?.length ? (
        <ChipGroup
          label={t('report.visit')}
          options={[...visits.data]
            .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
            .slice(0, 6)
            .map((v) => ({
              value: v.id,
              label: `${formatDate(v.visit_date, i18n.language)}${v.reason ? ` · ${v.reason}` : ''}`,
            }))}
          value={visitId}
          onChange={setVisitId}
          allowEmpty
        />
      ) : null}
      {conditions.data?.length ? (
        <ChipGroup
          label={t('report.condition')}
          options={conditions.data.map((c) => ({ value: c.id, label: c.name }))}
          value={conditionId}
          onChange={setConditionId}
          allowEmpty
        />
      ) : null}
      <Field label={t('report.notes')} value={notes} onChangeText={setNotes} multiline />
    </FormScreen>
  );
}
