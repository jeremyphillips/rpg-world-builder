import type { EnchantmentTemplate } from './enchantmentTemplates.types'

export const enhancementTemplates: EnchantmentTemplate[] = [
  {
    id: 'enhancement-plus-1',
    name: '+1 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    editionData: [
      {
        edition: '5e',
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
        edition: '4e',
        cost: '360 gp',
        enhancementLevel: 1,
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
        edition: '3e',
        cost: '2,000 gp',
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
        edition: '2e',
        effectsBySlot: {
          weapon: [
            { kind: 'bonus', target: 'attack', value: 1 },
            { kind: 'bonus', target: 'damage', value: 1 },
          ],
          armor:  [{ kind: 'bonus', target: 'armor_class', value: 1 }],
          shield: [{ kind: 'bonus', target: 'armor_class', value: 1 }],
        },
      },
    ],
  },
  {
    id: 'enhancement-plus-2',
    name: '+2 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    editionData: [
      {
        edition: '5e',
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
        edition: '4e',
        cost: '1,800 gp',
        enhancementLevel: 6,
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
        edition: '3e',
        cost: '8,000 gp',
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
        edition: '2e',
        effectsBySlot: {
          weapon: [
            { kind: 'bonus', target: 'attack', value: 2 },
            { kind: 'bonus', target: 'damage', value: 2 },
          ],
          armor:  [{ kind: 'bonus', target: 'armor_class', value: 2 }],
          shield: [{ kind: 'bonus', target: 'armor_class', value: 2 }],
        },
      },
    ],
  },
  {
    id: 'enhancement-plus-3',
    name: '+3 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    editionData: [
      {
        edition: '5e',
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
      {
        edition: '4e',
        cost: '13,000 gp',
        enhancementLevel: 11,
        effectsBySlot: {
          weapon: [
            { kind: 'bonus', target: 'attack', value: 3 },
            { kind: 'bonus', target: 'damage', value: 3 },
          ],
          armor:  [{ kind: 'bonus', target: 'armor_class', value: 3 }],
          shield: [{ kind: 'bonus', target: 'armor_class', value: 3 }],
        },
      },
      {
        edition: '3e',
        cost: '18,000 gp',
        effectsBySlot: {
          weapon: [
            { kind: 'bonus', target: 'attack', value: 3 },
            { kind: 'bonus', target: 'damage', value: 3 },
          ],
          armor:  [{ kind: 'bonus', target: 'armor_class', value: 3 }],
          shield: [{ kind: 'bonus', target: 'armor_class', value: 3 }],
        },
      },
      {
        edition: '2e',
        effectsBySlot: {
          weapon: [
            { kind: 'bonus', target: 'attack', value: 3 },
            { kind: 'bonus', target: 'damage', value: 3 },
          ],
          armor:  [{ kind: 'bonus', target: 'armor_class', value: 3 }],
          shield: [{ kind: 'bonus', target: 'armor_class', value: 3 }],
        },
      },
    ],
  },
]
