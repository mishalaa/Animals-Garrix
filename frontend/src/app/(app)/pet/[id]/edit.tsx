import { useLocalSearchParams } from 'expo-router';

import { PetForm } from '@/components/pet/PetForm';
import { Loading } from '@/components/ui';
import { useOrigin, usePet } from '@/hooks/queries';

export default function EditPet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePet(id);
  const origin = useOrigin(id);
  if (pet.isLoading || origin.isLoading || !pet.data) return <Loading />;
  return <PetForm pet={pet.data} origin={origin.data} />;
}
