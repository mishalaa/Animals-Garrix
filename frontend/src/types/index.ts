// Row types mirror supabase/migrations/20261019000000_init.sql

export type Species = 'cat' | 'dog' | 'bird' | 'rabbit' | 'other';
export type Sex = 'male' | 'female' | 'unknown';
export type Role = 'owner' | 'editor' | 'viewer';

interface Timestamps {
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Pet extends Timestamps {
  id: string;
  owner_id: string;
  name: string;
  species: Species;
  breed: string | null;
  breed_mix: string | null;
  coat_type: string | null;
  coat_pattern: string | null;
  sex: Sex;
  birth_date: string | null;
  birth_date_estimated: boolean;
  weight_kg: number | null;
  neutered: boolean | null;
  microchip: string | null;
  distinguishing_marks: string | null;
  photo_path: string | null;
}

export type OriginSource =
  'street_rescue' | 'shelter' | 'breeder' | 'pet_shop' | 'gift' | 'born_at_home' | 'other';

export interface Origin {
  pet_id: string;
  source: OriginSource;
  found_location: string | null;
  found_lat: number | null;
  found_lng: number | null;
  acquired_date: string | null;
  condition_at_rescue: string | null;
  rescuer_or_shelter: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ConditionKind = 'illness' | 'chronic' | 'injury' | 'surgery';
export type ConditionStatus = 'active' | 'managed' | 'resolved';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface Condition extends Timestamps {
  id: string;
  pet_id: string;
  name: string;
  kind: ConditionKind;
  status: ConditionStatus;
  severity: Severity | null;
  diagnosed_on: string | null;
  resolved_on: string | null;
  symptoms: string | null;
  treatment: string | null;
  diagnosed_by: string | null;
  pre_adoption: boolean;
  notes: string | null;
}

export type AllergyKind = 'food' | 'medicine' | 'environment' | 'other';

export interface Allergy extends Timestamps {
  id: string;
  pet_id: string;
  allergen: string;
  kind: AllergyKind;
  reaction: string | null;
}

export interface Visit extends Timestamps {
  id: string;
  pet_id: string;
  condition_id: string | null;
  visit_date: string;
  clinic: string | null;
  vet_name: string | null;
  reason: string | null;
  diagnosis: string | null;
  notes: string | null;
  cost: number | null;
  currency: string;
}

export type MedicineKind = 'medicine' | 'vaccine' | 'deworming' | 'flea_tick' | 'supplement';
export type Frequency = 'once' | 'daily' | 'twice_daily' | 'weekly' | 'monthly' | 'yearly';

export interface Medicine extends Timestamps {
  id: string;
  pet_id: string;
  visit_id: string | null;
  condition_id: string | null;
  name: string;
  kind: MedicineKind;
  dose: string | null;
  frequency: Frequency;
  times: string[];
  start_date: string;
  end_date: string | null;
  total_doses: number | null;
  next_due: string | null;
  notes: string | null;
  active: boolean;
}

export interface DoseLog extends Timestamps {
  id: string;
  pet_id: string;
  medicine_id: string;
  scheduled_for: string;
  status: 'done' | 'skipped';
  logged_by: string | null;
}

export type ReportKind = 'lab' | 'xray' | 'prescription' | 'vaccine_card' | 'invoice' | 'other';

export interface Report extends Timestamps {
  id: string;
  pet_id: string;
  visit_id: string | null;
  condition_id: string | null;
  title: string;
  kind: ReportKind;
  report_date: string;
  file_path: string | null;
  mime_type: string | null;
  extracted: Record<string, unknown> | null;
  extraction_confirmed: boolean;
  notes: string | null;
}

export interface Member {
  pet_id: string;
  user_id: string;
  role: Role;
  email?: string | null;
  full_name?: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  language: 'en' | 'bn';
}

// Tables holding many rows per pet.
export interface PetTables {
  conditions: Condition;
  allergies: Allergy;
  visits: Visit;
  medicines: Medicine;
  dose_logs: DoseLog;
  reports: Report;
}
export type PetTable = keyof PetTables;

export type NewRow<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string | null;
}
