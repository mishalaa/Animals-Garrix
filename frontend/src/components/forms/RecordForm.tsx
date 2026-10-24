import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Header, Screen } from '@/components/ui';
import { useRecords, useRemoveRecord, useSaveRecord } from '@/hooks/queries';
import { confirm, notify } from '@/lib/platform';
import { space } from '@/theme';
import type { PetTable, PetTables } from '@/types';

/** Route params for every record form: /pet/[id]/<form>?itemId=… */
export function useFormParams() {
  const p = useLocalSearchParams<{ id: string; itemId?: string; visitId?: string; conditionId?: string }>();
  return { petId: p.id, itemId: p.itemId || undefined, visitId: p.visitId, conditionId: p.conditionId };
}

/** Loads the record being edited (if any) and provides save/delete helpers. */
export function useRecordForm<T extends PetTable>(table: T) {
  const { t } = useTranslation();
  const { petId, itemId } = useFormParams();
  const rows = useRecords(table, petId);
  const save = useSaveRecord(table);
  const remove = useRemoveRecord(table);
  const existing = itemId
    ? (rows.data as PetTables[T][] | undefined)?.find((r) => r.id === itemId)
    : undefined;

  return {
    petId,
    itemId,
    existing,
    loading: rows.isLoading,
    saving: save.isPending,
    /** Save, run `after`, then go back, or to the route `after` returns. */
    async submit(
      row: Partial<PetTables[T]>,
      after?: (saved: PetTables[T]) => Promise<string | void> | string | void,
    ) {
      try {
        const saved = await save.mutateAsync({
          id: itemId,
          row: { ...row, pet_id: petId } as Partial<PetTables[T]> & { pet_id: string },
        });
        const next = await after?.(saved as PetTables[T]);
        if (next) router.replace(next as never);
        else router.back();
      } catch (e) {
        notify(e instanceof Error ? e.message : t('common.error'));
      }
    },
    async destroy() {
      if (!itemId) return;
      if (await confirm(t('common.confirmDelete'), t('common.delete'), t('common.cancel'))) {
        await remove.mutateAsync(itemId);
        router.back();
      }
    },
  };
}

export function FormScreen({
  title,
  children,
  onSave,
  onDelete,
  saving,
}: {
  title: string;
  children: ReactNode;
  onSave: () => void;
  onDelete?: () => void;
  saving?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Header title={title} />
      {children}
      <View style={{ gap: space.md, marginTop: space.sm }}>
        <Button title={t('common.save')} onPress={onSave} loading={saving} />
        {onDelete ? (
          <Button title={t('common.delete')} variant="danger" icon="trash-outline" onPress={onDelete} />
        ) : null}
      </View>
    </Screen>
  );
}

export const orNull = (v: string) => (v.trim() ? v.trim() : null);
