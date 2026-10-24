import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Row } from './Layout';
import { T } from './Text';
import { colors, shadow, space } from '@/theme';

export type IonName = ComponentProps<typeof Ionicons>['name'];

/** Round icon button (white with shadow by default). */
export function IconButton({
  icon,
  onPress,
  bg = colors.surface,
  color = colors.ink,
  size = 44,
  label,
}: {
  icon: IonName;
  onPress?: () => void;
  bg?: string;
  color?: string;
  size?: number;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        bg === colors.surface && shadow,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={color} />
    </Pressable>
  );
}

/** Go back, or to Home when there is no history (e.g. after a page reload on web). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Screen header: back button, centred title, optional right-hand action. */
export function Header({
  title,
  right,
  onBack = goBack,
}: {
  title?: string;
  right?: ReactNode;
  onBack?: (() => void) | null;
}) {
  const { t } = useTranslation();
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: space.lg, minHeight: 44 }}>
      {onBack ? (
        <IconButton icon="arrow-back" onPress={onBack} label={t('common.back')} />
      ) : (
        <View style={{ width: 44 }} />
      )}
      {title ? (
        <T
          size={18}
          weight="semibold"
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'center', marginHorizontal: space.sm }}
        >
          {title}
        </T>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </Row>
  );
}
