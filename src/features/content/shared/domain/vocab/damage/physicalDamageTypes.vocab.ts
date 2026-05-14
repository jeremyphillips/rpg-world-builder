/**
 * Physical weapon damage types (SRD 5.2.1 *Damage Types*).
 */
export const PHYSICAL_DAMAGE_TYPE_OPTIONS = [
  {
    id: 'bludgeoning',
    name: 'Bludgeoning',
    description:
      'Bludgeoning damage is delivered by a blunt instrument or a blow, fall, or constriction that does not use a cutting or piercing point.',
  },
  {
    id: 'piercing',
    name: 'Piercing',
    description:
      'Piercing damage is delivered by a strike that uses a point, such as a fang, arrow, or rapier.',
  },
  {
    id: 'slashing',
    name: 'Slashing',
    description:
      'Slashing damage is delivered by a cut from a sharp edge, such as an axe, claw, or greatsword.',
  },
] as const;

export type PhysicalDamageType = (typeof PHYSICAL_DAMAGE_TYPE_OPTIONS)[number]['id'];
