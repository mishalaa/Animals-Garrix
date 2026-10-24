import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Backend, SessionUser } from './backend';
import type { Member, Origin, Pet, Profile } from '@/types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(url!, key!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return client;
}

const BUCKET = 'pet-files';

function toUser(u: { id: string; email?: string | null } | null | undefined): SessionUser | null {
  return u ? { id: u.id, email: u.email ?? null } : null;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const nowIso = () => new Date().toISOString();

export const supabaseBackend: Backend = {
  mode: 'supabase',

  async getUser() {
    const { data } = await sb().auth.getSession();
    return toUser(data.session?.user);
  },
  onAuthChange(cb) {
    const { data } = sb().auth.onAuthStateChange((_event, session) => cb(toUser(session?.user)));
    return () => data.subscription.unsubscribe();
  },
  async signIn(email, password) {
    const { error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },
  async signUp(fullName, email, password) {
    const { data, error } = await sb().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
    return { needsConfirmation: !data.session };
  },
  async signOut() {
    await sb().auth.signOut();
  },
  async getProfile() {
    const { data: auth } = await sb().auth.getUser();
    if (!auth.user) return null;
    const row = check(
      await sb().from('profiles').select('id, full_name, language').eq('id', auth.user.id).maybeSingle(),
    );
    return row ? ({ ...row, email: auth.user.email ?? null } as Profile) : null;
  },
  async updateProfile(patch) {
    const { data: auth } = await sb().auth.getUser();
    if (!auth.user) return;
    check(await sb().from('profiles').update(patch).eq('id', auth.user.id));
  },

  async listPets() {
    return check(
      await sb().from('pets').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
    ) as Pet[];
  },
  async getPet(id) {
    return check(await sb().from('pets').select('*').eq('id', id).maybeSingle()) as Pet | null;
  },
  async createPet(pet) {
    return check(await sb().from('pets').insert(pet).select().single()) as Pet;
  },
  async updatePet(id, patch) {
    return check(await sb().from('pets').update(patch).eq('id', id).select().single()) as Pet;
  },
  async deletePet(id) {
    check(await sb().from('pets').update({ deleted_at: nowIso() }).eq('id', id));
  },

  async getOrigin(petId) {
    return check(await sb().from('origins').select('*').eq('pet_id', petId).maybeSingle()) as Origin | null;
  },
  async saveOrigin(origin) {
    check(await sb().from('origins').upsert(origin, { onConflict: 'pet_id' }));
  },

  async list(table, petId) {
    let q = sb().from(table).select('*').is('deleted_at', null);
    if (petId) q = q.eq('pet_id', petId);
    return check(await q.order('created_at', { ascending: false })) as never;
  },
  async insert(table, row) {
    return check(
      await sb()
        .from(table)
        .insert(row as never)
        .select()
        .single(),
    ) as never;
  },
  async update(table, id, patch) {
    return check(
      await sb()
        .from(table)
        .update(patch as never)
        .eq('id', id)
        .select()
        .single(),
    ) as never;
  },
  async remove(table, id) {
    check(await sb().from(table).update({ deleted_at: nowIso() }).eq('id', id));
  },

  async uploadFile(petId, file) {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
    const path = `${petId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const body = await (await fetch(file.uri)).arrayBuffer();
    check(
      await sb()
        .storage.from(BUCKET)
        .upload(path, body, {
          contentType: file.mimeType ?? 'application/octet-stream',
          upsert: false,
        }),
    );
    return path;
  },
  async fileUrl(path) {
    const { data, error } = await sb()
      .storage.from(BUCKET)
      .createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data.signedUrl;
  },

  async listMembers(petId) {
    const rows = check(await sb().rpc('pet_members_detail', { p_pet: petId })) as Omit<Member, 'pet_id'>[];
    return rows.map((r) => ({ ...r, pet_id: petId }));
  },
  async sharePet(petId, email, role) {
    check(await sb().rpc('share_pet', { p_pet: petId, p_email: email, p_role: role }));
  },
  async removeMember(petId, userId) {
    check(await sb().from('pet_members').delete().eq('pet_id', petId).eq('user_id', userId));
  },
};
