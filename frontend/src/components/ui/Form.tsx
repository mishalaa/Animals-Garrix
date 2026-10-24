import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Chip } from './Chip';
import { Row } from './Layout';
import { T, useFont } from './Text';
import { toISODate } from '@/lib/dates';
import { colors, radius, space } from '@/theme';

type InputProps = ComponentProps<typeof TextInput>;

const PLACEHOLDER = '#B8ABA5';

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <T size={13} weight="medium" color={colors.muted} style={{ marginBottom: 6, marginLeft: 4 }}>
      {children}
    </T>
  );
}

function FieldError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <T size={12} color={colors.danger} style={{ marginTop: 4, marginLeft: 4 }}>
      {error}
    </T>
  );
}

/** Labelled text input with an optional error message. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  error,
  autoCapitalize,
  secureTextEntry,
  autoComplete,
}: {
  label?: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: InputProps['keyboardType'];
  error?: string | null;
  autoCapitalize?: InputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  autoComplete?: InputProps['autoComplete'];
}) {
  const font = useFont();
  return (
    <View style={{ marginBottom: space.lg }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        style={[
          styles.input,
          { fontFamily: font('regular') },
          multiline && styles.multiline,
          error ? { borderColor: colors.danger } : null,
        ]}
      />
      <FieldError error={error} />
    </View>
  );
}

/** Date typed as YYYY-MM-DD with a quick "Today" button. Works the same on web and mobile. */
export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  error?: string | null;
}) {
  const { t } = useTranslation();
  const font = useFont();
  return (
    <View style={{ marginBottom: space.lg }}>
      <FieldLabel>{label}</FieldLabel>
      <Row>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={PLACEHOLDER}
          keyboardType={Platform.OS === 'web' ? 'default' : 'numbers-and-punctuation'}
          maxLength={10}
          style={[
            styles.input,
            { flex: 1, minWidth: 0, width: '100%', fontFamily: font('regular') },
            error ? { borderColor: colors.danger } : null,
          ]}
        />
        <Chip label={t('common.today')} onPress={() => onChange(toISODate(new Date()))} />
      </Row>
      <FieldError error={error} />
    </View>
  );
}

/** On/off row with a label. */
export function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row style={[styles.input, { justifyContent: 'space-between', marginBottom: space.lg }]}>
      <T size={15} style={{ flex: 1 }}>
        {label}
      </T>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: '#E5D9D3' }}
        thumbColor={colors.white}
        {...(Platform.OS === 'web' ? ({ activeThumbColor: colors.white } as object) : {})}
      />
    </Row>
  );
}

/** Titled group of form fields. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: space.md }}>
      <T size={17} weight="semibold" style={{ marginBottom: space.md }}>
        {title}
      </T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    minHeight: 52,
    fontSize: 15,
    color: colors.ink,
  },
  multiline: {
    minHeight: 96,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
});
