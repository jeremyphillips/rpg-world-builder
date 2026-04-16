import { resolveEquipmentLoadoutDetailed } from '@/features/mechanics/domain/equipment/loadout'
import type { Character, Wealth } from '@/features/character/domain/types'
import { getSkillIds } from '@/features/character/domain/utils/character-proficiency.utils'
import type { CharacterQueryContext } from './characterQueryContext.types'

/** Character as used by the mechanics engine / read model (may carry `id` / `_id`). */
export type CharacterQuerySource = Character & { _id?: string; id?: string }

function wealthToCp(wealth: Wealth | undefined): number {
  if (!wealth) return 0
  const gp = wealth.gp ?? 0
  const sp = wealth.sp ?? 0
  const cp = wealth.cp ?? 0
  return gp * 100 + sp * 10 + cp
}

function unionEquipmentIds(equipment: Character['equipment']): ReadonlySet<string> {
  const out = new Set<string>()
  for (const id of equipment?.weapons ?? []) out.add(id)
  for (const id of equipment?.armor ?? []) out.add(id)
  for (const id of equipment?.gear ?? []) out.add(id)
  for (const id of equipment?.magicItems ?? []) out.add(id)
  return out
}

export function createEmptyCharacterQueryContext(): CharacterQueryContext {
  return {
    identity: { id: '', name: '', type: 'pc', raceId: null, alignmentId: null },
    progression: {
      totalLevel: 0,
      classIds: new Set(),
      classLevelsById: new Map(),
      xp: 0,
      levelUpPending: false,
    },
    inventory: {
      weaponIds: new Set(),
      armorIds: new Set(),
      gearIds: new Set(),
      magicItemIds: new Set(),
      allEquipmentIds: new Set(),
    },
    proficiencies: { skillIds: new Set() },
    spells: { knownSpellIds: new Set() },
    economy: { totalWealthCp: 0 },
    combat: {
      equippedArmorId: null,
      equippedShieldId: null,
      equippedMainHandWeaponId: null,
      equippedOffHandWeaponId: null,
    },
  }
}

export function buildCharacterQueryContext(character: CharacterQuerySource): CharacterQueryContext {
  const id = character.id ?? character._id ?? ''
  const classLevelsById = new Map<string, number>()
  const classIds = new Set<string>()
  for (const c of character.classes) {
    const cid = c.classId
    if (!cid) continue
    classIds.add(cid)
    classLevelsById.set(cid, Math.max(classLevelsById.get(cid) ?? 0, c.level))
  }

  const resolved = resolveEquipmentLoadoutDetailed(character.combat, character.equipment)

  return {
    identity: {
      id,
      name: character.name,
      type: character.type,
      raceId: character.race ?? null,
      alignmentId: character.alignment ?? null,
    },
    progression: {
      totalLevel: character.totalLevel,
      classIds,
      classLevelsById,
      xp: character.xp,
      levelUpPending: character.levelUpPending ?? false,
    },
    inventory: {
      weaponIds: new Set(character.equipment?.weapons ?? []),
      armorIds: new Set(character.equipment?.armor ?? []),
      gearIds: new Set(character.equipment?.gear ?? []),
      magicItemIds: new Set(character.equipment?.magicItems ?? []),
      allEquipmentIds: unionEquipmentIds(character.equipment),
    },
    proficiencies: {
      skillIds: new Set(getSkillIds(character.proficiencies)),
    },
    spells: {
      knownSpellIds: new Set(character.spells ?? []),
    },
    economy: {
      totalWealthCp: wealthToCp(character.wealth),
    },
    combat: {
      equippedArmorId: resolved.armor.baseId ?? null,
      equippedShieldId: resolved.shield.baseId ?? null,
      equippedMainHandWeaponId: resolved.mainHand.baseId ?? null,
      equippedOffHandWeaponId: resolved.offHand.baseId ?? null,
    },
  }
}
