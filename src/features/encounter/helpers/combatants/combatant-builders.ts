import type { useCombatStats } from '@/features/character/hooks'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { ImmunityType, CreatureResistanceDamageType } from '@/features/mechanics/domain/creatures/immunities.types'
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import {
  CONDITION_IMMUNITY_ONLY_IDS,
  DAMAGE_IMPLIES_CONDITION,
  EFFECT_CONDITION_IDS,
  type ConditionImmunityId,
} from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { Effect, EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { resolveProficiencyContribution } from '@/features/mechanics/domain/progression'
import {
  type CombatActionDefinition,
  type CombatantAttackEntry,
  type CombatantInstance,
  type CombatantSide,
  type CombatantSkillProficiencyLevel,
  type DamageResistanceMarker,
  createCombatTurnResources,
  type RuntimeTurnHook,
} from '@/features/mechanics/domain/encounter'

import { deriveHideEligibilityFeatureFlagsFromCharacterDetail } from './derive-hide-eligibility-from-authored'
import { getCombatantPortraitImageKey } from './getCombatantPortraitImageKey'

const CONDITION_IDS: ReadonlySet<string> = new Set<EffectConditionId>(EFFECT_CONDITION_IDS)

const CONDITION_ADJACENT_IMMUNITIES: ReadonlySet<string> = new Set(CONDITION_IMMUNITY_ONLY_IDS)

function partitionMonsterImmunities(immunities: ImmunityType[]): {
  damageImmunities: DamageResistanceMarker[]
  conditionImmunities: ConditionImmunityId[]
} {
  const damageImmunities: DamageResistanceMarker[] = []
  const conditionSeen = new Set<ConditionImmunityId>()

  for (const entry of immunities) {
    if (CONDITION_IDS.has(entry) || CONDITION_ADJACENT_IMMUNITIES.has(entry)) {
      conditionSeen.add(entry as ConditionImmunityId)
    } else {
      damageImmunities.push({
        id: `monster-immunity-${entry}`,
        damageType: entry,
        level: 'immunity',
        sourceId: 'monster-innate',
        label: `immunity to ${entry}`,
      })
      const implied = DAMAGE_IMPLIES_CONDITION[entry]
      if (implied) conditionSeen.add(implied)
    }
  }

  return { damageImmunities, conditionImmunities: [...conditionSeen] }
}

function mapMonsterResistances(resistances: CreatureResistanceDamageType[]): DamageResistanceMarker[] {
  return resistances.map((r) => ({
    id: `monster-resistance-${r}`,
    damageType: r,
    level: 'resistance' as const,
    sourceId: 'monster-innate',
    label: `resistance to ${r}`,
  }))
}

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value)
}

function normalizeMonsterSkillProficiencyLevel(level: unknown): CombatantSkillProficiencyLevel {
  if (level === 2) return 2
  if (level === 1) return 1
  return 0
}

function maxDarkvisionRangeFtFromMonsterSenses(monster: Monster): number | undefined {
  const special = monster.mechanics.senses?.special
  if (!special?.length) return undefined
  let max = 0
  for (const s of special) {
    if (s.type === 'darkvision' && typeof s.range === 'number' && s.range > max) max = s.range
  }
  return max > 0 ? max : undefined
}

/** Detail DTO lists skill ids only; expertise (level 2) is not represented until the API carries it. */
function skillProficiencyLevelFromCharacterDetail(
  character: CharacterDetailDto,
  skillId: string,
): CombatantSkillProficiencyLevel {
  return character.proficiencies.some((p) => p.id === skillId) ? 1 : 0
}

export function toSavingThrowModifier(score: number | null | undefined, proficiencyLevel = 0, proficiencyBonus = 2): number {
  return getAbilityModifier(score ?? 10) + resolveProficiencyContribution(proficiencyBonus, proficiencyLevel)
}

export function formatDice(value: DiceOrFlat | undefined): string | undefined {
  if (value == null) return undefined
  return String(value)
}

export function formatAuthoredDamage(
  damage: DiceOrFlat | undefined,
  damageBonus?: number,
): string | undefined {
  if (damage == null) return undefined

  const baseDamage = String(damage)
  if (typeof damageBonus !== 'number' || damageBonus === 0) {
    return baseDamage
  }

  return `${baseDamage} ${damageBonus > 0 ? '+' : '-'} ${Math.abs(damageBonus)}`
}

function deriveTargetingRangeFt(attack: CombatantAttackEntry): number | undefined {
  if (!attack.range) return undefined
  return attack.range.kind === 'ranged' ? attack.range.normalFt : attack.range.rangeFt
}

function buildAttackActions(
  attacks: CombatantAttackEntry[],
  kind: 'weapon-attack' | 'monster-action',
): CombatActionDefinition[] {
  return attacks.map((attack) => ({
    id: attack.id,
    label: attack.name,
    kind,
    cost: { action: true },
    targeting: { kind: 'single-target' as const, rangeFt: deriveTargetingRangeFt(attack) },
    resolutionMode: attack.attackBonus != null ? 'attack-roll' : 'log-only',
    attackProfile:
      attack.attackBonus != null
        ? {
            attackBonus: attack.attackBonus,
            attackBreakdown: attack.attackBreakdown,
            damage: attack.damage,
            damageType: attack.damageType,
            damageBreakdown: attack.damageBreakdown,
          }
        : undefined,
    logText: attack.notes,
    displayMeta: { source: 'weapon' as const },
  }))
}

export function buildCharacterCombatantInstance(args: {
  runtimeId: string
  side: CombatantSide
  sourceKind: 'pc' | 'npc'
  character: CharacterDetailDto
  combatStats: ReturnType<typeof useCombatStats>
  attacks: CombatantAttackEntry[]
  extraActions?: CombatActionDefinition[]
  turnHooks: RuntimeTurnHook[]
}): CombatantInstance {
  const { runtimeId, side, sourceKind, character, combatStats, attacks, extraActions = [], turnHooks } = args

  const hideEligibilityFromFeats = deriveHideEligibilityFeatureFlagsFromCharacterDetail(character)

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: sourceKind,
      sourceId: character.id,
      label: character.name,
    },
    portraitImageKey: getCombatantPortraitImageKey({ character: { imageKey: character.imageKey } }),
    creatureType: 'humanoid',
    equipment: {
      armorEquipped: character.combat?.loadout?.armorId ?? null,
      mainHandWeaponId: character.combat?.loadout?.mainHandWeaponId ?? null,
      offHandWeaponId: character.combat?.loadout?.offHandWeaponId ?? null,
      shieldId: character.combat?.loadout?.shieldId ?? null,
    },
    stats: {
      armorClass: combatStats.armorClass,
      maxHitPoints: character.hitPoints.total,
      currentHitPoints: character.hitPoints.total,
      initiativeModifier: combatStats.initiative,
      dexterityScore: character.abilityScores.dexterity,
      abilityScores: character.abilityScores,
      speeds: { ground: 30 },
      skillRuntime: {
        proficiencyBonus: combatStats.proficiencyBonus,
        perceptionProficiencyLevel: skillProficiencyLevelFromCharacterDetail(character, 'perception'),
        stealthProficiencyLevel: skillProficiencyLevelFromCharacterDetail(character, 'stealth'),
        ...(hideEligibilityFromFeats != null ? { hideEligibilityFeatureFlags: hideEligibilityFromFeats } : {}),
      },
    },
    attacks,
    actions: [...buildAttackActions(attacks, 'weapon-attack'), ...extraActions],
    activeEffects: combatStats.activeEffects,
    runtimeEffects: [],
    turnHooks,
    suppressedHooks: [],
    turnContext: {
      totalDamageTaken: 0,
      damageTakenByType: {},
    },
    turnResources: createCombatTurnResources(30),
    conditions: [],
    states: [],
  }
}

export function buildMonsterCombatantInstance(args: {
  runtimeId: string
  monster: Monster
  attacks: CombatantAttackEntry[]
  actions?: CombatActionDefinition[]
  initiativeModifier: number
  armorClass: number
  currentHitPoints: number
  activeEffects: Effect[]
  turnHooks: RuntimeTurnHook[]
  /** Default `enemies` — use `party` for summoned allies. */
  side?: CombatantSide
}): CombatantInstance {
  const {
    runtimeId,
    monster,
    attacks,
    actions = [],
    initiativeModifier,
    armorClass,
    currentHitPoints,
    activeEffects,
    turnHooks,
    side = 'enemies',
  } = args

  const { damageImmunities, conditionImmunities } = partitionMonsterImmunities(
    monster.mechanics.immunities ?? [],
  )

  const resistanceMarkers: DamageResistanceMarker[] = mapMonsterResistances(
    monster.mechanics.resistances ?? [],
  )

  const vulnerabilityMarkers: DamageResistanceMarker[] = (monster.mechanics.vulnerabilities ?? []).map(
    (v) => ({
      id: `monster-vulnerability-${v}`,
      damageType: v,
      level: 'vulnerability' as const,
      sourceId: 'monster-innate',
      label: `vulnerability to ${v}`,
    }),
  )

  const darkvisionRangeFt = maxDarkvisionRangeFtFromMonsterSenses(monster)
  const sensesSnapshot = monster.mechanics.senses
    ? {
        ...(monster.mechanics.senses.special != null ? { special: monster.mechanics.senses.special } : {}),
        ...(monster.mechanics.senses.passivePerception != null
          ? { passivePerception: monster.mechanics.senses.passivePerception }
          : {}),
      }
    : undefined

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: 'monster',
      sourceId: monster.id,
      label: monster.name,
    },
    ...(sensesSnapshot && Object.keys(sensesSnapshot).length > 0 ? { senses: sensesSnapshot } : {}),
    portraitImageKey: getCombatantPortraitImageKey({ monster: { imageKey: monster.imageKey } }),
    creatureType: monster.type,
    equipment: {
      armorEquipped: null,
    },
    stats: {
      armorClass,
      maxHitPoints: currentHitPoints,
      currentHitPoints,
      initiativeModifier,
      dexterityScore: monster.mechanics.abilities?.dex ?? undefined,
      abilityScores: monster.mechanics.abilities
        ? {
            strength: monster.mechanics.abilities.str ?? 10,
            dexterity: monster.mechanics.abilities.dex ?? 10,
            constitution: monster.mechanics.abilities.con ?? 10,
            intelligence: monster.mechanics.abilities.int ?? 10,
            wisdom: monster.mechanics.abilities.wis ?? 10,
            charisma: monster.mechanics.abilities.cha ?? 10,
          }
        : undefined,
      savingThrowModifiers: monster.mechanics.abilities
        ? {
            strength: toSavingThrowModifier(
              monster.mechanics.abilities.str,
              monster.mechanics.savingThrows?.str?.proficiencyLevel ?? 0,
              monster.mechanics.proficiencyBonus,
            ),
            dexterity: toSavingThrowModifier(
              monster.mechanics.abilities.dex,
              monster.mechanics.savingThrows?.dex?.proficiencyLevel ?? 0,
              monster.mechanics.proficiencyBonus,
            ),
            constitution: toSavingThrowModifier(
              monster.mechanics.abilities.con,
              monster.mechanics.savingThrows?.con?.proficiencyLevel ?? 0,
              monster.mechanics.proficiencyBonus,
            ),
            intelligence: toSavingThrowModifier(
              monster.mechanics.abilities.int,
              monster.mechanics.savingThrows?.int?.proficiencyLevel ?? 0,
              monster.mechanics.proficiencyBonus,
            ),
            wisdom: toSavingThrowModifier(
              monster.mechanics.abilities.wis,
              monster.mechanics.savingThrows?.wis?.proficiencyLevel ?? 0,
              monster.mechanics.proficiencyBonus,
            ),
            charisma: toSavingThrowModifier(
              monster.mechanics.abilities.cha,
              monster.mechanics.savingThrows?.cha?.proficiencyLevel ?? 0,
              monster.mechanics.proficiencyBonus,
            ),
          }
        : undefined,
      speeds: monster.mechanics.movement,
      skillRuntime: {
        proficiencyBonus: monster.mechanics.proficiencyBonus,
        perceptionProficiencyLevel: normalizeMonsterSkillProficiencyLevel(
          monster.mechanics.proficiencies?.skills?.perception?.proficiencyLevel,
        ),
        stealthProficiencyLevel: normalizeMonsterSkillProficiencyLevel(
          monster.mechanics.proficiencies?.skills?.stealth?.proficiencyLevel,
        ),
        ...(monster.mechanics.senses?.passivePerception != null
          ? { passivePerception: monster.mechanics.senses.passivePerception }
          : {}),
        ...(monster.mechanics.hideEligibilityFeatureFlags != null
          ? { hideEligibilityFeatureFlags: monster.mechanics.hideEligibilityFeatureFlags }
          : {}),
        ...(darkvisionRangeFt != null ? { darkvisionRangeFt } : {}),
      },
    },
    attacks,
    actions,
    activeEffects,
    runtimeEffects: [],
    turnHooks,
    suppressedHooks: [],
    damageResistanceMarkers: [...damageImmunities, ...resistanceMarkers, ...vulnerabilityMarkers],
    conditionImmunities: conditionImmunities.length > 0 ? conditionImmunities : undefined,
    turnContext: {
      totalDamageTaken: 0,
      damageTakenByType: {},
    },
    turnResources: createCombatTurnResources(
      Math.max(...Object.values(monster.mechanics.movement ?? {}).filter((speed): speed is number => typeof speed === 'number' && speed > 0), 0)
    ),
    conditions: [],
    states: [],
  }
}
