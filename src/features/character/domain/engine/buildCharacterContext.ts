import type { Character } from '@/shared/types'
import type { AbilityScores, EquipmentLoadout } from '@/shared/types/character.core'
import type { EvaluationContext, CreatureSnapshot } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import { getClassProgression } from '@/features/mechanics/domain/classes/progression'
import { resolveLoadout, resolveWieldedWeaponIds } from '@/features/mechanics/domain/effects/sources/equipment-to-effects'

const ABILITY_KEYS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const

/**
 * Flatten ability scores to a record of numbers.
 * Null/undefined become 10 (no modifier).
 */
function flattenAbilities(scores?: AbilityScores | null): Record<keyof AbilityScores, number> {
  const result = {} as Record<keyof AbilityScores, number>
  for (const key of ABILITY_KEYS) {
    const v = scores?.[key]
    result[key] = v != null && typeof v === 'number' ? v : 10
  }
  return result
}

/**
 * Flatten equipment into the mechanics engine shape.
 * Uses resolveLoadout for backward-compatible loadout resolution.
 */
function flattenEquipment(character: Character): CreatureSnapshot['equipment'] {
  const loadout = resolveLoadout(character.combat)
  const ownedWeaponIds = character.equipment?.weapons ?? []
  const wielded = resolveWieldedWeaponIds(loadout, ownedWeaponIds)
  const mainHandId = wielded[0] ?? null

  return {
    armorEquipped: loadout.armorId ?? null,
    shieldEquipped: loadout.shieldId != null,
    weaponEquipped: mainHandId
      ? {
          id: mainHandId,
          category: '',
          properties: [],
        }
      : undefined,
  }
}

/**
 * Flatten resources from character.
 * Character model does not have a resources field; use empty for now.
 */
function flattenResources(_character: Character): Record<string, number> {
  return {}
}

/**
 * Extract conditions from character.
 * Character model does not have an explicit conditions field; use empty for now.
 */
function extractConditions(_character: Character): string[] {
  return []
}

/**
 * Compute flags (rage active, etc.).
 * Character model does not have explicit flags; use empty for now.
 */
function computeFlags(_character: Character): Record<string, boolean> {
  return {}
}

/**
 * Build EvaluationContext from Character.
 * Pure data mapping — no calculation.
 * Anti-corruption layer between Character model and mechanics engine.
 */
/**
 * Derive hit die from the primary (first) class.
 */
function deriveHitDie(character: Character): number {
  const primaryClass = character.classes?.[0]
  if (!primaryClass?.classId) return 8
  const prog = getClassProgression(primaryClass.classId)
  return prog?.hitDie ?? 8
}

export function buildCharacterContext(character: Character): EvaluationContext {
  const hp = character.hitPoints?.total ?? 0
  const hpMax = character.hitPoints?.total ?? 0
  const level = character.totalLevel ?? 1

  const self: CreatureSnapshot = {
    id: (character as { _id?: string })._id ?? character.name ?? 'unknown',
    level,
    hp: typeof hp === 'number' ? hp : 0,
    hpMax: typeof hpMax === 'number' ? hpMax : 0,
    hitDie: deriveHitDie(character),
    abilities: flattenAbilities(character.abilityScores),
    conditions: extractConditions(character),
    resources: flattenResources(character),
    equipment: flattenEquipment(character),
    flags: computeFlags(character),
  }

  return { self }
}

/**
 * Return a copy of the context with equipment state reflecting the given loadout.
 * Used by the loadout picker to evaluate conditions per-option.
 */
export function withLoadout(
  context: EvaluationContext,
  loadout: EquipmentLoadout,
): EvaluationContext {
  return {
    ...context,
    self: {
      ...context.self,
      equipment: {
        ...context.self.equipment,
        armorEquipped: loadout.armorId ?? null,
        shieldEquipped: loadout.shieldId != null,
      },
    },
  }
}
