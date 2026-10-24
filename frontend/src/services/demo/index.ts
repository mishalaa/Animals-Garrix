import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Backend, SessionUser } from '../backend';
import { DEMO_USER, now, seedDemoData, stamp, type DemoDB } from './seed';
import type { Pet, PetTable, PetTables } from '@/types';

/**
 * Local-only backend used when Supabase isn't configured.
 * Data lives in AsyncStorage (localStorage on web) and starts with sample pets.
 */

const KEY = 'petpassport.demo.v1';
const USER: SessionUser = DEMO_USER;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let cache: DemoDB | null = null;
const listeners = new Set<(u: SessionUser | null) => void>();

async function load(): Promise<DemoDB> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as DemoDB) : seedDemoData();
  } catch {
    cache = seedDemoData();
  }
  return cache;
}

async function save() {
  if (!cache) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable: keep working in memory.
  }
}

function emit() {
  const user = cache?.signedIn ? USER : null;
  listeners.forEach((l) => l(user));
}

const live = <T extends { deleted_at?: string | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

// Files picked on web are blob: URLs that die on reload; store them as data URLs instead.
async function persistableUri(uri: string): Promise<string> {
  if (Platform.OS !== 'web' || uri.startsWith('data:')) return uri;
  const blob = await (await fetch(uri)).blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export const demoBackend: Backend = {
  mode: 'demo',

  async getUser() {
    const db = await load();
    return db.signedIn ? USER : null;
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async signIn() {
    const db = await load();
    db.signedIn = true;
    await save();
    emit();
  },
  async signUp(fullName) {
    const db = await load();
    db.signedIn = true;
    if (fullName) db.profile.full_name = fullName;
    await save();
    emit();
    return { needsConfirmation: false };
  },
  async signOut() {
    const db = await load();
    db.signedIn = false;
    await save();
    emit();
  },
  async getProfile() {
    return (await load()).profile;
  },
  async updateProfile(patch) {
    const db = await load();
    db.profile = { ...db.profile, ...patch };
    await save();
  },

  async listPets() {
    return live((await load()).pets);
  },
  async getPet(id) {
    return (await load()).pets.find((p) => p.id === id) ?? null;
  },
  async createPet(input) {
    const db = await load();
    const row = stamp({
      id: uid(),
      owner_id: USER.id,
      species: 'cat',
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
      ...input,
    }) as Pet;
    db.pets.push(row);
    await save();
    return row;
  },
  async updatePet(id, patch) {
    const db = await load();
    const i = db.pets.findIndex((p) => p.id === id);
    if (i < 0) throw new Error('Pet not found');
    db.pets[i] = { ...db.pets[i], ...patch, updated_at: now() };
    await save();
    return db.pets[i];
  },
  async deletePet(id) {
    await this.updatePet(id, { deleted_at: now() });
  },

  async getOrigin(petId) {
    return (await load()).origins.find((o) => o.pet_id === petId) ?? null;
  },
  async saveOrigin(origin) {
    const db = await load();
    const i = db.origins.findIndex((o) => o.pet_id === origin.pet_id);
    if (i >= 0) db.origins[i] = { ...db.origins[i], ...origin, updated_at: now() };
    else db.origins.push({ ...origin, created_at: now(), updated_at: now() });
    await save();
  },

  async list<T extends PetTable>(table: T, petId?: string) {
    const db = await load();
    const rows = live(db[table] as PetTables[T][]);
    const filtered = petId ? rows.filter((r) => r.pet_id === petId) : rows;
    return [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async insert<T extends PetTable>(table: T, row: Partial<PetTables[T]> & { pet_id: string }) {
    const db = await load();
    const full = stamp({ id: uid(), ...row }) as unknown as PetTables[T];
    (db[table] as PetTables[T][]).push(full);
    await save();
    return full;
  },
  async update<T extends PetTable>(table: T, id: string, patch: Partial<PetTables[T]>) {
    const db = await load();
    const rows = db[table] as PetTables[T][];
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('Record not found');
    rows[i] = { ...rows[i], ...patch, updated_at: now() };
    await save();
    return rows[i];
  },
  async remove(table, id) {
    await this.update(table, id, { deleted_at: now() } as never);
  },

  async uploadFile(_petId, file) {
    return await persistableUri(file.uri);
  },
  async fileUrl(path) {
    return path;
  },

  async listMembers(petId) {
    const db = await load();
    return [
      { pet_id: petId, user_id: USER.id, role: 'owner', email: USER.email, full_name: db.profile.full_name },
    ];
  },
  async sharePet() {
    throw new Error('demo-sharing');
  },
  async removeMember() {},

  async resetDemo() {
    const signedIn = cache?.signedIn ?? true;
    cache = { ...seedDemoData(), signedIn };
    await save();
  },
};
