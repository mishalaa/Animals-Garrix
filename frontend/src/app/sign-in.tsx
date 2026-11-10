import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { api } from '@/services';
import { useAuth } from '@/providers/AuthProvider';

const CREAM = '#FAF5EC';
const CARD_BG = '#FFFFFF';
const INK = '#1C1917';
const INK_SOFT = '#78716C';
const AMBER = '#E07A2B';
const AMBER_DARK = '#B85814';
const AMBER_SOFT = '#FCEBD9';
const BORDER = '#EDE0C0';

export default function SignIn() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { user, ready } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const tabAnim = useRef(new Animated.Value(mode === 'signin' ? 0 : 1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError(null);
    setMessage(null);
    Animated.spring(tabAnim, {
      toValue: newMode === 'signin' ? 0 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  };

  if (ready && user) return <Redirect href="/" />;

  const submit = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim() || password.length < 6) {
      setError(
        !email.trim()
          ? t('common.required', { field: t('auth.email') })
          : t('common.required', { field: t('auth.password') }) + ' (min 6 chars)'
      );
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
          switchMode('signin');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.96, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: CREAM }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Top Header & Pet Badge */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/welcome')}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={20} color={INK} />
            </Pressable>

            <View style={styles.badgeCircle}>
              <MaterialCommunityIcons name="paw" size={32} color={AMBER} />
            </View>

            <T
              size={26}
              weight="bold"
              color={INK}
              center
              style={{
                fontFamily: Platform.select({
                  ios: 'Georgia',
                  android: 'serif',
                  default: 'Georgia, serif',
                }),
                marginTop: 14,
              }}
            >
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </T>
            <T size={14} color={INK_SOFT} center style={{ marginTop: 4 }}>
              {mode === 'signin'
                ? 'Sign in to access your pets’ health passports'
                : 'Join PetPassport to track doses, visits & care'}
            </T>
          </View>

          {/* Mode Switcher Pill */}
          <View style={styles.tabTrack}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  left: tabAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['2%', '50%'],
                  }),
                },
              ]}
            />
            <Pressable
              style={styles.tabBtn}
              onPress={() => switchMode('signin')}
            >
              <T
                size={14}
                weight={mode === 'signin' ? 'bold' : 'medium'}
                color={mode === 'signin' ? INK : INK_SOFT}
              >
                Sign In
              </T>
            </Pressable>
            <Pressable
              style={styles.tabBtn}
              onPress={() => switchMode('signup')}
            >
              <T
                size={14}
                weight={mode === 'signup' ? 'bold' : 'medium'}
                color={mode === 'signup' ? INK : INK_SOFT}
              >
                Create Account
              </T>
            </Pressable>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Full Name field (signup only) */}
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <T size={12} weight="semibold" color={INK_SOFT} style={styles.label}>
                  YOUR NAME
                </T>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={INK_SOFT} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex Rivera"
                    placeholderTextColor="#A8A29E"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>
              </View>
            )}

            {/* Email field */}
            <View style={styles.fieldGroup}>
              <T size={12} weight="semibold" color={INK_SOFT} style={styles.label}>
                EMAIL ADDRESS
              </T>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={INK_SOFT} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#A8A29E"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <T size={12} weight="semibold" color={INK_SOFT} style={styles.label}>
                PASSWORD
              </T>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={INK_SOFT} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#A8A29E"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={INK_SOFT}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#B33A24" />
                <T size={13} color="#B33A24" style={{ flex: 1 }}>
                  {error}
                </T>
              </View>
            ) : null}

            {/* Success message banner */}
            {message ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#0E7A4A" />
                <T size={13} color="#0E7A4A" style={{ flex: 1 }}>
                  {message}
                </T>
              </View>
            ) : null}

            {/* Primary Action Button */}
            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 6 }}>
              <Pressable
                onPress={submit}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={busy}
                style={[styles.submitBtn, busy && { opacity: 0.8 }]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <T size={16} weight="bold" color="#fff">
                    {mode === 'signin' ? 'Sign In →' : 'Create Free Account →'}
                  </T>
                )}
              </Pressable>
            </Animated.View>
          </View>

          {/* Quick Demo Switcher */}
          <View style={styles.demoSection}>
            <Pressable
              onPress={() => api.signIn('', '')}
              style={({ pressed }) => [styles.demoBtn, pressed && { opacity: 0.75 }]}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={AMBER_DARK} />
              <T size={13} weight="semibold" color={AMBER_DARK}>
                Explore Instant Demo Mode
              </T>
            </Pressable>
            <T size={11} color={INK_SOFT} center style={{ marginTop: 6 }}>
              Instant access with preloaded pets & health records
            </T>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: AMBER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: AMBER,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // Tab track
  tabTrack: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#EFE7D8',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    position: 'relative',
    height: 48,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 3,
    shadowColor: '#2C1810',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    letterSpacing: 0.5,
    fontSize: 11,
    marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DEC8',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: INK,
    height: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F5BFBB',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A3E5C5',
  },

  // Submit button
  submitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: AMBER,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Demo section
  demoSection: {
    marginTop: 22,
    alignItems: 'center',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AMBER_SOFT,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5CEAC',
  },
});

