import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { IonName } from './Header';
import { Row } from './Layout';
import { T } from './Text';
import { colors, radius, space } from '@/theme';

type ButtonVariant = 'primary' | 'dark' | 'light' | 'ghost' | 'danger';

const PALETTE: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.white },
  dark: { bg: colors.ink, fg: colors.white },
  light: { bg: colors.surface, fg: colors.ink, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.primaryDark },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

/** Pill button. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IonName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const p = PALETTE[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.small,
        { backgroundColor: p.bg, borderColor: p.border ?? 'transparent' },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <Row gap={space.sm}>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={p.fg} /> : null}
          <T size={small ? 14 : 16} weight="semibold" color={p.fg}>
            {title}
          </T>
        </Row>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  small: {
    height: 40,
    paddingHorizontal: space.lg,
  },
});
