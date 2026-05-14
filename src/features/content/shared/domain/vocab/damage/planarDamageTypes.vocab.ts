/**
 * Planar, psychic, and force damage (SRD 5.2.1 *Damage Types*).
 */
export const PLANAR_DAMAGE_TYPES = [
  {
    id: 'radiant',
    name: 'Radiant',
    description:
      'Radiant damage is searing light and holy or celestial power (e.g. moonbeam, a deva weapon).',
  },
  {
    id: 'necrotic',
    name: 'Necrotic',
    description:
      'Necrotic damage withers life, flesh, and souls—often from undeath, decay, or void-like magic.',
  },
  {
    id: 'force',
    name: 'Force',
    description:
      'Force damage is pure magical energy, forming invisible walls and unerring blasts (e.g. magic missile).',
  },
  {
    id: 'psychic',
    name: 'Psychic',
    description:
      'Psychic damage assails the mind, emotions, and sanity (e.g. mind flayer attacks, dissonant whispers).',
  },
] as const;

export type PlanarDamageType = (typeof PLANAR_DAMAGE_TYPES)[number]['id'];

export const PLANAR_DAMAGE_TYPE_IDS = PLANAR_DAMAGE_TYPES.map((r) => r.id);
