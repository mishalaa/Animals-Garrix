import type { Species } from '@/types';

/**
 * Breed list with commonly reported health watch-points.
 * These are general prompts to discuss with a vet, not diagnoses.
 */
export interface Breed {
  name: string;
  risks?: string[];
}

const LOCAL: Breed = {
  name: 'Local / Deshi',
  risks: ['Generally hardy; keep vaccines and deworming up to date'],
};
const MIXED: Breed = { name: 'Mixed' };

export const BREEDS: Record<Species, Breed[]> = {
  cat: [
    LOCAL,
    MIXED,
    {
      name: 'Persian',
      risks: [
        'Breathing problems (flat face)',
        'Polycystic kidney disease',
        'Heat sensitivity',
        'Eye discharge',
      ],
    },
    {
      name: 'Himalayan',
      risks: ['Breathing problems (flat face)', 'Polycystic kidney disease', 'Heat sensitivity'],
    },
    { name: 'Exotic Shorthair', risks: ['Breathing problems (flat face)', 'Heat sensitivity'] },
    { name: 'Siamese', risks: ['Dental disease', 'Respiratory infections'] },
    { name: 'Maine Coon', risks: ['Heart disease (HCM)', 'Hip dysplasia', 'Heat sensitivity (long coat)'] },
    { name: 'British Shorthair', risks: ['Heart disease (HCM)', 'Weight gain'] },
    { name: 'Bengal', risks: ['Heart disease (HCM)', 'Sensitive digestion'] },
    { name: 'Ragdoll', risks: ['Heart disease (HCM)', 'Bladder stones'] },
    { name: 'Scottish Fold', risks: ['Joint and cartilage problems'] },
    { name: 'Sphynx', risks: ['Skin care needs', 'Heart disease (HCM)', 'Sunburn'] },
    {
      name: 'Siberian / Neva Masquerade',
      risks: ['Heat sensitivity in hot, humid climates', 'Heart disease (HCM)'],
    },
    { name: 'Turkish Angora', risks: ['Deafness in white cats', 'Heat sensitivity (long coat)'] },
  ],
  dog: [
    LOCAL,
    MIXED,
    { name: 'German Shepherd', risks: ['Hip and elbow dysplasia', 'Bloat'] },
    { name: 'Labrador Retriever', risks: ['Weight gain', 'Hip dysplasia', 'Ear infections'] },
    { name: 'Golden Retriever', risks: ['Hip dysplasia', 'Skin allergies', 'Cancer risk in older dogs'] },
    { name: 'Siberian Husky', risks: ['Heat stroke in hot climates', 'Eye conditions'] },
    { name: 'Pug', risks: ['Breathing problems (flat face)', 'Heat stroke', 'Eye injuries'] },
    { name: 'Bulldog', risks: ['Breathing problems (flat face)', 'Heat stroke', 'Skin fold infections'] },
    { name: 'Shih Tzu', risks: ['Eye problems', 'Breathing problems', 'Dental disease'] },
    { name: 'Pomeranian', risks: ['Dental disease', 'Collapsing trachea', 'Kneecap problems'] },
    { name: 'Beagle', risks: ['Weight gain', 'Ear infections'] },
    { name: 'Rottweiler', risks: ['Hip and elbow dysplasia', 'Heat sensitivity'] },
    { name: 'Spitz', risks: ['Dental disease', 'Heat sensitivity (thick coat)'] },
    { name: 'Dachshund', risks: ['Back (spinal disc) problems', 'Weight gain'] },
  ],
  bird: [MIXED, { name: 'Budgerigar' }, { name: 'Cockatiel' }, { name: 'Lovebird' }, { name: 'Pigeon' }],
  rabbit: [
    MIXED,
    { name: 'Dutch' },
    { name: 'Lionhead' },
    { name: 'Mini Lop' },
    { name: 'Netherland Dwarf' },
  ],
  other: [MIXED],
};

export function breedRisks(species: Species, breed: string | null): string[] {
  if (!breed) return [];
  return BREEDS[species]?.find((b) => b.name === breed)?.risks ?? [];
}
