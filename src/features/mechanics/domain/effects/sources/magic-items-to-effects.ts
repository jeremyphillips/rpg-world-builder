/**
 * Magic item → Effect[] translation layer.
 *
 * Reads flat core magic-item data (no edition indirection).
 * Each effect carries `source: 'magic_item:<id>'`.
 */
import type { Effect } from '../effects.types'
import { getSystemMagicItems } from '@/features/mechanics/domain/rulesets/system/magicItems'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import type { MagicItem } from '@/features/content/equipment/magicItems/domain/types'
import { effectSource, matchesSourceCategory, getSourceId } from '../source'

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

function effectsForItem(item: MagicItem): Effect[] {
  const source = effectSource('magic_item', item.id)
  const effects = item.effects ?? []

  return effects.map((effect) => ({
    ...effect,
    source: effect.source ?? source,
  }))
}

const systemMagicItems = getSystemMagicItems(DEFAULT_SYSTEM_RULESET_ID)
const magicItemsById = new Map(systemMagicItems.map(m => [m.id, m]))

/**
 * Produce candidate effects for ALL owned magic items.
 * Call `selectActiveMagicItemEffects` afterwards to narrow to the active set.
 */
export function getMagicItemCandidateEffects(
  magicItemIds: string[],
): Effect[] {
  if (magicItemIds.length === 0) return []

  const effects: Effect[] = []

  for (const id of magicItemIds) {
    const item = magicItemsById.get(id)
    if (!item) continue
    effects.push(...effectsForItem(item))
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
    if (!matchesSourceCategory(e.source, 'magic_item')) return true

    const itemId = getSourceId(e.source)
    if (!itemId || !equippedSet.has(itemId)) return false

    const item = magicItemsById.get(itemId)
    if (!item) return false

    if ((item as any).requiresAttunement && !attunedSet.has(itemId)) return false

    return true
  })
}
