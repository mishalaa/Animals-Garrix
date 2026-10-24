import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { BreedPicker } from './BreedPicker';
import {
  Button,
  ChipGroup,
  DateField,
  Field,
  FormSection,
  Header,
  PetImage,
  Screen,
  T,
  ToggleRow,
} from '@/components/ui';
import { api } from '@/services';
import { useSavePet } from '@/hooks/queries';
import { isValidISODate } from '@/lib/dates';
import { notify, pickImage } from '@/lib/platform';
import { colors, space } from '@/theme';
import type { Origin, OriginSource, Pet, PickedFile, Sex, Species } from '@/types';

const SPECIES: Species[] = ['cat', 'dog', 'bird', 'rabbit', 'other'];
const SEXES: Sex[] = ['female', 'male', 'unknown'];
const COATS = ['Short', 'Medium', 'Long', 'Hairless'] as const;
const SOURCES: OriginSource[] = [
  'street_rescue',
  'shelter',
  'breeder',
  'pet_shop',
  'gift',
  'born_at_home',
  'other',
];

const s = (v: string) => (v.trim() ? v.trim() : null);

/** Create or edit a pet: identity plus origin story. */
export function PetForm({ pet, origin }: { pet?: Pet; origin?: Origin | null }) {
  const { t } = useTranslation();
  const save = useSavePet();

  const [name, setName] = useState(pet?.name ?? '');
  const [species, setSpecies] = useState<Species>(pet?.species ?? 'cat');
  const [breed, setBreed] = useState(pet?.breed ?? '');
  const [breedMix, setBreedMix] = useState(pet?.breed_mix ?? '');
  const [sex, setSex] = useState<Sex>(pet?.sex ?? 'unknown');
  const [birth, setBirth] = useState(pet?.birth_date ?? '');
  const [birthEst, setBirthEst] = useState(pet?.birth_date_estimated ?? false);
  const [weight, setWeight] = useState(pet?.weight_kg != null ? String(pet.weight_kg) : '');
  const [neutered, setNeutered] = useState(pet?.neutered ?? false);
  const [coat, setCoat] = useState<string | null>(pet?.coat_type ?? null);
  const [pattern, setPattern] = useState(pet?.coat_pattern ?? '');
  const [chip, setChip] = useState(pet?.microchip ?? '');
  const [marks, setMarks] = useState(pet?.distinguishing_marks ?? '');
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  const [source, setSource] = useState<OriginSource | null>(origin?.source ?? null);
  const [found, setFound] = useState(origin?.found_location ?? '');
  const [joined, setJoined] = useState(origin?.acquired_date ?? '');
  const [rescueCond, setRescueCond] = useState(origin?.condition_at_rescue ?? '');
  const [rescuer, setRescuer] = useState(origin?.rescuer_or_shelter ?? '');
  const [story, setStory] = useState(origin?.notes ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('common.required', { field: t('petForm.name') });
    if (birth && !isValidISODate(birth)) e.birth = t('common.invalidDate');
    if (joined && !isValidISODate(joined)) e.joined = t('common.invalidDate');
    if (weight && isNaN(Number(weight))) e.weight = t('common.error');
    setErrors(e);
    if (Object.keys(e).length) return;

    const fields: Partial<Pet> & { name: string } = {
      name: name.trim(),
      species,
      breed: s(breed),
      breed_mix: s(breedMix),
      sex,
      birth_date: s(birth),
      birth_date_estimated: birthEst,
      weight_kg: weight ? Number(weight) : null,
      neutered,
      coat_type: coat,
      coat_pattern: s(pattern),
      microchip: s(chip),
      distinguishing_marks: s(marks),
    };
    const hasOrigin = source || found || joined || rescueCond || rescuer || story;
    try {
      const saved = await save.mutateAsync({
        id: pet?.id,
        pet: fields,
        origin: hasOrigin
          ? {
              source: source ?? 'other',
              found_location: s(found),
              found_lat: origin?.found_lat ?? null,
              found_lng: origin?.found_lng ?? null,
              acquired_date: s(joined),
              condition_at_rescue: s(rescueCond),
              rescuer_or_shelter: s(rescuer),
              notes: s(story),
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

  const preview = {
    id: pet?.id ?? name ?? 'new',
    species,
    photo_path: photo ? null : (pet?.photo_path ?? null),
  };

  return (
    <Screen>
      <Header title={pet ? t('petForm.editTitle', { name: pet.name }) : t('petForm.newTitle')} />

      {/* Photo */}
      <View style={{ alignItems: 'center', marginBottom: space.xl }}>
        <Pressable
          onPress={async () => {
            const f = await pickImage();
            if (f) setPhoto(f);
          }}
          style={{ alignItems: 'center' }}
        >
          {photo ? (
            <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden' }}>
              <PhotoPreview uri={photo.uri} />
            </View>
          ) : (
            <PetImage pet={preview} size={120} rounded={60} />
          )}
          <T size={14} weight="medium" color={colors.primaryDark} style={{ marginTop: space.sm }}>
            {photo || pet?.photo_path ? t('petForm.changePhoto') : t('petForm.photo')}
          </T>
        </Pressable>
      </View>

      <FormSection title={t('petForm.identity')}>
        <Field label={t('petForm.name')} value={name} onChangeText={setName} error={errors.name} />
        <ChipGroup
          label={t('petForm.species')}
          options={SPECIES.map((v) => ({ value: v, label: t(`species.${v}`) }))}
          value={species}
          onChange={(v) => {
            if (v) setSpecies(v);
            setBreed('');
          }}
        />
        <BreedPicker species={species} value={breed} onChange={setBreed} />
        {breed === 'Mixed' || breedMix ? (
          <Field
            label={t('petForm.breedMix')}
            value={breedMix}
            onChangeText={setBreedMix}
            placeholder={t('petForm.breedMixHint')}
          />
        ) : null}
        <ChipGroup
          label={t('petForm.sex')}
          options={SEXES.map((v) => ({ value: v, label: t(`sex.${v}`) }))}
          value={sex}
          onChange={(v) => v && setSex(v)}
        />
        <DateField label={t('petForm.birthDate')} value={birth} onChange={setBirth} error={errors.birth} />
        <ToggleRow label={t('petForm.birthEstimated')} value={birthEst} onChange={setBirthEst} />
        <Field
          label={t('petForm.weight')}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          error={errors.weight}
        />
        <ToggleRow label={t('petForm.neutered')} value={!!neutered} onChange={setNeutered} />
        <ChipGroup
          label={t('petForm.coatType')}
          options={COATS.map((v) => ({ value: v, label: t(`coat.${v}`) }))}
          value={coat}
          onChange={setCoat}
          allowEmpty
        />
        <Field
          label={t('petForm.coatPattern')}
          value={pattern}
          onChangeText={setPattern}
          placeholder="Tabby, calico, tuxedo…"
        />
        <Field label={t('petForm.microchip')} value={chip} onChangeText={setChip} keyboardType="number-pad" />
        <Field label={t('petForm.marks')} value={marks} onChangeText={setMarks} multiline />
      </FormSection>

      <FormSection title={t('petForm.origin')}>
        <ChipGroup
          label={t('petForm.originSource')}
          options={SOURCES.map((v) => ({ value: v, label: t(`originSource.${v}`) }))}
          value={source}
          onChange={setSource}
          allowEmpty
        />
        <Field
          label={t('petForm.foundLocation')}
          value={found}
          onChangeText={setFound}
          placeholder={t('petForm.foundLocationHint')}
        />
        <DateField
          label={t('petForm.acquiredDate')}
          value={joined}
          onChange={setJoined}
          error={errors.joined}
        />
        <Field
          label={t('petForm.conditionAtRescue')}
          value={rescueCond}
          onChangeText={setRescueCond}
          multiline
        />
        <Field label={t('petForm.rescuer')} value={rescuer} onChangeText={setRescuer} />
        <Field label={t('petForm.originNotes')} value={story} onChangeText={setStory} multiline />
      </FormSection>

      <Button
        title={t('common.save')}
        onPress={submit}
        loading={save.isPending || uploading}
        style={{ marginTop: space.md }}
      />
    </Screen>
  );
}

function PhotoPreview({ uri }: { uri: string }) {
  return <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />;
}
