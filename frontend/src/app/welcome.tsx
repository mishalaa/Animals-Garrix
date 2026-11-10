/**
 * Mobile App Onboarding Screen.
 *
 * A native mobile first-launch walkthrough:
 *  • 4 interactive, visually rich slides with soft animations
 *  • Animated pagination indicator (active pill + dots)
 *  • Top header with Back, Logo, and Skip buttons
 *  • Slide 1: Digital Passport & Official Records
 *  • Slide 2: Smart Dose Alarms & Preventive Care
 *  • Slide 3: Vet Visits, Growth Curves & Health Vitals
 *  • Slide 4: Interactive Companion Selector & Sign-Up / Demo Launch
 *  • Completely fits the mobile viewport (no webpage scrolling)
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSwitch } from '@/components/common/LanguageSwitch';
import { T } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services';
import { shadow, shadowLg } from '@/theme';

const { width: SW } = Dimensions.get('window');

// Color palette
const CREAM = '#FAF5EC';
const CARD_BG = '#FFFFFF';
const BORDER = '#EDE0C0';
const INK = '#1C1917';
const INK_SOFT = '#78716C';
const AMBER = '#E07A2B';
const AMBER_DARK = '#B85814';
const AMBER_SOFT = '#FCEBD9';
const GREEN = '#0E7A4A';
const GREEN_SOFT = '#E6F7EF';

interface SlideData {
  id: string;
  badge: string;
  badgeIcon: string;
  badgeColor: string;
  badgeBg: string;
  title: string;
  highlight: string;
  desc: string;
}

const SLIDES: SlideData[] = [
  {
    id: 'passport',
    badge: 'DIGITAL PASSPORT',
    badgeIcon: 'card-account-details-outline',
    badgeColor: '#B85814',
    badgeBg: '#FCEBD9',
    title: 'Your Pet’s Official',
    highlight: 'Health Passport',
    desc: 'Store verified vaccine records, rabies booster dates, batch numbers, and microchip ID all in one secure pocket.',
  },
  {
    id: 'dosing',
    badge: 'SMART ALARMS',
    badgeIcon: 'bell-ring-outline',
    badgeColor: '#128251',
    badgeBg: '#EAF8F1',
    title: 'Never Miss a Pill or',
    highlight: 'Preventive Dose',
    desc: 'Set custom alarms for daily tablets, monthly flea & tick chewables, and annual veterinary appointments.',
  },
  {
    id: 'vitals',
    badge: 'CLINICAL HISTORY',
    badgeIcon: 'heart-pulse',
    badgeColor: '#1D64D8',
    badgeBg: '#EFF6FF',
    title: 'Track Weight, Allergies',
    highlight: '& Vet Clinic Visits',
    desc: 'Keep complete clinic timelines, track steady growth curves, and instantly share dossiers with vets or sitters.',
  },
  {
    id: 'get-started',
    badge: 'GET STARTED',
    badgeIcon: 'paw',
    badgeColor: '#D9651C',
    badgeBg: '#FFF3E8',
    title: 'Ready to Care for',
    highlight: 'Your Companions?',
    desc: 'Works 100% offline, free forever, and your pet’s records stay completely private on this device.',
  },
];

const SPECIES_OPTIONS = [
  { id: 'dog', label: 'Dog', icon: 'dog' },
  { id: 'cat', label: 'Cat', icon: 'cat' },
  { id: 'rabbit', label: 'Rabbit', icon: 'rabbit' },
  { id: 'bird', label: 'Bird', icon: 'bird' },
  { id: 'other', label: 'Other', icon: 'paw' },
];

export default function Welcome() {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const insets = useSafeAreaInsets();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(['dog']);

  // Slide transition animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // Floating continuous loop
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Bell wiggle continuous loop (for slide 1)
  const bellRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle floating loop for central illustrations
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    float.start();

    // Bell wiggle loop
    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(bellRot, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(bellRot, { toValue: -1, duration: 150, useNativeDriver: true }),
        Animated.timing(bellRot, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(bellRot, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.delay(2200),
      ]),
    );
    wiggle.start();

    return () => {
      float.stop();
      wiggle.stop();
    };
  }, []);

  const goToSlide = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= SLIDES.length) return;

    // Soft exit
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 0.94, friction: 8, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(nextIndex);
      // Soft entrance
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      ]).start();
    });
  };

  const toggleSpecies = (id: string) => {
    setSelectedSpecies((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((s) => s !== id) : prev) : [...prev, id],
    );
  };

  if (ready && user) return <Redirect href="/" />;

  const isLast = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      {/* ── Top Navigation Bar ── */}
      <View style={styles.topBar}>
        {currentSlide > 0 ? (
          <Pressable
            onPress={() => goToSlide(currentSlide - 1)}
            style={styles.backBtn}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={20} color={INK} />
          </Pressable>
        ) : (
          <View style={styles.logoWrap}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="paw" size={16} color={AMBER} />
            </View>
            <T size={15} weight="bold" color={INK} style={{ letterSpacing: 0.3 }}>
              PetPassport
            </T>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LanguageSwitch />
          {!isLast ? (
            <Pressable
              onPress={() => goToSlide(SLIDES.length - 1)}
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              <T size={13} weight="semibold" color={INK_SOFT}>
                Skip
              </T>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/sign-in')}
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              <T size={13} weight="semibold" color={AMBER_DARK}>
                Sign In
              </T>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Center Visual Card (Slide Illustration) ── */}
      <View style={styles.visualContainer}>
        <Animated.View
          style={[
            styles.visualCard,
            {
              transform: [{ translateY: floatAnim }, { scale: cardScale }],
              opacity: contentFade,
            },
          ]}
        >
          {/* SLIDE 0: Digital Passport Card */}
          {currentSlide === 0 && (
            <View style={styles.passportCard}>
              <View style={styles.passportTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.passportAvatar}>
                    <MaterialCommunityIcons name="dog" size={32} color={AMBER_DARK} />
                  </View>
                  <View>
                    <T size={16} weight="bold" color={INK}>
                      Mochi
                    </T>
                    <T size={11} color={INK_SOFT}>
                      Golden Retriever · 2 yrs
                    </T>
                  </View>
                </View>
                <View style={styles.passportStamp}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={GREEN} />
                  <T size={11} weight="bold" color={GREEN}>
                    VERIFIED
                  </T>
                </View>
              </View>

              <View style={styles.passportDivider} />

              <View style={styles.passportDetails}>
                <View style={{ flex: 1 }}>
                  <T size={10} color={INK_SOFT}>
                    CHIP ID
                  </T>
                  <T size={12} weight="bold" color={INK}>
                    985 141 002 871
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T size={10} color={INK_SOFT}>
                    RABIES BOOSTER
                  </T>
                  <T size={12} weight="bold" color={AMBER_DARK}>
                    Valid thru Oct 2026
                  </T>
                </View>
              </View>

              <View style={styles.passportChipBar}>
                <MaterialCommunityIcons name="needle" size={14} color="#D9651C" />
                <T size={11} weight="semibold" color="#D9651C">
                  DHPP, Rabies, Bordetella all logged
                </T>
              </View>
            </View>
          )}

          {/* SLIDE 1: Smart Dosing Alarms */}
          {currentSlide === 1 && (
            <View style={styles.dosingVisualWrap}>
              <View style={styles.alarmBellCircle}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: bellRot.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: ['-14deg', '0deg', '14deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <MaterialCommunityIcons name="bell-ring" size={38} color="#128251" />
                </Animated.View>
              </View>

              <View style={styles.doseCardPreview}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.pillIconCircle}>
                    <MaterialCommunityIcons name="pill" size={20} color="#128251" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T size={14} weight="bold" color={INK}>
                      Heartgard Plus Chewable
                    </T>
                    <T size={11} color={INK_SOFT}>
                      Daily preventative · 08:00 AM
                    </T>
                  </View>
                  <View style={styles.doseCheckBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                </View>
              </View>

              <View style={[styles.doseCardPreview, { opacity: 0.8, marginTop: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.pillIconCircle, { backgroundColor: '#FFF3E8' }]}>
                    <MaterialCommunityIcons name="needle" size={20} color={AMBER_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T size={14} weight="bold" color={INK}>
                      Flea & Tick Monthly
                    </T>
                    <T size={11} color={INK_SOFT}>
                      Next due in 4 days
                    </T>
                  </View>
                  <T size={11} weight="bold" color={AMBER_DARK}>
                    Upcoming
                  </T>
                </View>
              </View>
            </View>
          )}

          {/* SLIDE 2: Clinical Vitals & Growth */}
          {currentSlide === 2 && (
            <View style={styles.vitalsVisualWrap}>
              <View style={styles.vitalsTopRow}>
                <View style={styles.vitalTile}>
                  <MaterialCommunityIcons name="scale-bathroom" size={22} color="#B45309" />
                  <T size={18} weight="bold" color={INK} style={{ marginTop: 4 }}>
                    28.4 kg
                  </T>
                  <T size={10} color={GREEN} weight="bold">
                    +0.2 kg · Healthy steady
                  </T>
                </View>

                <View style={styles.vitalTile}>
                  <MaterialCommunityIcons name="stethoscope" size={22} color="#1D64D8" />
                  <T size={15} weight="bold" color={INK} style={{ marginTop: 4 }}>
                    Vet Checkup
                  </T>
                  <T size={10} color={INK_SOFT}>
                    Dr. Harris · All clear
                  </T>
                </View>
              </View>

              <View style={styles.allergyWarningCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B91C1C" />
                <View style={{ flex: 1 }}>
                  <T size={12} weight="bold" color="#B91C1C">
                    Known Sensitivity: Chicken Protein
                  </T>
                  <T size={10} color={INK_SOFT}>
                    Shared automatically in emergency export dossier
                  </T>
                </View>
              </View>
            </View>
          )}

          {/* SLIDE 3: Interactive Companion Picker */}
          {currentSlide === 3 && (
            <View style={styles.speciesSelectWrap}>
              <T size={13} weight="bold" color={AMBER_DARK} center style={{ marginBottom: 10 }}>
                WHO’S IN YOUR FAMILY?
              </T>
              <View style={styles.speciesGrid}>
                {SPECIES_OPTIONS.map((item) => {
                  const isSelected = selectedSpecies.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleSpecies(item.id)}
                      style={[
                        styles.speciesChip,
                        isSelected && styles.speciesChipSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={22}
                        color={isSelected ? '#fff' : AMBER_DARK}
                      />
                      <T
                        size={12}
                        weight={isSelected ? 'bold' : 'medium'}
                        color={isSelected ? '#fff' : INK}
                      >
                        {item.label}
                      </T>
                    </Pressable>
                  );
                })}
              </View>
              <T size={11} color={INK_SOFT} center style={{ marginTop: 12 }}>
                ✓ Independent records, calendars & doses for each pet
              </T>
            </View>
          )}
        </Animated.View>
      </View>

      {/* ── Slide Text Content ── */}
      <Animated.View style={[styles.textContainer, { opacity: contentFade }]}>
        <View style={[styles.badgePill, { backgroundColor: slide.badgeBg }]}>
          <MaterialCommunityIcons name={slide.badgeIcon as any} size={13} color={slide.badgeColor} />
          <T size={11} weight="bold" color={slide.badgeColor}>
            {slide.badge}
          </T>
        </View>

        <T
          size={26}
          weight="bold"
          color={INK}
          center
          style={{
            lineHeight: 34,
            fontFamily: Platform.select({
              ios: 'Georgia',
              android: 'serif',
              default: 'Georgia, serif',
            }),
            marginTop: 8,
          }}
        >
          {slide.title}{'\n'}
          <T size={26} weight="bold" color={AMBER}>
            {slide.highlight}
          </T>
        </T>

        <T size={14} color={INK_SOFT} center style={{ lineHeight: 21, marginTop: 8, maxWidth: 320 }}>
          {slide.desc}
        </T>
      </Animated.View>

      {/* ── Bottom Controls & Dots ── */}
      <View style={styles.bottomArea}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const active = i === currentSlide;
            return (
              <Pressable
                key={i}
                onPress={() => goToSlide(i)}
                hitSlop={8}
                style={[styles.dot, active && styles.dotActive]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        {!isLast ? (
          <Pressable
            onPress={() => goToSlide(currentSlide + 1)}
            style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
          >
            <T size={16} weight="bold" color="#fff">
              Continue →
            </T>
          </Pressable>
        ) : (
          <View style={{ width: '100%', gap: 10, alignItems: 'center' }}>
            <Pressable
              onPress={() => router.push('/sign-in?mode=signup')}
              style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
            >
              <T size={16} weight="bold" color="#fff">
                Create Free Account →
              </T>
            </Pressable>

            <Pressable
              onPress={() => api.signIn('', '')}
              style={({ pressed }) => [styles.demoBtn, pressed && { opacity: 0.75 }]}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={AMBER_DARK} />
              <T size={13} weight="semibold" color={AMBER_DARK}>
                Explore Instant Demo Mode
              </T>
            </Pressable>

            <Pressable
              onPress={() => router.push('/sign-in')}
              style={{ padding: 4 }}
            >
              <T size={13} color={INK_SOFT}>
                Already registered?{' '}
                <T size={13} weight="bold" color={AMBER_DARK}>
                  Sign in
                </T>
              </T>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },

  // Top Bar
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AMBER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5CEAC',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  // Center Visual Container
  visualContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 270,
    width: '100%',
  },
  visualCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    ...shadowLg,
  },

  // Slide 0: Passport Card
  passportCard: {
    gap: 12,
  },
  passportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passportAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AMBER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  passportStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GREEN_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  passportDivider: {
    height: 1,
    backgroundColor: '#F3EAD8',
  },
  passportDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  passportChipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF6EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  // Slide 1: Dosing Visual
  dosingVisualWrap: {
    alignItems: 'center',
  },
  alarmBellCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF8F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#C2EED7',
  },
  doseCardPreview: {
    width: '100%',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8DEC8',
  },
  pillIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Slide 2: Vitals Visual
  vitalsVisualWrap: {
    gap: 12,
  },
  vitalsTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vitalTile: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DEC8',
  },
  allergyWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // Slide 3: Species Selection
  speciesSelectWrap: {
    alignItems: 'center',
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8DEC8',
  },
  speciesChipSelected: {
    backgroundColor: AMBER,
    borderColor: AMBER,
  },

  // Slide Text Container
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },

  // Bottom Controls
  bottomArea: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0D6C3',
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: AMBER,
  },
  continueBtn: {
    width: '100%',
    maxWidth: 340,
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
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AMBER_SOFT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F5CEAC',
  },
});
