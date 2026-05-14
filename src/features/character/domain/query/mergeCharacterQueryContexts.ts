import type { CharacterQueryContext } from './characterQueryContext.types'
import { createEmptyCharacterQueryContext } from './buildCharacterQueryContext'

function unionSets(sets: ReadonlySet<string>[]): Set<string> {
  const out = new Set<string>()
  for (const s of sets) {
    for (const id of s) out.add(id)
  }
  return out
}

function mergeClassLevels(maps: ReadonlyMap<string, number>[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of maps) {
    for (const [classId, level] of m) {
      out.set(classId, Math.max(out.get(classId) ?? 0, level))
    }
  }
  return out
}

export function mergeCharacterQueryContexts(contexts: CharacterQueryContext[]): CharacterQueryContext {
  if (contexts.length === 0) return createEmptyCharacterQueryContext()
  if (contexts.length === 1) return contexts[0]!

  const first = contexts[0]!
  const combatMerged = {
    equippedArmorId: null as string | null,
    equippedShieldId: null as string | null,
    equippedMainHandWeaponId: null as string | null,
    equippedOffHandWeaponId: null as string | null,
  }
  const totalWealthCp = contexts.reduce((sum, c) => sum + c.economy.totalWealthCp, 0)
  const totalLevel = Math.max(...contexts.map((c) => c.progression.totalLevel), 0)
  const xp = contexts.reduce((sum, c) => sum + c.progression.xp, 0)
  const levelUpPending = contexts.some((c) => c.progression.levelUpPending)
  const type = contexts.some((c) => c.identity.type === 'pc') ? 'pc' : 'npc'

  return {
    identity: {
      id: first.identity.id,
      name: first.identity.name,
      type,
      raceId: first.identity.raceId,
      alignmentId: first.identity.alignmentId,
    },
    progression: {
      totalLevel,
      classIds: unionSets(contexts.map((c) => c.progression.classIds)),
      classLevelsById: mergeClassLevels(contexts.map((c) => c.progression.classLevelsById)),
      xp,
      levelUpPending,
    },
    inventory: {
      weaponIds: unionSets(contexts.map((c) => c.inventory.weaponIds)),
      armorIds: unionSets(contexts.map((c) => c.inventory.armorIds)),
      gearIds: unionSets(contexts.map((c) => c.inventory.gearIds)),
      magicItemIds: unionSets(contexts.map((c) => c.inventory.magicItemIds)),
      allEquipmentIds: unionSets(contexts.map((c) => c.inventory.allEquipmentIds)),
    },
    proficiencies: {
      skillIds: unionSets(contexts.map((c) => c.proficiencies.skillIds)),
    },
    spells: {
      knownSpellIds: unionSets(contexts.map((c) => c.spells.knownSpellIds)),
    },
    economy: { totalWealthCp },
    combat: combatMerged,
  }
}
