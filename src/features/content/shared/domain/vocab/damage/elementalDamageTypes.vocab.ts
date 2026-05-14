/**
 * Elemental and nature-adjacent energy damage (SRD 5.2.1 *Damage Types*).
 */
export const ELEMENTAL_DAMAGE_TYPES = [
  {
    id: 'fire',
    name: 'Fire',
    description:
      'Fire damage is delivered by heat and flame, whether mundane or magical (e.g. red dragon breath, fire bolt).',
  },
  {
    id: 'cold',
    name: 'Cold',
    description:
      'Cold damage is delivered by ice, freezing vapor, and other numbing, frostbite-inducing effects.',
  },
  {
    id: 'acid',
    name: 'Acid',
    description:
      'Acid damage is delivered by corrosive substances and dissolving attacks (e.g. black dragon breath, some oozes).',
  },
  {
    id: 'lightning',
    name: 'Lightning',
    description:
      'Lightning damage is delivered by raw electrical energy (e.g. blue dragon breath, lightning bolt).',
  },
  {
    id: 'thunder',
    name: 'Thunder',
    description:
      'Thunder damage is delivered by concussive sound and vibratory force (e.g. thunderwave).',
  },
  {
    id: 'poison',
    name: 'Poison',
    description:
      'Poison damage is delivered by venom, toxic gas, and other caustic or biological toxins.',
  },
] as const;

export type ElementalDamageType = (typeof ELEMENTAL_DAMAGE_TYPES)[number]['id'];

export const ELEMENTAL_DAMAGE_TYPE_IDS = ELEMENTAL_DAMAGE_TYPES.map((r) => r.id);
