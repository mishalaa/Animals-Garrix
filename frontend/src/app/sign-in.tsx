import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Card, Field, Header, Screen, T } from '@/components/ui';
import { api } from '@/services';
import { useAuth } from '@/providers/AuthProvider';
import { colors, space } from '@/theme';

export default function SignIn() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (ready && user) return <Redirect href="/" />;

  const submit = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim() || password.length < 6) {
      setError(t('common.required', { field: !email.trim() ? t('auth.email') : t('auth.password') }));
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await api.signIn(email.trim(), password);
      } else {
        const res = await api.signUp(name.trim(), email.trim(), password);
        if (res.needsConfirmation) {
          setMessage(t('auth.checkEmail'));
          setMode('signin');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'signin' ? t('auth.signIn') : t('auth.signUp');

  return (
    <Screen>
      <Header />
      <T size={28} weight="bold" style={{ marginBottom: space.xl }}>
        {title}
      </T>
      <Card>
        {mode === 'signup' ? (
          <Field label={t('auth.name')} value={name} onChangeText={setName} autoComplete="name" />
        ) : null}
        <Field
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />
        {error ? (
          <T size={13} color={colors.danger} style={{ marginBottom: space.md }}>
            {error}
          </T>
        ) : null}
        {message ? (
          <T size={13} color={colors.mintInk} style={{ marginBottom: space.md }}>
            {message}
          </T>
        ) : null}
        <Button title={title} onPress={submit} loading={busy} />
      </Card>
      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} hitSlop={8}>
          <T size={14} weight="medium" color={colors.primaryDark}>
            {mode === 'signin' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}
