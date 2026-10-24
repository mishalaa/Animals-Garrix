import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FieldLabel } from './Form';
import { T } from './Text';
import { colors, radius, space } from '@/theme';

/** Pill filter chip; dark when selected (as in the design references). */
export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && { opacity: 0.8 }]}
    >
      {icon}
      <T size={14} weight="medium" color={selected ? colors.white : colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

/** Single-choice group of chips. With allowEmpty, tapping the selected chip clears it. */
export function ChipGroup<V extends string>({
  options,
  value,
  onChange,
  label,
  allowEmpty,
}: {
  options: { value: V; label: string }[];
  value: V | null | undefined;
  onChange: (v: V | null) => void;
  label?: string;
  allowEmpty?: boolean;
}) {
  return (
    <View style={{ marginBottom: space.lg }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={value === o.value}
            onPress={() => onChange(allowEmpty && value === o.value ? null : o.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
});
