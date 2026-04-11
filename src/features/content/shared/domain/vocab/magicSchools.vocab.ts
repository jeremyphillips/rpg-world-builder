export const MAGIC_SCHOOL_OPTIONS = [
  {
    id: 'abjuration',
    name: 'Abjuration',
    description:
      'Spells that protective in nature, creating barriers or banishing enemies.',
    imageKey: '',
  },
  {
    id: 'conjuration',
    name: 'Conjuration',
    description:
      'Spells that transport objects and creatures or create items out of thin air.',
    imageKey: '',
  },
  {
    id: 'divination',
    name: 'Divination',
    description:
      'Spells that reveal information, whether in the form of secrets or glimpses of the future.',
    imageKey: '',
  },
  {
    id: 'enchantment',
    name: 'Enchantment',
    description:
      'Spells that affect the minds of others, influencing or controlling their behavior.',
    imageKey: '',
  },
  {
    id: 'evocation',
    name: 'Evocation',
    description:
      'Spells that manipulate magical energy to produce a desired effect, often damaging elements.',
    imageKey: '',
  },
  {
    id: 'illusion',
    name: 'Illusion',
    description: 'Spells that deceive the senses or minds of others.',
    imageKey: '',
  },
  {
    id: 'necromancy',
    name: 'Necromancy',
    description: 'Spells that manipulate the forces of life and death.',
    imageKey: '',
  },
  {
    id: 'transmutation',
    name: 'Transmutation',
    description:
      'Spells that change the properties of a creature, object, or environment.',
    imageKey: '',
  },
] as const;

export type MagicSchool = (typeof MAGIC_SCHOOL_OPTIONS)[number]['id'];
