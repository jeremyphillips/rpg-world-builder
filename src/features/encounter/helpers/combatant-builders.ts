import type { useCombatStats } from '@/features/character/hooks'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { ImmunityType, MonsterResistanceType } from '@/features/content/monsters/domain/types/monster-combat.types'
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { Effect, EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { resolveProficiencyContribution } from '@/features/mechanics/domain/progression'
import {
  type CombatActionDefinition,
  type CombatantAttackEntry,
  type CombatantInstance,
  type CombatantSide,
  type DamageResistanceMarker,
  createCombatTurnResources,
  type RuntimeTurnHook,
} from '@/features/mechanics/domain/encounter'

const CONDITION_IDS: ReadonlySet<string> = new Set<EffectConditionId>([
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious',
])

const CONDITION_ADJACENT_IMMUNITIES: ReadonlySet<string> = new Set(['exhaustion'])

function partitionMonsterImmunities(immunities: ImmunityType[]): {
  damageImmunities: DamageResistanceMarker[]
  conditionImmunities: string[]
} {
  const damageImmunities: DamageResistanceMarker[] = []
  const conditionImmunities: string[] = []

  for (const entry of immunities) {
    if (CONDITION_IDS.has(entry) || CONDITION_ADJACENT_IMMUNITIES.has(entry)) {
      conditionImmunities.push(entry)
    } else {
      damageImmunities.push({
        id: `monster-immunity-${entry}`,
        damageType: entry,
        level: 'immunity',
        sourceId: 'monster-innate',
        label: `immunity to ${entry}`,
      })
    }
  }

  return { damageImmunities, conditionImmunities }
}

function mapMonsterResistances(resistances: MonsterResistanceType[]): DamageResistanceMarker[] {
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

export function formatRuntimeLabel(name: string, runtimeId: string, sourceId: string): string {
  return runtimeId === sourceId ? name : `${name} (${runtimeId})`
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
    targeting: { kind: 'single-target' as const },
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

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: sourceKind,
      sourceId: character.id,
      label: formatRuntimeLabel(character.name, runtimeId, character.id),
    },
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
    turnResources: createCombatTurnResources(),
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

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: 'monster',
      sourceId: monster.id,
      label: formatRuntimeLabel(monster.name, runtimeId, monster.id),
    },
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
