/**
 * Magic item → Effect[] translation layer.
 *
 * Reads flat core magic-item data (no edition indirection).
 * Each effect carries `source: 'magic_item:<id>'`.
 */
import type { Effect, ModifierEffect } from '../effects.types'
import type { StatTarget } from '../../resolution/stat-resolver'
import { getSystemMagicItems } from '@/features/mechanics/domain/core/rules/systemCatalog.magicItems'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'

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

function effectsForItem(item: { id: string; effects?: Array<{ kind: string; target?: string; value?: number }>; enhancementLevel?: number; slot: string }): Effect[] {
  const effects: Effect[] = []
  const source = `magic_item:${item.id}`

  if (item.effects) {
    for (const fx of item.effects) {
      if (fx.kind === 'bonus' && fx.value != null) {
        effects.push(bonusModifier(fx.target as StatTarget, fx.value, source))
      }
    }
  }

  if (effects.length === 0 && item.enhancementLevel && item.enhancementLevel > 0) {
    switch (item.slot) {
      case 'weapon':
        effects.push(bonusModifier('attack_roll', item.enhancementLevel, source))
        effects.push(bonusModifier('damage', item.enhancementLevel, source))
        break
      case 'armor':
      case 'shield':
        effects.push(bonusModifier('armor_class', item.enhancementLevel, source))
        break
    }
  }

  return effects
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
    const source = 'source' in e ? (e as { source?: string }).source : undefined
    if (!source?.startsWith('magic_item:')) return true

    const itemId = source.slice('magic_item:'.length)
    if (!equippedSet.has(itemId)) return false

    const item = magicItemsById.get(itemId)
    if (!item) return false

    if ((item as any).requiresAttunement && !attunedSet.has(itemId)) return false

    return true
  })
}
