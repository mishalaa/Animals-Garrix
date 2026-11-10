/**
 * PetCardStackForm — card-stack onboarding for adding / editing a pet.
 *
 * Design principles:
 *  • One focused question per card. No scroll inside a card.
 *  • Soft, slow spring animations (pop-in, gentle scale, fade).
 *  • Navigation: tap "Continue" only — no swipe gestures at all.
 *  • Peek stack shows upcoming cards as small rounded pills, not full cards.
 *  • Each card is compact; only fields that belong to that question appear.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BreedPicker } from './BreedPicker';
import { Chip, Row, T, useFont } from '@/components/ui';
import { useSavePet } from '@/hooks/queries';
import { isValidISODate, toISODate } from '@/lib/dates';
import { notify, pickImage } from '@/lib/platform';
import { api } from '@/services';
import { colors, radius, shadow, shadowLg, space } from '@/theme';
import type { Origin, OriginSource, Pet, PickedFile, Sex, Species } from '@/types';

// ─── Step definitions ────────────────────────────────────────────────────────

type StepId = 'name' | 'species' | 'birth' | 'weight' | 'origin' | 'extras';

interface Step {
  id: StepId;
  label: string; // Short pill label for peek stack
  question: string; // Big headline on the active card
  hint?: string; // One-line helper under the headline
  icon: keyof typeof Ionicons.glyphMap;
  cardBg: string;
  pillBg: string;
  pillFg: string;
}

const STEPS: Step[] = [
  {
    id: 'name',
    label: 'Name & Gender',
    question: "What's their name?",
    hint: 'Start with the name you call them',
    icon: 'sparkles-outline',
    cardBg: '#FFFFFF',
    pillBg: '#EDE8FD',
    pillFg: '#5D46D6',
  },
  {
    id: 'species',
    label: 'Species & Breed',
    question: 'What kind of pet?',
    hint: 'Pick a species, then breed if you know it',
    icon: 'paw-outline',
    cardBg: '#F0ECFE',
    pillBg: '#E0D9FC',
    pillFg: '#4835C4',
  },
  {
    id: 'birth',
    label: 'Birthday',
    question: 'When were they born?',
    hint: 'Rough estimate is fine',
    icon: 'calendar-outline',
    cardBg: '#FFF0ED',
    pillBg: '#FFD9D3',
    pillFg: '#D94532',
  },
  {
    id: 'weight',
    label: 'Weight',
    question: 'How much do they weigh?',
    hint: 'In kilograms — you can update this later',
    icon: 'scale-outline',
    cardBg: '#E6F7EF',
    pillBg: '#C8EDDA',
    pillFg: '#0E7A4A',
  },
  {
    id: 'origin',
    label: 'Origin',
    question: 'Where did they come from?',
    hint: 'Rescue, shelter, breeder, or born at home',
    icon: 'heart-outline',
    cardBg: '#FFFBEE',
    pillBg: '#FCEABF',
    pillFg: '#946300',
  },
  {
    id: 'extras',
    label: 'Safety Details',
    question: 'Any ID details?',
    hint: 'Microchip number or distinguishing marks',
    icon: 'shield-checkmark-outline',
    cardBg: '#EEF5FF',
    pillBg: '#D0E6FF',
    pillFg: '#1B6DC9',
  },
];

const SPECIES_OPTIONS: { id: Species; emoji: string; label: string }[] = [
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
  { id: 'bird', emoji: '🦜', label: 'Bird' },
  { id: 'other', emoji: '🐾', label: 'Other' },
];

const ORIGIN_OPTIONS: { id: OriginSource; label: string }[] = [
  { id: 'street_rescue', label: 'Street rescue' },
  { id: 'shelter', label: 'Shelter' },
  { id: 'breeder', label: 'Breeder' },
  { id: 'pet_shop', label: 'Pet shop' },
  { id: 'gift', label: 'Gift' },
  { id: 'born_at_home', label: 'Born at home' },
  { id: 'other', label: 'Other' },
];

const s = (v: string) => (v.trim() ? v.trim() : null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Soft spring config used everywhere in this screen */
const SPRING = { friction: 18, tension: 60, useNativeDriver: true };
/** Slow fade/scale duration for peek pills */
const PILL_DURATION = 380;

// ─── Main component ───────────────────────────────────────────────────────────

export function PetCardStackForm({ pet, origin }: { pet?: Pet; origin?: Origin | null }) {
  const { t } = useTranslation();
  const font = useFont();
  const insets = useSafeAreaInsets();
  const save = useSavePet();

  // ── form state ──
  const [name, setName] = useState(pet?.name ?? '');
  const [species, setSpecies] = useState<Species>(pet?.species ?? 'cat');
  const [breed, setBreed] = useState(pet?.breed ?? '');
  const [breedMix, setBreedMix] = useState(pet?.breed_mix ?? '');
  const [sex, setSex] = useState<Sex>(pet?.sex ?? 'unknown');
  const [birth, setBirth] = useState(pet?.birth_date ?? '');
  const [birthEst, setBirthEst] = useState(pet?.birth_date_estimated ?? false);
  const [weight, setWeight] = useState(pet?.weight_kg != null ? String(pet.weight_kg) : '');
  const [neutered, setNeutered] = useState(pet?.neutered ?? false);
  const [source, setSource] = useState<OriginSource | null>(origin?.source ?? null);
  const [found, setFound] = useState(origin?.found_location ?? '');
  const [chip, setChip] = useState(pet?.microchip ?? '');
  const [marks, setMarks] = useState(pet?.distinguishing_marks ?? '');
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  const [nameError, setNameError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0);

  // ── animation refs ──
  // Card: pops in from slightly below + fades
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  // Run entry animation whenever step changes
  useEffect(() => {
    cardOpacity.setValue(0);
    cardTranslateY.setValue(22);
    cardScale.setValue(0.96);

    Animated.parallel([
      Animated.spring(cardOpacity, { toValue: 1, ...SPRING }),
      Animated.spring(cardTranslateY, { toValue: 0, ...SPRING }),
      Animated.spring(cardScale, { toValue: 1, ...SPRING }),
    ]).start();
  }, [step]);

  const currentStep = STEPS[step];
  const remainingSteps = STEPS.slice(step + 1);
  const isLast = step === STEPS.length - 1;

  // ── navigation ──
  const goNext = () => {
    if (step === 0 && !name.trim()) {
      setNameError(t('common.required', { field: t('petForm.name') }));
      return;
    }
    setNameError('');
    if (!isLast) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  };

  const goPrev = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const submit = async () => {
    if (!name.trim()) {
      setStep(0);
      setNameError(t('common.required', { field: t('petForm.name') }));
      return;
    }

    const fields: Partial<Pet> & { name: string } = {
      name: name.trim(),
      species,
      breed: s(breed),
      breed_mix: s(breedMix),
      sex,
      birth_date: birth && isValidISODate(birth) ? birth : null,
      birth_date_estimated: birthEst,
      weight_kg: weight && !isNaN(Number(weight)) ? Number(weight) : null,
      neutered,
      microchip: s(chip),
      distinguishing_marks: s(marks),
    };

    const hasOrigin = source || found;
    try {
      const saved = await save.mutateAsync({
        id: pet?.id,
        pet: fields,
        origin: hasOrigin
          ? {
              source: source ?? 'other',
              found_location: s(found),
              found_lat: null,
              found_lng: null,
              acquired_date: null,
              condition_at_rescue: null,
              rescuer_or_shelter: null,
              notes: null,
            }
          : undefined,
      });
      if (photo) {
        setUploading(true);
        const path = await api.uploadFile(saved.id, photo);
        await save.mutateAsync({ id: saved.id, pet: { name: saved.name, photo_path: path } });
      }
      if (pet) router.back();
      else router.replace(`/pet/${saved.id}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const handlePickPhoto = async () => {
    const f = await pickImage();
    if (f) setPhoto(f);
  };

  // ── render ──
  return (
    <View style={[styles.root, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 16 }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={goPrev} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>

        {/* Step dots */}
        <Row gap={6}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </Row>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {/* ── Active card ── */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: currentStep.cardBg },
          shadowLg,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
          },
        ]}
      >
        {/* Step icon + counter */}
        <Row style={{ justifyContent: 'space-between', marginBottom: 18 }}>
          <View style={[styles.stepIconCircle, { backgroundColor: currentStep.pillBg }]}>
            <Ionicons name={currentStep.icon} size={18} color={currentStep.pillFg} />
          </View>
          <T size={12} weight="semibold" color={colors.muted}>
            {step + 1} / {STEPS.length}
          </T>
        </Row>

        {/* Headline */}
        <T size={22} weight="bold" color="#171A1F" style={styles.headline}>
          {currentStep.question}
        </T>
        {currentStep.hint ? (
          <T size={13} color={colors.muted} style={{ marginBottom: 20 }}>
            {currentStep.hint}
          </T>
        ) : null}

        {/* ── Step content ── */}
        <StepContent
          step={step}
          font={font}
          // name step
          name={name}
          setName={(v) => {
            setName(v);
            if (nameError) setNameError('');
          }}
          nameError={nameError}
          sex={sex}
          setSex={setSex}
          // species step
          species={species}
          setSpecies={(v) => {
            setSpecies(v);
            setBreed('');
          }}
          breed={breed}
          setBreed={setBreed}
          breedMix={breedMix}
          setBreedMix={setBreedMix}
          // birth step
          birth={birth}
          setBirth={setBirth}
          birthEst={birthEst}
          setBirthEst={setBirthEst}
          // weight step
          weight={weight}
          setWeight={setWeight}
          neutered={neutered}
          setNeutered={setNeutered}
          // origin step
          source={source}
          setSource={setSource}
          found={found}
          setFound={setFound}
          // extras step
          chip={chip}
          setChip={setChip}
          marks={marks}
          setMarks={setMarks}
          // photo (shown on name card)
          photo={photo}
          pet={pet}
          onPickPhoto={handlePickPhoto}
        />

        {/* Continue button */}
        <Pressable
          onPress={goNext}
          disabled={save.isPending || uploading}
          style={({ pressed }) => [
            styles.continueBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
            (save.isPending || uploading) && { opacity: 0.55 },
          ]}
        >
          <Row gap={8}>
            <T size={15} weight="semibold" color="#fff">
              {isLast ? (save.isPending || uploading ? 'Saving…' : 'Save passport 🐾') : 'Continue'}
            </T>
            {!isLast && <Ionicons name="arrow-forward" size={16} color="#fff" />}
          </Row>
        </Pressable>
      </Animated.View>

      {/* ── Peek stack — small rounded pills ── */}
      <View style={styles.peekStack}>
        {remainingSteps.slice(0, 4).map((s2, idx) => (
          <AnimatedPeekPill
            key={s2.id}
            step={s2}
            index={idx}
            onPress={() =>
              setStep(s2.id === STEPS[step + 1]?.id ? step + 1 : STEPS.findIndex((s3) => s3.id === s2.id))
            }
          />
        ))}
      </View>
    </View>
  );
}

// ─── Animated peek pill ───────────────────────────────────────────────────────

function AnimatedPeekPill({ step, index, onPress }: { step: Step; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 380 + index * 60,
      delay: index * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step.id]);

  return (
    <Animated.View
      style={{
        opacity: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, index === 0 ? 1 : index === 1 ? 0.72 : index === 2 ? 0.48 : 0.3],
        }),
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
          {
            scale: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.peekPill,
          { backgroundColor: step.pillBg, borderColor: step.pillBg },
          pressed && { opacity: 0.75 },
        ]}
      >
        <Ionicons name={step.icon} size={13} color={step.pillFg} />
        <T size={12} weight="semibold" color={step.pillFg}>
          {step.label}
        </T>
      </Pressable>
    </Animated.View>
  );
}

// ─── Step content panels ─────────────────────────────────────────────────────

interface StepContentProps {
  step: number;
  font: (w?: 'regular' | 'medium' | 'semibold' | 'bold') => string;
  name: string;
  setName: (v: string) => void;
  nameError: string;
  sex: Sex;
  setSex: (v: Sex) => void;
  species: Species;
  setSpecies: (v: Species) => void;
  breed: string;
  setBreed: (v: string) => void;
  breedMix: string;
  setBreedMix: (v: string) => void;
  birth: string;
  setBirth: (v: string) => void;
  birthEst: boolean;
  setBirthEst: (v: boolean) => void;
  weight: string;
  setWeight: (v: string) => void;
  neutered: boolean;
  setNeutered: (v: boolean) => void;
  source: OriginSource | null;
  setSource: (v: OriginSource | null) => void;
  found: string;
  setFound: (v: string) => void;
  chip: string;
  setChip: (v: string) => void;
  marks: string;
  setMarks: (v: string) => void;
  photo: PickedFile | null;
  pet?: Pet;
  onPickPhoto: () => void;
}

function StepContent(p: StepContentProps) {
  const { t } = useTranslation();

  // ── Step 0: Name ──
  if (p.step === 0)
    return (
      <View style={styles.stepBody}>
        {/* Photo thumbnail — small, optional tap */}
        <Pressable onPress={p.onPickPhoto} style={styles.photoRow}>
          <View style={styles.photoThumb}>
            {p.photo?.uri || p.pet?.photo_path ? (
              <Image
                source={{ uri: p.photo?.uri ?? '' }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="camera-outline" size={22} color={colors.muted} />
            )}
          </View>
          <T size={13} weight="medium" color={colors.primaryDark}>
            {p.photo || p.pet?.photo_path ? 'Change photo' : 'Add photo (optional)'}
          </T>
        </Pressable>

        <PillInput
          icon="paw-outline"
          value={p.name}
          onChangeText={p.setName}
          placeholder="e.g. Mochi, Simba, Bella"
          autoFocus={!p.pet}
          font={p.font}
          error={p.nameError}
        />

        <Label>Gender</Label>
        <Row gap={8} style={{ marginBottom: 16 }}>
          {(['female', 'male', 'unknown'] as Sex[]).map((g) => (
            <OptionChip key={g} label={t(`sex.${g}`)} selected={p.sex === g} onPress={() => p.setSex(g)} />
          ))}
        </Row>
      </View>
    );

  // ── Step 1: Species ──
  if (p.step === 1)
    return (
      <View style={styles.stepBody}>
        <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: 16 }}>
          {SPECIES_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => p.setSpecies(opt.id)}
              style={[styles.speciesTile, p.species === opt.id && styles.speciesTileActive]}
            >
              <T size={26}>{opt.emoji}</T>
              <T
                size={12}
                weight={p.species === opt.id ? 'semibold' : 'regular'}
                color={p.species === opt.id ? colors.primaryDark : colors.inkSoft}
              >
                {t(`species.${opt.id}`)}
              </T>
            </Pressable>
          ))}
        </Row>
        <BreedPicker species={p.species} value={p.breed} onChange={p.setBreed} />
      </View>
    );

  // ── Step 2: Birthday ──
  if (p.step === 2)
    return (
      <View style={styles.stepBody}>
        <Row gap={8} style={{ marginBottom: 4 }}>
          <PillInput
            icon="calendar-outline"
            value={p.birth}
            onChangeText={p.setBirth}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            font={p.font}
            style={{ flex: 1 }}
          />
          <Pressable onPress={() => p.setBirth(toISODate(new Date()))} style={styles.todayBtn}>
            <T size={12} weight="semibold" color={colors.primaryDark}>
              Today
            </T>
          </Pressable>
        </Row>

        <TogglePill label="Birth date is estimated" value={p.birthEst} onChange={p.setBirthEst} />
      </View>
    );

  // ── Step 3: Weight ──
  if (p.step === 3)
    return (
      <View style={styles.stepBody}>
        <Row gap={8} style={{ marginBottom: 16 }}>
          <PillInput
            icon="scale-outline"
            value={p.weight}
            onChangeText={p.setWeight}
            placeholder="e.g. 4.5"
            keyboardType="decimal-pad"
            font={p.font}
            style={{ flex: 1 }}
          />
          <View style={styles.unitBadge}>
            <T size={13} weight="bold" color={colors.primaryDark}>
              kg
            </T>
          </View>
        </Row>
        <TogglePill label={t('petForm.neutered')} value={p.neutered} onChange={p.setNeutered} />
      </View>
    );

  // ── Step 4: Origin ──
  if (p.step === 4)
    return (
      <View style={styles.stepBody}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ORIGIN_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.id}
              label={t(`originSource.${opt.id}`)}
              selected={p.source === opt.id}
              onPress={() => p.setSource(p.source === opt.id ? null : opt.id)}
            />
          ))}
        </View>
        <PillInput
          icon="location-outline"
          value={p.found}
          onChangeText={p.setFound}
          placeholder="Where were they found? (optional)"
          font={p.font}
        />
      </View>
    );

  // ── Step 5: Extras ──
  if (p.step === 5)
    return (
      <View style={styles.stepBody}>
        <PillInput
          icon="barcode-outline"
          value={p.chip}
          onChangeText={p.setChip}
          placeholder="Microchip number (optional)"
          keyboardType="number-pad"
          font={p.font}
        />
        <PillInput
          icon="finger-print-outline"
          value={p.marks}
          onChangeText={p.setMarks}
          placeholder="Distinguishing marks (optional)"
          font={p.font}
        />
      </View>
    );

  return null;
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function Label({ children }: { children: string }) {
  return (
    <T size={12} weight="semibold" color={colors.muted} style={{ marginBottom: 6 }}>
      {children}
    </T>
  );
}

function PillInput({
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  autoFocus,
  font,
  error,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numbers-and-punctuation' | 'decimal-pad' | 'number-pad';
  maxLength?: number;
  autoFocus?: boolean;
  font: (w?: 'regular' | 'medium' | 'semibold' | 'bold') => string;
  error?: string;
  style?: object;
}) {
  return (
    <View style={[{ marginBottom: error ? 4 : 14 }, style]}>
      <View style={[styles.pillInputRow, error ? { borderColor: colors.danger } : null]}>
        <Ionicons name={icon} size={17} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A8B2BE"
          keyboardType={keyboardType ?? 'default'}
          maxLength={maxLength}
          autoFocus={autoFocus}
          style={{ flex: 1, fontFamily: font('regular'), fontSize: 15, color: colors.ink, height: '100%' }}
        />
      </View>
      {error ? (
        <T size={11} color={colors.danger} style={{ marginTop: 2, marginLeft: 4 }}>
          {error}
        </T>
      ) : null}
    </View>
  );
}

function TogglePill({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.togglePill}>
      <T size={14} color={colors.ink}>
        {label}
      </T>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: '#DDE1E6' }}
        thumbColor="#fff"
        {...(Platform.OS === 'web' ? ({ activeThumbColor: '#fff' } as object) : {})}
      />
    </Pressable>
  );
}

function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionChip,
        selected && styles.optionChipSelected,
        pressed && { opacity: 0.75 },
      ]}
    >
      <T size={13} weight={selected ? 'semibold' : 'regular'} color={selected ? '#fff' : colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  topBar: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF0',
    ...shadow,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD4DF',
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  dotDone: {
    backgroundColor: '#94A3B8',
  },

  // Active card
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  stepIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    lineHeight: 30,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  },
  stepBody: {
    marginTop: 4,
  },

  continueBtn: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // Photo row
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  photoThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EEF1F4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },

  // Pill input
  pillInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    height: 50,
    paddingHorizontal: 14,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F3F7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  todayBtn: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCFC8',
  },
  unitBadge: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCFC8',
  },

  // Option chips
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#EEF1F4',
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // Species tiles
  speciesTile: {
    width: '18%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#EEF1F4',
    borderWidth: 1,
    borderColor: '#DDE2E8',
    gap: 4,
  },
  speciesTileActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  // Peek pills
  peekStack: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 2,
  },
  peekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
