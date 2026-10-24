import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from './Text';
import { colors, MAX_WIDTH, radius, shadow, space } from '@/theme';

/** Scrolling screen with safe areas and a max width so the web app reads like a phone app. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  bottomSpace = 32,
  bg = colors.bg,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bottomSpace?: number;
  bg?: string;
}) {
  const insets = useSafeAreaInsets();
  const inner = (
    <View
      style={[
        styles.inner,
        padded && { paddingHorizontal: space.lg },
        { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + bottomSpace },
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

/** Horizontal row with centred items. */
export function Row({
  children,
  gap = space.sm,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** White rounded card, pressable when onPress is given. */
export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Section heading with an optional action link on the right ("Add", "See all"). */
export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md }}>
      <T size={18} weight="semibold">
        {title}
      </T>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <T size={13} weight="medium" color={colors.primaryDark}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </Row>
  );
}

const styles = StyleSheet.create({
  inner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
});

