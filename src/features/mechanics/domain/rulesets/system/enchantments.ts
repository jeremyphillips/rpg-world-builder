/**
 * System enchantment catalog — code-defined enhancement templates per system ruleset.
 *
 * These are the "factory defaults" for enhancement templates (SRD_CC_v5_2_1).
 * Campaign-owned custom enchantments would be merged at runtime by the catalog.
 */
import type { EnchantmentTemplate } from '@/features/content/enchantments/domain/types';
import type { SystemRulesetId } from '../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds';

// ---------------------------------------------------------------------------
// 5e v1 system enhancement templates (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

export const SYSTEM_ENHANCEMENT_TEMPLATES: EnchantmentTemplate[] = [
  {
    id: 'enhancement-plus-1',
    name: '+1 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    rarity: 'uncommon',
    cost: {
      coin: 'gp',
      value: 1500,
    },
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1 },
        { kind: 'modifier', target: 'damage', mode: 'add', value: 1 },
      ],
      armor:  [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 1 }],
      shield: [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 1 }],
    },
  },
  {
    id: 'enhancement-plus-2',
    name: '+2 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    rarity: 'rare',
    cost: {
      coin: 'gp',
      value: 6000,
    },
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 2 },
        { kind: 'modifier', target: 'damage', mode: 'add', value: 2 },
      ],
      armor:  [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 2 }],
      shield: [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 2 }],
    },
  },
  {
    id: 'enhancement-plus-3',
    name: '+3 Enhancement',
    appliesTo: ['weapon', 'armor', 'shield'],
    rarity: 'very-rare',
    cost: {
      coin: 'gp',
      value: 24000,
    },
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 3 },
        { kind: 'modifier', target: 'damage', mode: 'add', value: 3 },
      ],
      armor:  [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 3 }],
      shield: [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 3 }],
    },
  },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const SYSTEM_ENHANCEMENT_TEMPLATES_BY_SYSTEM_ID: Record<SystemRulesetId, readonly EnchantmentTemplate[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_ENHANCEMENT_TEMPLATES,
};

export function getSystemEnchantmentTemplates(systemId: SystemRulesetId): readonly EnchantmentTemplate[] {
  return SYSTEM_ENHANCEMENT_TEMPLATES_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemEnchantmentTemplate(systemId: SystemRulesetId, id: string): EnchantmentTemplate | undefined {
  return getSystemEnchantmentTemplates(systemId).find(t => t.id === id);
}
