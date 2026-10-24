import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { Button } from './Button';
import type { IonName } from './Header';
import { T } from './Text';
import { colors, radius, space } from '@/theme';

/** Small coloured status label. */
export function Badge({
  label,
  bg = colors.primarySoft,
  fg = colors.primaryDark,
}: {
  label: string;
  bg?: string;
  fg?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <T size={12} weight="medium" color={fg}>
        {label}
      </T>
    </View>
  );
}

/** Placeholder shown when a list has nothing in it yet. */
export function EmptyState({
  icon = 'paw-outline',
  title,
  body,
  action,
  onAction,
}: {
  icon?: IonName;
  title?: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        padding: space.xl,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        gap: space.sm,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.peachSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      {title ? (
        <T size={16} weight="semibold" center>
          {title}
        </T>
      ) : null}
      <T size={14} color={colors.muted} center>
        {body}
      </T>
      {action && onAction ? (
        <Button title={action} onPress={onAction} small icon="add" style={{ marginTop: space.sm }} />
      ) : null}
    </View>
  );
}

/** Full-screen spinner. */
export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

/** A labelled line of detail text; renders nothing when the value is empty. */
export function Detail({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={{ marginTop: 6 }}>
      <T size={12} color={colors.muted}>
        {label}
      </T>
      <T size={14}>{String(value)}</T>
    </View>
  );
}
