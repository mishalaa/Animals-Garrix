import type { Backend } from './backend';
import { demoBackend } from './demo';
import { supabaseBackend, supabaseConfigured } from './supabase';

/** Supabase when EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set, otherwise demo data. */
export const api: Backend = supabaseConfigured ? supabaseBackend : demoBackend;

export type { Backend, SessionUser } from './backend';
