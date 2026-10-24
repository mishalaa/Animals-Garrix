import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { Chip, FieldLabel, Row, T, useFont } from '@/components/ui';
import { BREEDS, breedRisks } from '@/constants/breeds';
import { colors, radius, space } from '@/theme';
import type { Species } from '@/types';

/** Searchable breed list for the chosen species, with a free-text fallback and health watch-points. */
export function BreedPicker({
  species,
  value,
  onChange,
}: {
  species: Species;
  value: string;
  onChange: (b: string) => void;
}) {
  const { t } = useTranslation();
  const font = useFont();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = BREEDS[species] ?? [];
  const filtered = list.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase()));
  const risks = breedRisks(species, value);

  return (
    <View style={{ marginBottom: space.lg }}>
      <FieldLabel>{t('petForm.breed')}</FieldLabel>
      <Pressable
        onPress={() => setOpen(!open)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: open ? colors.primary : colors.border,
          minHeight: 52,
          paddingHorizontal: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <T size={15} color={value ? colors.ink : '#B8ABA5'}>
          {value || t('petForm.chooseBreed')}
        </T>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>

      {open ? (
        <View
          style={{
            marginTop: space.sm,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: space.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Row
            style={{
              backgroundColor: colors.peachSoft,
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              height: 42,
              marginBottom: space.md,
            }}
          >
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('petForm.searchBreed')}
              placeholderTextColor="#B8ABA5"
              style={{
                flex: 1,
                fontFamily: font('regular'),
                fontSize: 14,
                color: colors.ink,
                height: '100%',
              }}
            />
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {filtered.map((b) => (
              <Chip
                key={b.name}
                label={b.name}
                selected={value === b.name}
                onPress={() => {
                  onChange(b.name);
                  setOpen(false);
                  setQ('');
                }}
              />
            ))}
            {q.trim() && !list.some((b) => b.name.toLowerCase() === q.trim().toLowerCase()) ? (
              <Chip
                label={t('petForm.customBreed', { name: q.trim() })}
                onPress={() => {
                  onChange(q.trim());
                  setOpen(false);
                  setQ('');
                }}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {risks.length ? <BreedWatch risks={risks} /> : null}
    </View>
  );
}

export function BreedWatch({ risks }: { risks: string[] }) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        marginTop: space.sm,
        backgroundColor: colors.butter,
        borderRadius: radius.md,
        padding: space.md,
      }}
    >
      <Row gap={6}>
        <Ionicons name="information-circle" size={18} color={colors.butterInk} />
        <T size={13} weight="semibold" color={colors.butterInk}>
          {t('pet.breedWatch')}
        </T>
      </Row>
      {risks.map((r) => (
        <T key={r} size={13} style={{ marginTop: 2 }}>
          • {r}
        </T>
      ))}
      <T size={11} color={colors.butterInk} style={{ marginTop: 4 }}>
        {t('pet.breedWatchNote')}
      </T>
    </View>
  );
}
