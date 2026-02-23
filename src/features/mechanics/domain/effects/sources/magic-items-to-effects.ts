/**
 * Magic item → Effect[] translation layer.
 *
 * When an item's edition datum carries structured `effects` descriptors,
 * those are resolved via `resolveEffectDescriptors`.  Otherwise the
 * Phase 1 fallback derives effects from `datum.bonus` + `item.slot`.
 *
 * Each effect carries `source: 'magic_item:<id>'`.
 */
import type { Effect, ModifierEffect } from '../effects.types'
import type { StatTarget } from '../../resolution/stat-resolver'
import { equipment as equipmentCatalog } from '@/data'
import type { MagicItem, MagicItemEditionDatum } from '@/data/equipment/magicItems.types'
import { resolveEquipmentEdition } from '@/features/equipment/domain'
import { resolveEffectDescriptors } from '../descriptors/resolveEffectDescriptors'

// ---------------------------------------------------------------------------
// Magic item loadout (minimal — no UI for equip/attune yet)
// ---------------------------------------------------------------------------

export type MagicItemLoadout = {
  equippedIds: string[]
  attunedIds: string[]
}

// ---------------------------------------------------------------------------
// Candidate effects (all owned magic items)
// ---------------------------------------------------------------------------

function bonusModifier(
  target: StatTarget,
  bonus: number,
  source: string,
): ModifierEffect {
  return { kind: 'modifier', target, mode: 'add', value: bonus, source }
}

function effectsForItem(item: MagicItem, datum: MagicItemEditionDatum): Effect[] {
  const bonus = datum.bonus
  if (bonus == null || bonus === 0) return []

  const source = `magic_item:${item.id}`
  const effects: Effect[] = []

  switch (item.slot) {
    case 'weapon':
      effects.push(bonusModifier('attack_roll', bonus, source))
      effects.push(bonusModifier('damage', bonus, source))
      break

    case 'armor':
    case 'shield':
      effects.push(bonusModifier('armor_class', bonus, source))
      break
  }

  return effects
}

/**
 * Produce candidate effects for ALL owned magic items.
 * Call `selectActiveMagicItemEffects` afterwards to narrow to the active set.
 *
 * If an item's edition datum has structured `effects`, those take priority.
 * Otherwise the Phase 1 fallback derives effects from `datum.bonus` + `item.slot`.
 */
export function getMagicItemCandidateEffects(
  magicItemIds: string[],
  edition: string,
): Effect[] {
  if (magicItemIds.length === 0) return []

  const resolved = resolveEquipmentEdition(edition)
  const effects: Effect[] = []

  for (const id of magicItemIds) {
    const item = equipmentCatalog.magicItems.find((m: MagicItem) => m.id === id)
    if (!item) continue

    const datum = item.editionData.find(d => d.edition === resolved)
    if (!datum) continue

    if (datum.effects && datum.effects.length > 0) {
      effects.push(
        ...resolveEffectDescriptors(datum.effects, {
          source: `magic_item:${item.id}`,
          label: item.name,
        }),
      )
    } else {
      effects.push(...effectsForItem(item, datum))
    }
  }

  return effects
}

// ---------------------------------------------------------------------------
// Active selection filter
// ---------------------------------------------------------------------------

/**
 * Filter candidate magic item effects to only those currently equipped
 * (and attuned, if the item requires it).
 */
export function selectActiveMagicItemEffects(
  candidateEffects: Effect[],
  loadout: MagicItemLoadout,
): Effect[] {
  const equippedSet = new Set(loadout.equippedIds)
  const attunedSet = new Set(loadout.attunedIds)

  return candidateEffects.filter(e => {
    const source = 'source' in e ? (e as { source?: string }).source : undefined
    if (!source?.startsWith('magic_item:')) return true

    const itemId = source.slice('magic_item:'.length)
    if (!equippedSet.has(itemId)) return false

    const item = equipmentCatalog.magicItems.find((m: MagicItem) => m.id === itemId)
    if (!item) return false

    const datum = item.editionData.find(d => d.edition !== undefined) as MagicItemEditionDatum | undefined
    if (datum?.requiresAttunement && !attunedSet.has(itemId)) return false

    return true
  })
}
