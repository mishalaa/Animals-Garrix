import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services';
import { LanguageSwitch } from '@/components/common/LanguageSwitch';
import { colors, space } from '@/theme';

export default function Welcome() {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  if (ready && user) return <Redirect href="/" />;

  const demo = api.mode === 'demo';

  return (
    <Screen bg={colors.primary}>
      <View style={{ alignItems: 'flex-end' }}>
        <LanguageSwitch onDark />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: space.xl }}>
        <Illustration />
        <T size={30} weight="bold" color={colors.white} center style={{ marginTop: space.xxl }}>
          {t('welcome.title')}
        </T>
        <T size={15} color="#FFE9E3" center style={{ marginTop: space.md, maxWidth: 340 }}>
          {t('welcome.subtitle')}
        </T>
      </View>

      <View style={{ gap: space.md }}>
        {demo ? (
          <>
            <Button title={t('welcome.tryDemo')} variant="light" onPress={() => api.signIn('', '')} />
            <T size={12} color="#FFE9E3" center>
              {t('welcome.demoNote')}
            </T>
          </>
        ) : (
          <>
            <Button
              title={t('welcome.start')}
              variant="light"
              onPress={() => router.push('/sign-in?mode=signup')}
            />
            <Button
              title={t('welcome.haveAccount')}
              variant="ghost"
              onPress={() => router.push('/sign-in')}
              style={{ borderColor: '#FFFFFF66' }}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

/** Cat and dog peeking out of a box, built from icons (reference 1's cardboard-box scene). */
function Illustration() {
  return (
    <View style={{ width: 240, height: 220, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: 220,
          height: 24,
          borderRadius: 110,
          backgroundColor: '#00000018',
        }}
      />
      <View style={{ flexDirection: 'row', marginBottom: -26, zIndex: 1 }}>
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: colors.butter,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: -18,
          }}
        >
          <MaterialCommunityIcons name="dog" size={70} color={colors.butterInk} />
        </View>
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="cat" size={70} color={colors.primaryDark} />
        </View>
      </View>
      <View
        style={{
          width: 200,
          height: 92,
          backgroundColor: '#F5B07A',
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            width: 200,
            height: 18,
            backgroundColor: '#E99A5E',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
          }}
        />
        <MaterialCommunityIcons name="heart-pulse" size={34} color={colors.white} />
      </View>
    </View>
  );
}
