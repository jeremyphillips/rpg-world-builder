export const MAGIC_SCHOOL_OPTIONS = [
  { 
    value: 'abjuration', 
    label: 'Abjuration', 
    description: 'Spells that protective in nature, creating barriers or banishing enemies.', 
    imageKey: '' 
  },
  { 
    value: 'conjuration', 
    label: 'Conjuration', 
    description: 'Spells that transport objects and creatures or create items out of thin air.', 
    imageKey: '' 
  },
  { 
    value: 'divination', 
    label: 'Divination', 
    description: 'Spells that reveal information, whether in the form of secrets or glimpses of the future.', 
    imageKey: '' 
  },
  { 
    value: 'enchantment', 
    label: 'Enchantment', 
    description: 'Spells that affect the minds of others, influencing or controlling their behavior.', 
    imageKey: '' 
  },
  { 
    value: 'evocation', 
    label: 'Evocation', 
    description: 'Spells that manipulate magical energy to produce a desired effect, often damaging elements.', 
    imageKey: '' 
  },
  { 
    value: 'illusion', 
    label: 'Illusion', 
    description: 'Spells that deceive the senses or minds of others.', 
    imageKey: '' 
  },
  { 
    value: 'necromancy', 
    label: 'Necromancy', 
    description: 'Spells that manipulate the forces of life and death.', 
    imageKey: '' 
  },
  { 
    value: 'transmutation', 
    label: 'Transmutation', 
    description: 'Spells that change the properties of a creature, object, or environment.', 
    imageKey: '' 
  },
] as const;

export type MagicSchool = (typeof MAGIC_SCHOOL_OPTIONS)[number]['value'];
