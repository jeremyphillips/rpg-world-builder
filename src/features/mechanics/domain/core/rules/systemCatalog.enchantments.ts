/**
 * System enchantment catalog — code-defined enhancement templates per system ruleset.
 *
 * These are the "factory defaults" for enhancement templates (SRD_CC_v5_2_1).
 * Campaign-owned custom enchantments would be merged at runtime by the catalog.
 */
import type { EnchantmentTemplate } from '@/features/content/shared/domain/types';
import type { SystemRulesetId } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';

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
        { kind: 'bonus', target: 'attack_roll', value: 1 },
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
    cost: {
      coin: 'gp',
      value: 6000,
    },
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'bonus', target: 'attack_roll', value: 2 },
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
    cost: {
      coin: 'gp',
      value: 24000,
    },
    requiresAttunement: false,
    effectsBySlot: {
      weapon: [
        { kind: 'bonus', target: 'attack_roll', value: 3 },
        { kind: 'bonus', target: 'damage', value: 3 },
      ],
      armor:  [{ kind: 'bonus', target: 'armor_class', value: 3 }],
      shield: [{ kind: 'bonus', target: 'armor_class', value: 3 }],
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
