import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { colors } from '@/theme';

/** Poppins for English, Hind Siliguri for Bangla. */
export type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

const FONTS: Record<'en' | 'bn', Record<Weight, string>> = {
  en: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  bn: {
    regular: 'HindSiliguri_400Regular',
    medium: 'HindSiliguri_500Medium',
    semibold: 'HindSiliguri_600SemiBold',
    bold: 'HindSiliguri_700Bold',
  },
};

/** Returns a function giving the font family for a weight in the current language. */
export function useFont() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'bn' ? 'bn' : 'en';
  return (weight: Weight = 'regular') => FONTS[lang][weight];
}

interface TProps {
  children: ReactNode;
  size?: number;
  weight?: Weight;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  center?: boolean;
}

/** App text. Always use this instead of <Text> so fonts follow the language. */
export function T({
  children,
  size = 15,
  weight = 'regular',
  color = colors.ink,
  style,
  numberOfLines,
  center,
}: TProps) {
  const font = useFont();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: font(weight), fontSize: size, color, lineHeight: Math.round(size * 1.45) },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
