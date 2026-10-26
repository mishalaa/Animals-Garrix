/**
 * Home / dashboard screen.
 *
 * Inspired by reference screen 2:
 *  • Warm cream background
 *  • "Hi [Name], Let's take care of your pets" greeting
 *  • Quick-action category pills: Health · Consult · Grooming · Nutrition · Playdate
 *  • Pet cards: photo circle + name + age under the image
 *  • Due-today reminder banner at the top
 *
 * Animations:
 *  • Staggered section fade+slide on mount
 *  • Pet cards spring in from below with index stagger
 *  • Reminder banner pulses its badge softly
 *  • Category pill scale bounce on press
 *  • Greeting avatar gentle scale-breath loop
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetImage, T, Loading, EmptyState, useFont } from '@/components/ui';
import { usePets, useProfile, useRecords } from '@/hooks/queries';
import { buildAgenda } from '@/lib/schedule';
import { ageParts } from '@/lib/dates';
import { shadow, shadowLg } from '@/theme';
import type { Pet } from '@/types';

// Warm palette
const CREAM = '#F5EDD8';
const AMBER = '#E8793A';
const AMBER_DARK = '#C45E20';
const AMBER_SOFT = '#FAD9B8';
const INK = '#2C1E0F';
const INK_SOFT = '#7A6245';
const CARD_BG = '#FFFDF8';

// Quick category actions
const CATEGORIES = [
  { label: 'Health', icon: 'heart-pulse' as const, bg: '#F8D4CC', fg: '#B33A24' },
  { label: 'Consult', icon: 'stethoscope' as const, bg: '#D4E8D4', fg: '#1A6030' },
  { label: 'Grooming', icon: 'scissors-cutting' as const, bg: '#D4D8F0', fg: '#2B3490' },
  { label: 'Nutrition', icon: 'food-apple' as const, bg: '#F0E8C8', fg: '#7A5800' },
  { label: 'Playdate', icon: 'tennis-ball' as const, bg: '#E8D4F0', fg: '#5C2080' },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function AgeLabel({ birth }: { birth: string | null }) {
  const { t } = useTranslation();
  const a = ageParts(birth);
  if (!a) return <T size={11} color={INK_SOFT}>{t('common.unknown')}</T>;
  const label =
    a.years === 0
      ? t('pet.months', { count: a.months })
      : t('pet.years', { count: a.years });
  return (
    <T size={11} color={INK_SOFT}>
      {label}
    </T>
  );
}

// ── Animated pet card (spring entrance + press shrink) ────────────────────────

function PetCard({ pet, index }: { pet: Pet; index: number }) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      friction: 14,
      tension: 55,
      delay: 80 + index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.94, friction: 8, tension: 120, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          { scale: Animated.multiply(pressAnim, enterAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] })) },
          { translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
        ],
      }}
    >
      <Pressable
        onPress={() => router.push(`/pet/${pet.id}`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.petCard}
      >
        <View style={styles.petAvatarWrap}>
          <PetImage pet={pet} size={96} rounded={48} />
        </View>
        <View style={styles.petCardBody}>
          <T size={14} weight="bold" color={INK} numberOfLines={1}>
            {pet.name}
          </T>
          <AgeLabel birth={pet.birth_date} />
          {pet.breed ? (
            <T size={10} color={INK_SOFT} numberOfLines={1} style={{ marginTop: 1 }}>
              {pet.breed}
            </T>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Animated category pill ────────────────────────────────────────────────────

function CategoryPill({
  label,
  icon,
  bg,
  fg,
  index,
}: {
  label: string;
  icon: string;
  bg: string;
  fg: string;
  index: number;
}) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      friction: 12,
      tension: 60,
      delay: 200 + index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.9, friction: 6, tension: 150, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, friction: 6, tension: 150, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          { scale: Animated.multiply(pressAnim, enterAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] })) },
        ],
      }}
    >
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.categoryPill, { backgroundColor: bg }]}
      >
        <View style={[styles.categoryIcon, { backgroundColor: fg + '22' }]}>
          <MaterialCommunityIcons name={icon as any} size={18} color={fg} />
        </View>
        <T size={12} weight="semibold" color={fg}>
          {label}
        </T>
      </Pressable>
    </Animated.View>
  );
}

// ── Animated section wrapper ──────────────────────────────────────────────────

function FadeSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { t } = useTranslation();
  const font = useFont();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const pets = usePets();
  const meds = useRecords('medicines');
  const logs = useRecords('dose_logs');

  const [query, setQuery] = useState('');

  // Reminder badge pulse loop
  const badgePulse = useRef(new Animated.Value(1)).current;
  // Avatar gentle breath
  const avatarBreath = useRef(new Animated.Value(1)).current;

  const agenda = useMemo(
    () => buildAgenda(meds.data ?? [], logs.data ?? [], pets.data ?? []),
    [meds.data, logs.data, pets.data],
  );
  const pendingToday = agenda.today.filter((d) => d.status === 'pending').length;
  const overdueCt = agenda.overdue.length;
  const showBanner = pendingToday > 0 || overdueCt > 0;

  useEffect(() => {
    // Badge pulse: only when there are pending items
    if (!showBanner) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    setTimeout(() => pulse.start(), 800);
    return () => pulse.stop();
  }, [showBanner]);

  useEffect(() => {
    // Avatar subtle scale breath
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarBreath, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(avatarBreath, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    setTimeout(() => breath.start(), 600);
    return () => breath.stop();
  }, []);

  if (pets.isLoading) return <Loading />;

  const all = pets.data ?? [];
  const firstName = (profile.data?.full_name ?? '').split(' ')[0];

  const shown = query.trim()
    ? all.filter((p) =>
        `${p.name} ${p.breed ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : all;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* ── Greeting ── */}
        <FadeSection delay={0}>
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <T size={13} color={INK_SOFT} weight="medium">
                {firstName ? `Hi ${firstName},` : 'Hello,'}
              </T>
              <T size={20} weight="bold" color={INK} style={{ lineHeight: 26, marginTop: 1 }}>
                Let's take care of{'\n'}your pets 🐾
              </T>
            </View>
            <Animated.View style={{ transform: [{ scale: avatarBreath }] }}>
              <Pressable
                onPress={() => router.push('/profile')}
                style={styles.avatarBtn}
              >
                <T size={18} weight="bold" color={AMBER_DARK}>
                  {(firstName || 'P').charAt(0).toUpperCase()}
                </T>
              </Pressable>
            </Animated.View>
          </View>
        </FadeSection>

        {/* ── Search ── */}
        <FadeSection delay={60}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={INK_SOFT} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search pets…"
              placeholderTextColor="#A89070"
              style={{
                flex: 1,
                marginLeft: 8,
                fontFamily: font('regular'),
                fontSize: 14,
                color: INK,
                height: '100%',
              }}
            />
            <Pressable
              onPress={() => router.push('/pet/new')}
              style={styles.filterBtn}
              accessibilityLabel="Add pet"
            >
              <Ionicons name="add" size={20} color={AMBER_DARK} />
            </Pressable>
          </View>
        </FadeSection>

        {/* ── Due-today reminder banner ── */}
        {showBanner ? (
          <FadeSection delay={120}>
            <Pressable
              onPress={() => router.push('/schedule')}
              style={({ pressed }) => [styles.reminderBanner, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.reminderIcon}>
                <Ionicons name="alarm" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <T size={13} weight="bold" color="#fff">
                  {overdueCt > 0
                    ? `${overdueCt} overdue`
                    : `${pendingToday} task${pendingToday > 1 ? 's' : ''} today`}
                </T>
                <T size={11} color="rgba(255,255,255,0.8)">
                  Tap to open schedule →
                </T>
              </View>
              <Animated.View
                style={[styles.reminderBadge, { transform: [{ scale: badgePulse }] }]}
              >
                <T size={18} weight="bold" color={AMBER}>
                  {overdueCt > 0 ? overdueCt : pendingToday}
                </T>
              </Animated.View>
            </Pressable>
          </FadeSection>
        ) : null}

        {/* ── Category quick actions ── */}
        <FadeSection delay={180}>
          <T size={16} weight="bold" color={INK} style={{ marginTop: 20, marginBottom: 12 }}>
            Quick Actions
          </T>
        </FadeSection>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        >
          {CATEGORIES.map((cat, i) => (
            <CategoryPill
              key={cat.label}
              label={cat.label}
              icon={cat.icon}
              bg={cat.bg}
              fg={cat.fg}
              index={i}
            />
          ))}
        </ScrollView>

        {/* ── My Pets ── */}
        <FadeSection delay={240}>
          <View style={styles.sectionHeader}>
            <T size={16} weight="bold" color={INK}>
              My Pets
            </T>
            <Pressable onPress={() => router.push('/pet/new')} hitSlop={8}>
              <T size={13} weight="semibold" color={AMBER_DARK}>
                + Add
              </T>
            </Pressable>
          </View>
        </FadeSection>

        {all.length === 0 ? (
          <EmptyState
            title={t('home.noPets')}
            body={t('home.noPetsBody')}
            action={t('home.addPet')}
            onAction={() => router.push('/pet/new')}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          >
            {shown.map((pet, i) => (
              <PetCard key={pet.id} pet={pet} index={i} />
            ))}
          </ScrollView>
        )}

        {/* ── Health Overview Cards ── */}
        <FadeSection delay={340}>
          <T size={16} weight="bold" color={INK} style={{ marginTop: 24, marginBottom: 12 }}>
            Health Overview
          </T>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <HealthTile
              icon="heart-pulse"
              label="Active Conditions"
              value={all.length > 0 ? 'Check pets' : '—'}
              bg="#FDECEA"
              fg="#B33A24"
              onPress={() => router.push('/')}
              index={0}
            />
            <HealthTile
              icon="calendar-check"
              label="Upcoming Doses"
              value={pendingToday > 0 ? `${pendingToday} today` : 'All done ✓'}
              bg="#E6F7EF"
              fg="#0E7A4A"
              onPress={() => router.push('/schedule')}
              index={1}
            />
          </View>
        </FadeSection>
      </ScrollView>
    </View>
  );
}

// ── Health tile with press animation ─────────────────────────────────────────

function HealthTile({
  icon,
  label,
  value,
  bg,
  fg,
  onPress,
  index,
}: {
  icon: string;
  label: string;
  value: string;
  bg: string;
  fg: string;
  onPress: () => void;
  index: number;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.95, friction: 8, tension: 130, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, friction: 8, tension: 130, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: pressAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.healthTile, { backgroundColor: bg }]}
      >
        <MaterialCommunityIcons name={icon as any} size={24} color={fg} style={{ marginBottom: 8 }} />
        <T size={18} weight="bold" color={INK}>
          {value}
        </T>
        <T size={11} color={INK_SOFT} style={{ marginTop: 2 }}>
          {label}
        </T>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    paddingHorizontal: 20,
  },

  // Greeting
  greetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  avatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: AMBER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...shadow,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8DEC8',
    ...shadow,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: AMBER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reminder banner
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AMBER,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    marginBottom: 4,
    ...shadowLg,
  },
  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category pills
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Pet card
  petCard: {
    width: 120,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE0C0',
    ...shadow,
  },
  petAvatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  petCardBody: {
    alignItems: 'center',
    width: '100%',
  },

  // Health tiles
  healthTile: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
