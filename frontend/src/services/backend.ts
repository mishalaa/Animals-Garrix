import type { Member, NewRow, Origin, Pet, PetTable, PetTables, PickedFile, Profile, Role } from '@/types';

export interface SessionUser {
  id: string;
  email: string | null;
}

/**
 * Everything the screens need from storage. Two implementations exist:
 * - supabaseBackend: the real backend (when EXPO_PUBLIC_SUPABASE_* env vars are set)
 * - demoBackend: local-only sample data, so the app can be tried with no setup
 */
export interface Backend {
  mode: 'supabase' | 'demo';

  // Auth
  getUser(): Promise<SessionUser | null>;
  onAuthChange(cb: (user: SessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(fullName: string, email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  getProfile(): Promise<Profile | null>;
  updateProfile(patch: Partial<Pick<Profile, 'full_name' | 'language'>>): Promise<void>;

  // Pets
  listPets(): Promise<Pet[]>;
  getPet(id: string): Promise<Pet | null>;
  createPet(pet: Partial<NewRow<Pet>> & { name: string }): Promise<Pet>;
  updatePet(id: string, patch: Partial<Pet>): Promise<Pet>;
  deletePet(id: string): Promise<void>;

  // Origin (one per pet)
  getOrigin(petId: string): Promise<Origin | null>;
  saveOrigin(origin: Origin): Promise<void>;

  // Pet-scoped records
  list<T extends PetTable>(table: T, petId?: string): Promise<PetTables[T][]>;
  insert<T extends PetTable>(
    table: T,
    row: Partial<PetTables[T]> & { pet_id: string },
  ): Promise<PetTables[T]>;
  update<T extends PetTable>(table: T, id: string, patch: Partial<PetTables[T]>): Promise<PetTables[T]>;
  remove(table: PetTable, id: string): Promise<void>;

  // Files
  uploadFile(petId: string, file: PickedFile): Promise<string>;
  fileUrl(path: string): Promise<string | null>;

  // Sharing
  listMembers(petId: string): Promise<Member[]>;
  sharePet(petId: string, email: string, role: Exclude<Role, 'owner'>): Promise<void>;
  removeMember(petId: string, userId: string): Promise<void>;

  // Demo only
  resetDemo?(): Promise<void>;
}
