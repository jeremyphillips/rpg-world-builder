/**
 * Enchantment template → Effect[] translation layer.
 *
 * Accepts a pre-resolved ResolvedEquipmentLoadout so that instance lookup
 * is handled in one place (resolveEquipmentLoadoutDetailed).
 */
import type { Effect } from '../effects.types'
import type { EnchantableSlot } from '@/features/content/shared/domain/types'
import { enchantmentRepo } from '@/features/content/shared/domain/repo/enchantmentRepo'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'
import { resolveEffectDescriptors } from '../descriptors/resolveEffectDescriptors'
import type { ResolvedEquipmentLoadout, ResolvedSlot } from './equipment-to-effects'

// ---------------------------------------------------------------------------
// Slot mapping
// ---------------------------------------------------------------------------

type SlotEnhancementEntry = {
  slot: EnchantableSlot
  templateId: string | undefined
}

function getSlotEntries(resolved: ResolvedEquipmentLoadout): SlotEnhancementEntry[] {
  const slotMap: [EnchantableSlot, ResolvedSlot][] = [
    ['weapon', resolved.mainHand],
    ['armor', resolved.armor],
    ['shield', resolved.shield],
  ]

  return slotMap.map(([slot, rs]) => ({
    slot,
    templateId: rs.enhancementTemplateId,
  }))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Produce effects for all enchantments currently active in the loadout.
 * Slots without an enhancement produce no effects.
 */
export function getEnchantmentCandidateEffects(args: {
  resolved: ResolvedEquipmentLoadout
}): Effect[] {
  const { resolved } = args
  const templates = enchantmentRepo.listSystem(DEFAULT_SYSTEM_RULESET_ID);
  const effects: Effect[] = []

  const slotSourceLabel: Record<EnchantableSlot, string> = {
    weapon: 'magic',
    armor: 'magic_armor',
    shield: 'magic_shield',
  }

  for (const { slot, templateId } of getSlotEntries(resolved)) {
    if (!templateId) continue

    const template = templates.find(t => t.id === templateId)
    if (!template) continue

    const descriptors = template.effectsBySlot[slot]
    if (!descriptors || descriptors.length === 0) continue

    effects.push(
      ...resolveEffectDescriptors(descriptors, {
        source: slotSourceLabel[slot],
        label: template.name,
      }),
    )
  }

  return effects
}
