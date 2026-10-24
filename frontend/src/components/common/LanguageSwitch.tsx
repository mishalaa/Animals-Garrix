import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import { setLanguage, type Lang } from '@/i18n';
import { colors, radius } from '@/theme';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'bn', label: 'বাংলা' },
];

/** Segmented EN / বাংলা switch. */
export function LanguageSwitch({ onDark, onChange }: { onDark?: boolean; onChange?: (l: Lang) => void }) {
  const { i18n } = useTranslation();
  const current = i18n.language === 'bn' ? 'bn' : 'en';
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 4,
        borderRadius: radius.pill,
        backgroundColor: onDark ? '#FFFFFF33' : colors.peachSoft,
      }}
    >
      {OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              setLanguage(o.value);
              onChange?.(o.value);
            }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: active ? (onDark ? colors.white : colors.ink) : 'transparent',
            }}
          >
            <T
              size={13}
              weight="semibold"
              color={
                active ? (onDark ? colors.primaryDark : colors.white) : onDark ? colors.white : colors.ink
              }
            >
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
