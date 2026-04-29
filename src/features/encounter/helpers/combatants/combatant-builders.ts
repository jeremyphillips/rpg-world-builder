import type { useCombatStats } from '@/features/character/hooks'
import {
  buildCreatureSensesFromResolvedRace,
  resolveRaceForCharacter,
} from '@/features/character/domain/derived/grants/raceSenseGrants'
import { buildCharacterQueryContextFromDetailDto } from '@/features/character/domain/query'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { Race } from '@/features/content/races/domain/types'
import { getDarkvisionRange, normalizeCreatureSenses } from '@/features/content/shared/domain/vocab/creatureSenses.selectors'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { ImmunityType, CreatureResistanceDamageType } from '@/features/mechanics/domain/creatures/immunities.types'
import type { DiceOrFlat } from '@/shared/domain/dice';
import {
  CONDITION_IMMUNITY_ONLY_IDS,
  DAMAGE_IMPLIES_CONDITION,
  EFFECT_CONDITION_IDS,
  type ConditionImmunityId,
} from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { Effect, EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import {
  authoredExpertiseToResolved,
  authoredStandardToResolved,
  resolveProficiencyContribution,
  type ResolvedProficiencyMode,
} from '@/features/mechanics/domain/progression'
import {
  type CombatActionDefinition,
  type CombatantAttackEntry,
  type CombatantInstance,
  type CombatantSide,
  type DamageResistanceMarker,
  createCombatTurnResources,
  type RuntimeTurnHook,
} from '@/features/mechanics/domain/combat'

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types'
import { collectGrantedToolProficienciesFromClassLevels } from '@/features/mechanics/domain/rulesets/system/toolProficiencies'

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

function maxDarkvisionRangeFtFromMonsterSenses(monster: Monster): number | undefined {
  if (!monster.mechanics.senses) return undefined
  return getDarkvisionRange(normalizeCreatureSenses(monster.mechanics.senses))
}

export function toSavingThrowModifier(
  score: number | null | undefined,
  saveProficiency: ResolvedProficiencyMode | undefined,
  proficiencyBonus = 2,
): number {
  return getAbilityModifier(score ?? 10) + resolveProficiencyContribution(proficiencyBonus, saveProficiency)
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
  /**
   * Campaign system ruleset id for `getSystemRace` when `racesById` lacks the character’s race.
   * Not carried on {@link RulesetLike}.
   */
  systemRulesetId?: SystemRulesetId
  racesById?: Readonly<Record<string, Race>>
}): CombatantInstance {
  const {
    runtimeId,
    side,
    sourceKind,
    character,
    combatStats,
    attacks,
    extraActions = [],
    turnHooks,
    systemRulesetId: explicitSystemRulesetId,
    racesById,
  } = args

  // The campaign/system id is not stored on RulesetLike. Until callers thread
  // CampaignRulesetPatch.systemId through this path, fall back to the default
  // single-system ruleset for catalog-aware race resolution. Multi-system: pass `systemRulesetId`.
  const systemRulesetId = explicitSystemRulesetId ?? DEFAULT_SYSTEM_RULESET_ID

  const sheetCtx = buildCharacterQueryContextFromDetailDto(character)

  const race = resolveRaceForCharacter(character.race?.id ?? sheetCtx.identity.raceId ?? undefined, {
    rulesetId: systemRulesetId,
    racesById,
  })
  const pcSenses = buildCreatureSensesFromResolvedRace(race, character.raceChoices)
  const includePcSenses =
    pcSenses.special.length > 0 || pcSenses.passivePerception !== undefined

  const hideEligibilityFromFeats = deriveHideEligibilityFeatureFlagsFromCharacterDetail(character)

  const grantedToolProficiencies = collectGrantedToolProficienciesFromClassLevels(
    character.classes.map((c) => ({ classId: c.classId, level: c.level })),
    DEFAULT_SYSTEM_RULESET_ID,
  )
  const gearIds = Array.from(sheetCtx.inventory.gearIds)

  const skillResolvedMode = (skillId: string): ResolvedProficiencyMode => {
    const row = character.proficiencies.find((p) => p.id === skillId)
    return authoredExpertiseToResolved(row?.proficiency)
  }

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: sourceKind,
      sourceId: character.id,
      label: character.name,
    },
    ...(includePcSenses ? { senses: pcSenses } : {}),
    portraitImageKey: getCombatantPortraitImageKey({ character: { imageKey: character.imageKey } }),
    creatureType: 'humanoid',
    equipment: {
      armorEquipped: character.combat?.loadout?.armorId ?? null,
      mainHandWeaponId: character.combat?.loadout?.mainHandWeaponId ?? null,
      offHandWeaponId: character.combat?.loadout?.offHandWeaponId ?? null,
      shieldId: character.combat?.loadout?.shieldId ?? null,
      gearIds,
    },
    grantedToolProficiencies,
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
        perceptionProficiencyMode: skillResolvedMode('perception'),
        stealthProficiencyMode: skillResolvedMode('stealth'),
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
  const normalizedMonsterSenses = monster.mechanics.senses
    ? normalizeCreatureSenses(monster.mechanics.senses)
    : undefined
  const includeMonsterSenses =
    normalizedMonsterSenses != null &&
    (normalizedMonsterSenses.special.length > 0 || normalizedMonsterSenses.passivePerception != null)

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: 'monster',
      sourceId: monster.id,
      label: monster.name,
    },
    ...(includeMonsterSenses && normalizedMonsterSenses ? { senses: normalizedMonsterSenses } : {}),
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
              authoredStandardToResolved(monster.mechanics.proficiencies?.saves?.str),
              monster.mechanics.proficiencyBonus,
            ),
            dexterity: toSavingThrowModifier(
              monster.mechanics.abilities.dex,
              authoredStandardToResolved(monster.mechanics.proficiencies?.saves?.dex),
              monster.mechanics.proficiencyBonus,
            ),
            constitution: toSavingThrowModifier(
              monster.mechanics.abilities.con,
              authoredStandardToResolved(monster.mechanics.proficiencies?.saves?.con),
              monster.mechanics.proficiencyBonus,
            ),
            intelligence: toSavingThrowModifier(
              monster.mechanics.abilities.int,
              authoredStandardToResolved(monster.mechanics.proficiencies?.saves?.int),
              monster.mechanics.proficiencyBonus,
            ),
            wisdom: toSavingThrowModifier(
              monster.mechanics.abilities.wis,
              authoredStandardToResolved(monster.mechanics.proficiencies?.saves?.wis),
              monster.mechanics.proficiencyBonus,
            ),
            charisma: toSavingThrowModifier(
              monster.mechanics.abilities.cha,
              authoredStandardToResolved(monster.mechanics.proficiencies?.saves?.cha),
              monster.mechanics.proficiencyBonus,
            ),
          }
        : undefined,
      speeds: monster.mechanics.movement,
      skillRuntime: {
        proficiencyBonus: monster.mechanics.proficiencyBonus,
        perceptionProficiencyMode: authoredExpertiseToResolved(
          monster.mechanics.proficiencies?.skills?.perception,
        ),
        stealthProficiencyMode: authoredExpertiseToResolved(
          monster.mechanics.proficiencies?.skills?.stealth,
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
