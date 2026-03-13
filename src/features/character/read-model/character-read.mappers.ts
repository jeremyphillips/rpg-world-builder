/**
 * Character read-model mappers.
 * Transforms stored character documents to DTOs using pre-loaded references.
 */

import type { Coin } from '@/shared/money/types'
import { getSkillIds } from '@/features/character/domain/utils/character-proficiency.utils'
import type { AlignmentId } from '@/features/content/shared/domain/types'
import type { ProficiencyAdjustment } from '@/features/character/domain/types'
import type {
  CharacterCardSummary,
  CharacterClassReadSource,
  CharacterClassSummary,
  CharacterDetailDto,
  CharacterReadReferences,
} from './character-read.types'

const DEFAULT_ABILITY_SCORES = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
} as const

/** Stored character shape used as mapper input (card). */
export type CharacterDocForCard = {
  _id: { toString(): string }
  name: string
  type?: string
  imageKey?: string | null
  race?: string
  classes: CharacterClassReadSource[]
}

/** Stored character shape used as mapper input (detail). */
export type CharacterDocForDetail = {
  _id: { toString(): string }
  name: string
  type?: string
  imageKey?: string | null
  race?: string
  alignment?: string
  classes: CharacterClassReadSource[]
  totalLevel?: number
  abilityScores?: Record<string, number>
  proficiencies?: { skills?: Record<string, ProficiencyAdjustment> }
  equipment?: {
    armor?: string[]
    weapons?: string[]
    gear?: string[]
    magicItems?: string[]
  }
  wealth?: { gp?: number; sp?: number; cp?: number; baseBudget?: { coin: string; value: number } }
  hitPoints?: { total?: number; generationMethod?: string }
  armorClass?: { current?: number }
  combat?: { loadout?: { armorId?: string; shieldId?: string; mainHandWeaponId?: string; offHandWeaponId?: string } }
  spells?: string[]
  narrative?: {
    personalityTraits?: string[]
    ideals?: string
    bonds?: string
    flaws?: string
    backstory?: string
  }
  levelUpPending?: boolean
  pendingLevel?: number
  xp?: number
}

type ResolveImageUrl = (key: string) => string | undefined

/**
 * Map one stored character class entry to a display-ready class summary.
 * Resolves class/subclass names from references. Supports subclassId (current) and classDefinitionId (legacy).
 */
export function toCharacterClassSummary(
  cls: CharacterClassReadSource,
  refs: CharacterReadReferences,
): CharacterClassSummary {
  const classId = cls.classId ?? ''
  const subclassId = (cls.classDefinitionId ?? cls.subclassId) ?? null
  const classEntry = refs.classById.get(classId)
  const subclassEntry = subclassId ? refs.subclassById.get(subclassId) : null
  return {
    classId,
    className: classEntry?.name ?? classId,
    subclassId: subclassId ?? undefined,
    subclassName: subclassEntry?.name ?? undefined,
    level: cls.level ?? 1,
  }
}

/** Map character doc to card summary DTO. */
export function toCharacterCardSummary(
  char: CharacterDocForCard,
  campaign: { id: string; name: string } | null,
  refs: CharacterReadReferences,
  getPublicUrl: ResolveImageUrl,
): CharacterCardSummary {
  const charId = char._id.toString()
  const raceId = char.race ?? ''

  const classes = (char.classes ?? []).map((cls) => toCharacterClassSummary(cls, refs))

  const imageKey = char.imageKey ?? null
  return {
    id: charId,
    name: char.name ?? '',
    type: char.type,
    imageUrl: imageKey ? (getPublicUrl(imageKey) ?? null) : null,
    race: raceId ? { id: raceId, name: refs.raceById.get(raceId)?.name ?? raceId } : null,
    classes,
    campaign,
  }
}

/** Map character doc to detail DTO. */
export function toCharacterDetailDto(
  char: CharacterDocForDetail,
  campaigns: { id: string; name: string }[],
  refs: CharacterReadReferences,
  getPublicUrl: ResolveImageUrl,
): CharacterDetailDto {
  const charId = char._id.toString()
  const raceId = char.race ?? ''
  const raceEntry = raceId ? refs.raceById.get(raceId) : null

  const classes = (char.classes ?? []).map((cls) => toCharacterClassSummary(cls, refs))

  const skillIds = getSkillIds(char.proficiencies)
  const proficiencies = skillIds.map((id) => {
    const entry = refs.proficiencyById.get(id)
    return { id, name: entry?.name ?? id }
  })

  const armorIds = char.equipment?.armor ?? []
  const weaponIds = char.equipment?.weapons ?? []
  const gearIds = char.equipment?.gear ?? []

  const equipment = {
    armor: armorIds.map((id) => refs.itemById.get(id) ?? { id, name: id }),
    weapons: weaponIds.map((id) => refs.itemById.get(id) ?? { id, name: id }),
    gear: gearIds.map((id) => refs.itemById.get(id) ?? { id, name: id }),
    magicItems: char.equipment?.magicItems,
  }

  const rawScores = char.abilityScores ?? {}
  const abilityScores = {
    strength: rawScores.strength ?? DEFAULT_ABILITY_SCORES.strength,
    dexterity: rawScores.dexterity ?? DEFAULT_ABILITY_SCORES.dexterity,
    constitution: rawScores.constitution ?? DEFAULT_ABILITY_SCORES.constitution,
    intelligence: rawScores.intelligence ?? DEFAULT_ABILITY_SCORES.intelligence,
    wisdom: rawScores.wisdom ?? DEFAULT_ABILITY_SCORES.wisdom,
    charisma: rawScores.charisma ?? DEFAULT_ABILITY_SCORES.charisma,
  }

  const imageKey = char.imageKey ?? null
  return {
    id: charId,
    _id: charId,
    name: char.name ?? '',
    type: (char.type === 'npc' ? 'npc' : 'pc') as 'pc' | 'npc',
    imageUrl: imageKey ? (getPublicUrl(imageKey) ?? null) : null,
    imageKey: imageKey ?? null,
    race: raceId ? { id: raceId, name: raceEntry?.name ?? raceId } : null,
    classes,
    level: char.totalLevel ?? 1,
    totalLevel: char.totalLevel ?? 1,
    alignment: char.alignment ?? null,
    abilityScores,
    proficiencies,
    equipment,
    wealth: {
      gp: char.wealth?.gp,
      sp: char.wealth?.sp,
      cp: char.wealth?.cp,
      baseBudget: char.wealth?.baseBudget
        ? { coin: char.wealth.baseBudget.coin as Coin, value: char.wealth.baseBudget.value }
        : undefined,
    },
    hitPoints: {
      total: char.hitPoints?.total ?? 0,
      generationMethod: char.hitPoints?.generationMethod,
    },
    armorClass: {
      current: char.armorClass?.current ?? 10,
    },
    combat: char.combat,
    spells: char.spells,
    narrative: char.narrative,
    levelUpPending: char.levelUpPending,
    pendingLevel: char.pendingLevel,
    xp: char.xp,
    campaigns,
  }
}

/** Convert CharacterDetailDto to Character shape for engine/mechanics (buildCharacterContext, useCombatStats). */
export function toCharacterForEngine(dto: CharacterDetailDto): import('@/features/character/domain/types').Character & { _id?: string } {
  return {
    name: dto.name,
    type: dto.type,
    race: dto.race?.id,
    alignment: (dto.alignment ?? undefined) as AlignmentId | undefined,
    classes: dto.classes.map((c) => ({
      classId: c.classId,
      subclassId: c.subclassId ?? undefined,
      level: c.level,
    })),
    xp: dto.xp ?? 0,
    totalLevel: dto.totalLevel ?? dto.level,
    levelUpPending: dto.levelUpPending,
    pendingLevel: dto.pendingLevel,
    abilityScores: dto.abilityScores as import('@/features/mechanics/domain/core/character/abilities.types').AbilityScoreMapResolved,
    hitPoints: dto.hitPoints,
    armorClass: dto.armorClass,
    combat: dto.combat,
    proficiencies: {
      skills: Object.fromEntries(
        dto.proficiencies.map((p) => [p.id, { proficiencyLevel: 1 }]),
      ),
    },
    spells: dto.spells,
    equipment: {
      armor: dto.equipment.armor.map((a) => a.id),
      weapons: dto.equipment.weapons.map((w) => w.id),
      gear: dto.equipment.gear.map((g) => g.id),
      magicItems: dto.equipment.magicItems,
    },
    wealth: dto.wealth,
    narrative: dto.narrative,
    _id: dto.id,
  }
}
