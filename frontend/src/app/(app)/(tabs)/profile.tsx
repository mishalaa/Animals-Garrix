import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { LanguageSwitch } from '@/components/common/LanguageSwitch';
import { useAgeLabel } from '@/components/pet/PetCard';
import { Button, Card, PetImage, Row, Screen, SectionTitle, T } from '@/components/ui';
import { api } from '@/services';
import { keys, usePets, useProfile } from '@/hooks/queries';
import { colors, radius, shadow, space } from '@/theme';

export default function Profile() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const profile = useProfile();
  const pets = usePets();
  const age = useAgeLabel();
  const p = profile.data;

  return (
    <Screen bottomSpace={140}>
      <T size={26} weight="bold" style={{ marginBottom: space.lg }}>
        {t('profile.title')}
      </T>

      {/* User pill card */}
      <Row
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            padding: 8,
            paddingRight: space.xl,
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadow,
        ]}
        gap={space.md}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.peach,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T size={22} weight="bold" color={colors.primaryDark}>
            {(p?.full_name || 'P').charAt(0).toUpperCase()}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T size={16} weight="bold" numberOfLines={1}>
            {p?.full_name || '—'}
          </T>
          <T size={13} color={colors.muted} numberOfLines={1}>
            {p?.email ?? ''}
          </T>
        </View>
      </Row>

      {/* Pets row */}
      <SectionTitle
        title={t('home.yourPets')}
        action={t('profile.pets', { count: pets.data?.length ?? 0 })}
        onAction={() => router.push('/')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: space.md, paddingBottom: space.sm }}
      >
        {(pets.data ?? []).map((pet, i) => {
          const dark = i === 0;
          return (
            <Pressable
              key={pet.id}
              onPress={() => router.push(`/pet/${pet.id}`)}
              style={[
                {
                  width: 154,
                  borderRadius: radius.xl,
                  padding: space.md,
                  backgroundColor: dark ? colors.ink : colors.surface,
                  borderWidth: 1,
                  borderColor: dark ? colors.ink : colors.border,
                },
                shadow,
              ]}
            >
              <PetImage pet={pet} size={54} rounded={27} />
              <T
                size={16}
                weight="bold"
                color={dark ? colors.white : colors.ink}
                style={{ marginTop: space.md }}
                numberOfLines={1}
              >
                {pet.name}
              </T>
              <T size={12} color={dark ? '#A2ACB7' : colors.muted} numberOfLines={1}>
                {pet.breed || t(`species.${pet.species}`)} · {age(pet.birth_date)}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionTitle title={t('profile.language')} />
      <Row>
        <LanguageSwitch onChange={(lang) => api.updateProfile({ language: lang }).catch(() => {})} />
      </Row>

      <SectionTitle title={t('profile.dataMode')} />
      <Card>
        <Row gap={space.md}>
          <Ionicons
            name={api.mode === 'demo' ? 'phone-portrait-outline' : 'cloud-done-outline'}
            size={22}
            color={colors.primary}
          />
          <T size={14} style={{ flex: 1 }}>
            {api.mode === 'demo' ? t('profile.demoMode') : t('profile.cloudMode')}
          </T>
        </Row>
        {api.mode === 'demo' && api.resetDemo ? (
          <Button
            title={t('profile.resetDemo')}
            variant="light"
            small
            icon="refresh"
            style={{ marginTop: space.md }}
            onPress={async () => {
              await api.resetDemo?.();
              qc.invalidateQueries();
              qc.invalidateQueries({ queryKey: keys.pets });
            }}
          />
        ) : null}
      </Card>

      <Button
        title={t('profile.signOut')}
        variant="danger"
        icon="log-out-outline"
        style={{ marginTop: space.xl }}
        onPress={() => api.signOut()}
      />
      <T size={12} color={colors.muted} center style={{ marginTop: space.lg, marginBottom: space.lg }}>
        {t('profile.about')}
      </T>
    </Screen>
  );
}
