import { useMemo } from 'react';

import type { Allergy, Condition, DoseLog, Medicine, Origin, Pet, Report, Visit } from '@/types';

/** Everything recorded about one pet, as used by the profile tabs and the vet summary. */
export interface PetData {
  pet: Pet;
  origin: Origin | null;
  conditions: Condition[];
  allergies: Allergy[];
  visits: Visit[];
  medicines: Medicine[];
  logs: DoseLog[];
  reports: Report[];
}

/** Combine the separate record queries into one PetData object (null until the pet loads). */
export function usePetData(d: Partial<Omit<PetData, 'pet'>> & { pet?: Pet | null }): PetData | null {
  return useMemo(() => {
    if (!d.pet) return null;
    return {
      pet: d.pet,
      origin: d.origin ?? null,
      conditions: d.conditions ?? [],
      allergies: d.allergies ?? [],
      visits: d.visits ?? [],
      medicines: d.medicines ?? [],
      logs: d.logs ?? [],
      reports: d.reports ?? [],
    };
  }, [d.pet, d.origin, d.conditions, d.allergies, d.visits, d.medicines, d.logs, d.reports]);
}
