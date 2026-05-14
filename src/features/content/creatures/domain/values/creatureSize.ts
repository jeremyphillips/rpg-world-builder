export const CREATURE_SIZE_DEFINITIONS = [
  { id: 'tiny', name: 'Tiny' },
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
  { id: 'huge', name: 'Huge' },
  { id: 'gargantuan', name: 'Gargantuan' },
] as const

export type CreatureSizeId = (typeof CREATURE_SIZE_DEFINITIONS)[number]['id']
