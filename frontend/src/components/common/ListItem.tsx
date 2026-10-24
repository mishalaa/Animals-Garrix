import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import { colors, radius, shadow, space } from '@/theme';

export function ListItem({
  icon,
  title,
  subtitle,
  meta,
  right,
  onPress,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
        },
        shadow,
        pressed && { opacity: 0.85 },
      ]}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <T size={15} weight="semibold" numberOfLines={2}>
          {title}
        </T>
        {subtitle ? (
          <T size={13} color={colors.inkSoft} numberOfLines={2}>
            {subtitle}
          </T>
        ) : null}
        {meta ? (
          <T size={12} color={colors.muted} numberOfLines={1}>
            {meta}
          </T>
        ) : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={18} color="#C9BCB6" /> : null}
    </Pressable>
  );
}

export function IconTile({
  name,
  bg,
  fg,
  size = 44,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  bg: string;
  fg: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size * 0.48} color={fg} />
    </View>
  );
}
