import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services';
import type { Origin, Pet, PetTable, PetTables } from '@/types';

export const keys = {
  pets: ['pets'] as const,
  pet: (id: string) => ['pet', id] as const,
  origin: (id: string) => ['origin', id] as const,
  table: (t: PetTable, petId?: string) => ['table', t, petId ?? 'all'] as const,
  profile: ['profile'] as const,
  members: (id: string) => ['members', id] as const,
  file: (path: string) => ['file', path] as const,
};

export function usePets() {
  return useQuery({ queryKey: keys.pets, queryFn: () => api.listPets() });
}

export function usePet(id: string | undefined) {
  return useQuery({
    queryKey: keys.pet(id ?? ''),
    queryFn: () => api.getPet(id!),
    enabled: !!id,
  });
}

export function useOrigin(petId: string | undefined) {
  return useQuery({
    queryKey: keys.origin(petId ?? ''),
    queryFn: () => api.getOrigin(petId!),
    enabled: !!petId,
  });
}

export function useRecords<T extends PetTable>(table: T, petId?: string) {
  return useQuery({
    queryKey: keys.table(table, petId),
    queryFn: () => api.list(table, petId),
  });
}

export function useProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: () => api.getProfile() });
}

export function useMembers(petId: string | undefined) {
  return useQuery({
    queryKey: keys.members(petId ?? ''),
    queryFn: () => api.listMembers(petId!),
    enabled: !!petId,
  });
}

/** Signed URL (Supabase) or stored data URL (demo) for a file path. */
export function useFileUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: keys.file(path ?? ''),
    queryFn: () => api.fileUrl(path!),
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
  });
}

export function useSavePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      pet: Partial<Pet> & { name: string };
      origin?: Omit<Origin, 'pet_id'>;
    }) => {
      const pet = input.id ? await api.updatePet(input.id, input.pet) : await api.createPet(input.pet);
      if (input.origin) await api.saveOrigin({ ...input.origin, pet_id: pet.id });
      return pet;
    },
    onSuccess: (pet) => {
      qc.invalidateQueries({ queryKey: keys.pets });
      qc.invalidateQueries({ queryKey: keys.pet(pet.id) });
      qc.invalidateQueries({ queryKey: keys.origin(pet.id) });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.pets }),
  });
}

/** Insert or update a record in one of the pet tables, then refresh its lists. */
export function useSaveRecord<T extends PetTable>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; row: Partial<PetTables[T]> & { pet_id: string } }) =>
      input.id ? api.update(table, input.id, input.row) : api.insert(table, input.row),
    onSuccess: () => invalidateTable(qc, table),
  });
}

export function useRemoveRecord(table: PetTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(table, id),
    onSuccess: () => invalidateTable(qc, table),
  });
}

export function invalidateTable(qc: ReturnType<typeof useQueryClient>, table: PetTable) {
  return qc.invalidateQueries({ queryKey: ['table', table] });
}
