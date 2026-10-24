import { addDays, toISODate } from '@/lib/dates';
import type { Allergy, Condition, DoseLog, Medicine, Origin, Pet, Profile, Report, Visit } from '@/types';

/**
 * Sample data for demo mode: three pets (Mishti, Bagha, Tommy) with a realistic
 * history. Dates are relative to today so reminders and overdue items always show.
 */

export const DEMO_USER = { id: 'demo-user', email: 'demo@petpassport.app' };

export interface DemoDB {
  signedIn: boolean;
  profile: Profile;
  pets: Pet[];
  origins: Origin[];
  conditions: Condition[];
  allergies: Allergy[];
  visits: Visit[];
  medicines: Medicine[];
  dose_logs: DoseLog[];
  reports: Report[];
}

export const now = () => new Date().toISOString();

/** Add created/updated/deleted timestamps to a row. */
export function stamp<T extends object>(row: T) {
  const t = now();
  return { created_at: t, updated_at: t, deleted_at: null, ...row };
}

export function seedDemoData(): DemoDB {
  const today = new Date();
  const d = (n: number) => toISODate(addDays(today, n));
  const yearsAgo = (y: number) => toISODate(addDays(today, -Math.round(365.25 * y)));

  const pet = (p: Partial<Pet> & Pick<Pet, 'id' | 'name' | 'species'>): Pet =>
    stamp({
      owner_id: DEMO_USER.id,
      breed: null,
      breed_mix: null,
      coat_type: null,
      coat_pattern: null,
      sex: 'unknown',
      birth_date: null,
      birth_date_estimated: false,
      weight_kg: null,
      neutered: null,
      microchip: null,
      distinguishing_marks: null,
      photo_path: null,
      ...p,
    }) as Pet;

  const mishti = 'pet-mishti';
  const bagha = 'pet-bagha';
  const tommy = 'pet-tommy';

  const med = (m: Partial<Medicine> & Pick<Medicine, 'id' | 'pet_id' | 'name'>): Medicine =>
    stamp({
      visit_id: null,
      condition_id: null,
      kind: 'medicine',
      dose: null,
      frequency: 'daily',
      times: ['09:00'],
      start_date: d(-10),
      end_date: null,
      total_doses: null,
      next_due: null,
      notes: null,
      active: true,
      ...m,
    }) as Medicine;

  return {
    signedIn: false,
    profile: { id: DEMO_USER.id, full_name: 'Demo user', email: DEMO_USER.email, language: 'en' },
    pets: [
      pet({
        id: mishti,
        name: 'Mishti',
        species: 'cat',
        breed: 'Local / Deshi',
        coat_type: 'Short',
        coat_pattern: 'Tabby',
        sex: 'female',
        birth_date: yearsAgo(2.2),
        birth_date_estimated: true,
        weight_kg: 3.4,
        neutered: true,
        distinguishing_marks: 'White tip on the tail, notch in left ear',
      }),
      pet({
        id: bagha,
        name: 'Bagha',
        species: 'cat',
        breed: 'Persian',
        coat_type: 'Long',
        coat_pattern: 'Solid',
        sex: 'male',
        birth_date: yearsAgo(4.5),
        weight_kg: 4.8,
        neutered: true,
        microchip: '900108001234567',
      }),
      pet({
        id: tommy,
        name: 'Tommy',
        species: 'dog',
        breed: 'Local / Deshi',
        coat_type: 'Short',
        coat_pattern: 'Brown and white',
        sex: 'male',
        birth_date: yearsAgo(3),
        birth_date_estimated: true,
        weight_kg: 14.2,
        neutered: false,
      }),
    ],
    origins: [
      {
        pet_id: mishti,
        source: 'street_rescue',
        found_location: 'Near GEC Circle, Chattogram',
        found_lat: null,
        found_lng: null,
        acquired_date: d(-640),
        condition_at_rescue: 'Underweight, crusted eyes, about 8 weeks old',
        rescuer_or_shelter: 'Found by me on the way home',
        notes: 'Was hiding under a parked rickshaw during heavy rain.',
      },
      {
        pet_id: bagha,
        source: 'breeder',
        found_location: 'Dhaka',
        found_lat: null,
        found_lng: null,
        acquired_date: d(-1500),
        condition_at_rescue: null,
        rescuer_or_shelter: 'Home cattery in Dhanmondi',
        notes: 'Came with first vaccine card.',
      },
      {
        pet_id: tommy,
        source: 'shelter',
        found_location: 'Local animal shelter',
        found_lat: null,
        found_lng: null,
        acquired_date: d(-800),
        condition_at_rescue: 'Healthy, ticks treated at the shelter',
        rescuer_or_shelter: 'Local animal shelter',
        notes: null,
      },
    ],
    conditions: [
      stamp({
        id: 'c1',
        pet_id: mishti,
        name: 'Eye infection',
        kind: 'illness',
        status: 'resolved',
        severity: 'moderate',
        diagnosed_on: d(-635),
        resolved_on: d(-620),
        symptoms: 'Crusted, watery eyes',
        treatment: 'Antibiotic eye drops for 14 days',
        diagnosed_by: 'Dr. Rahman',
        pre_adoption: true,
        notes: 'Present when rescued.',
      }) as Condition,
      stamp({
        id: 'c2',
        pet_id: bagha,
        name: 'Early kidney disease',
        kind: 'chronic',
        status: 'managed',
        severity: 'mild',
        diagnosed_on: d(-120),
        resolved_on: null,
        symptoms: 'Drinking more water, slight weight loss',
        treatment: 'Kidney diet and daily supplement',
        diagnosed_by: 'Dr. Sultana',
        pre_adoption: false,
        notes: 'Re-check blood work every 3 months.',
      }) as Condition,
      stamp({
        id: 'c3',
        pet_id: tommy,
        name: 'Skin allergy flare-up',
        kind: 'illness',
        status: 'active',
        severity: 'mild',
        diagnosed_on: d(-6),
        resolved_on: null,
        symptoms: 'Scratching, red patches on belly',
        treatment: 'Medicated shampoo twice a week',
        diagnosed_by: 'Dr. Rahman',
        pre_adoption: false,
        notes: null,
      }) as Condition,
    ],
    allergies: [
      stamp({
        id: 'a1',
        pet_id: mishti,
        allergen: 'Chicken',
        kind: 'food',
        reaction: 'Itchy skin, ear scratching',
      }) as Allergy,
      stamp({
        id: 'a2',
        pet_id: tommy,
        allergen: 'Flea bites',
        kind: 'environment',
        reaction: 'Hot spots',
      }) as Allergy,
    ],
    visits: [
      stamp({
        id: 'v1',
        pet_id: mishti,
        condition_id: 'c1',
        visit_date: d(-635),
        clinic: 'Paws & Claws Clinic',
        vet_name: 'Dr. Rahman',
        reason: 'First check-up after rescue',
        diagnosis: 'Eye infection, mild dehydration',
        notes: 'Started eye drops. Weight 0.9 kg.',
        cost: 1200,
        currency: 'BDT',
      }) as Visit,
      stamp({
        id: 'v2',
        pet_id: bagha,
        condition_id: 'c2',
        visit_date: d(-30),
        clinic: 'City Pet Hospital',
        vet_name: 'Dr. Sultana',
        reason: 'Kidney follow-up',
        diagnosis: 'Stable, values slightly improved',
        notes: 'Continue supplement. Next blood test in 2 months.',
        cost: 2500,
        currency: 'BDT',
      }) as Visit,
      stamp({
        id: 'v3',
        pet_id: tommy,
        condition_id: 'c3',
        visit_date: d(-6),
        clinic: 'Paws & Claws Clinic',
        vet_name: 'Dr. Rahman',
        reason: 'Scratching and red skin',
        diagnosis: 'Allergic dermatitis, likely fleas',
        notes: 'Flea treatment given. Shampoo twice weekly.',
        cost: 900,
        currency: 'BDT',
      }) as Visit,
    ],
    medicines: [
      med({
        id: 'm1',
        pet_id: mishti,
        name: 'Fish oil',
        kind: 'supplement',
        dose: '1 pump in food',
        times: ['09:00'],
      }),
      med({
        id: 'm2',
        pet_id: mishti,
        name: 'Tricat vaccine (annual booster)',
        kind: 'vaccine',
        frequency: 'yearly',
        start_date: d(-353),
        next_due: d(12),
      }),
      med({
        id: 'm3',
        pet_id: mishti,
        name: 'Deworming tablet',
        kind: 'deworming',
        frequency: 'once',
        dose: '1/2 tablet',
        start_date: d(-90),
        next_due: d(0),
      }),
      med({
        id: 'm4',
        pet_id: bagha,
        condition_id: 'c2',
        visit_id: 'v2',
        name: 'Kidney support supplement',
        kind: 'supplement',
        frequency: 'twice_daily',
        dose: '1 capsule',
        times: ['08:00', '20:00'],
        start_date: d(-30),
        end_date: d(30),
        total_doses: 120,
      }),
      med({
        id: 'm5',
        pet_id: tommy,
        name: 'Rabies vaccine',
        kind: 'vaccine',
        frequency: 'yearly',
        start_date: d(-367),
        next_due: d(-2),
      }),
      med({
        id: 'm6',
        pet_id: tommy,
        condition_id: 'c3',
        visit_id: 'v3',
        name: 'Medicated shampoo bath',
        kind: 'medicine',
        frequency: 'weekly',
        times: ['18:00'],
        start_date: d(-6),
        end_date: d(22),
      }),
    ],
    dose_logs: [],
    reports: [
      stamp({
        id: 'r1',
        pet_id: bagha,
        visit_id: 'v2',
        condition_id: 'c2',
        title: 'Blood test (kidney panel)',
        kind: 'lab',
        report_date: d(-30),
        file_path: null,
        mime_type: null,
        extracted: null,
        extraction_confirmed: false,
        notes: 'Creatinine slightly high, stable since last test.',
      }) as Report,
      stamp({
        id: 'r2',
        pet_id: mishti,
        visit_id: null,
        condition_id: null,
        title: 'Vaccine card',
        kind: 'vaccine_card',
        report_date: d(-353),
        file_path: null,
        mime_type: null,
        extracted: null,
        extraction_confirmed: false,
        notes: null,
      }) as Report,
    ],
  };
}
