import { router } from 'expo-router';

import { parseISODate, today } from '@/lib/dates';
import type { Medicine, Pet } from '@/types';

/** Open one of the pet record forms, e.g. openPetForm(pet, 'visit', visitId). */
export const openPetForm = (pet: Pet, form: string, itemId?: string) =>
  router.push(itemId ? `/pet/${pet.id}/${form}?itemId=${itemId}` : `/pet/${pet.id}/${form}`);

/** Newest first by a YYYY-MM-DD field. */
export const byDateDesc = <T>(rows: T[], key: (r: T) => string | null) =>
  [...rows].sort((a, b) => (key(b) ?? '').localeCompare(key(a) ?? ''));

/** Has this medicine's course finished? */
export function ended(m: Medicine) {
  const end = parseISODate(m.end_date);
  return !!end && end < today();
}
