import type { EnchantmentTemplate } from './enchantmentTemplates.types'

export const enhancementTemplates: EnchantmentTemplate[] = [
  {
    id: 'enhancement-plus-1',
    name: '+1 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    rarity: 'uncommon',
    cost: '1,500 gp',
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'bonus', target: 'attack', value: 1 },
        { kind: 'bonus', target: 'damage', value: 1 },
      ],
      armor:  [{ kind: 'bonus', target: 'armor_class', value: 1 }],
      shield: [{ kind: 'bonus', target: 'armor_class', value: 1 }],
    },
  },
  {
    id: 'enhancement-plus-2',
    name: '+2 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    rarity: 'rare',
    cost: '6,000 gp',
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'bonus', target: 'attack', value: 2 },
        { kind: 'bonus', target: 'damage', value: 2 },
      ],
      armor:  [{ kind: 'bonus', target: 'armor_class', value: 2 }],
      shield: [{ kind: 'bonus', target: 'armor_class', value: 2 }],
    },
  },
  {
    id: 'enhancement-plus-3',
    name: '+3 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    rarity: 'very-rare',
    cost: '24,000 gp',
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'bonus', target: 'attack', value: 3 },
        { kind: 'bonus', target: 'damage', value: 3 },
      ],
      armor:  [{ kind: 'bonus', target: 'armor_class', value: 3 }],
      shield: [{ kind: 'bonus', target: 'armor_class', value: 3 }],
    },
  },
]
