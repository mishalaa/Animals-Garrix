import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { T } from './Text';
import { useFileUrl } from '@/hooks/queries';
import { colors, pastelFor, radius } from '@/theme';
import type { Pet, Species } from '@/types';

const SPECIES_ICON: Record<Species, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  cat: 'cat',
  dog: 'dog',
  bird: 'bird',
  rabbit: 'rabbit',
  other: 'paw',
};

export function SpeciesIcon({
  species,
  size = 22,
  color = colors.ink,
}: {
  species: Species;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={SPECIES_ICON[species] ?? 'paw'} size={size} color={color} />;
}

/** Pet photo if there is one, otherwise a pastel tile with the species icon. */
export function PetImage({
  pet,
  size,
  rounded = radius.lg,
  style,
}: {
  pet: Pick<Pet, 'id' | 'species' | 'photo_path'>;
  size: number | '100%';
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const url = useFileUrl(pet.photo_path);
  const tone = pastelFor(pet.id);
  const dim =
    typeof size === 'number' ? { width: size, height: size } : { width: '100%' as const, aspectRatio: 1 };
  const iconSize = typeof size === 'number' ? size * 0.5 : 64;

  return (
    <View
      style={[
        dim,
        {
          borderRadius: rounded,
          backgroundColor: tone.bg,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {url.data ? (
        <Image source={{ uri: url.data }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <SpeciesIcon species={pet.species} size={iconSize} color={tone.fg} />
      )}
    </View>
  );
}

/** Coloured stat tile (Age / Sex / Weight). */
export function StatTile({ value, label, bg, fg }: { value: string; label: string; bg: string; fg: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: radius.md,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <T size={16} weight="bold" color={colors.ink} numberOfLines={1}>
        {value}
      </T>
      <T size={12} weight="medium" color={fg} style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}
