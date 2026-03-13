export const MONSTER_TYPE_OPTIONS = [
  { id: 'aberration', name: 'Aberration' },
  { id: 'animal', name: 'Animal' },
  { id: 'beast', name: 'Beast' },
  { id: 'celestial', name: 'Celestial' },
  { id: 'construct', name: 'Construct' },
  { id: 'dragon', name: 'Dragon' },
  { id: 'elemental', name: 'Elemental' },
  { id: 'fey', name: 'Fey' },
  { id: 'fiend', name: 'Fiend' },
  { id: 'giant', name: 'Giant' },
  { id: 'humanoid', name: 'Humanoid' },
  { id: 'monstrosity', name: 'Monstrosity' },
  { id: 'ooze', name: 'Ooze' },
  { id: 'plant', name: 'Plant' },
  { id: 'undead', name: 'Undead' },
  { id: 'vermin', name: 'Vermin' },
] as const;

export type MonsterType = (typeof MONSTER_TYPE_OPTIONS)[number]['id'];

export const MONSTER_SIZE_CATEGORY_OPTIONS = [
  { id: 'tiny', name: 'Tiny' },
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
  { id: 'huge', name: 'Huge' },
  { id: 'gargantuan', name: 'Gargantuan' },
] as const;

export type MonsterSizeCategory = (typeof MONSTER_SIZE_CATEGORY_OPTIONS)[number]['id'];
