import { useCombatStats } from '@/features/character/hooks'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import {
  buildActiveMonsterEffects,
  type CombatActionDefinition,
  type CombatantAttackEntry,
  type CombatantInstance,
  type CombatantSide,
  createCombatTurnResources,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
  type RuntimeTurnHook,
} from '@/features/mechanics/domain/encounter'

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value)
}

export function toAbilityModifier(score: number | null | undefined): number {
  return Math.floor(((score ?? 10) - 10) / 2)
}

export function formatDice(value: DiceOrFlat | undefined): string | undefined {
  if (value == null) return undefined
  return String(value)
}

export function formatEffectLabel(effect: Effect): string {
  switch (effect.kind) {
    case 'condition':
      return `Condition: ${effect.conditionId}`
    case 'custom':
      return effect.id
    case 'damage':
      return `Damage: ${formatDice(effect.damage) ?? '—'}`
    case 'grant':
      return effect.grantType === 'condition_immunity'
        ? `Immunity: ${effect.value}`
        : 'Proficiency grant'
    case 'modifier':
      return `Modifier: ${effect.target}`
    case 'resource':
      return `Resource: ${effect.resource.id}`
    case 'save':
      return `Save: ${effect.save.ability}`
    case 'state':
      return `State: ${effect.stateId}`
    case 'trigger':
      return `Trigger: ${effect.trigger}`
    default:
      return effect.kind.replaceAll('_', ' ')
  }
}

export function formatCharacterSubtitle(character: CharacterDetailDto): string {
  const raceName = character.race?.name ?? 'Unknown race'
  const classes = character.classes.length > 0
    ? character.classes.map((cls) => `${cls.className} ${cls.level}`).join(' / ')
    : 'No class levels'

  return `${raceName} • ${classes}`
}

export function formatPartyOptionSubtitle(option: {
  race: { name: string } | null
  classes: { className: string; level: number }[]
  ownerName?: string
}): string {
  const classLabel = option.classes.length > 0
    ? option.classes.map((cls) => `${cls.className} ${cls.level}`).join(' / ')
    : 'No class levels'
  const ownerLabel = option.ownerName ? ` • ${option.ownerName}` : ''
  return `${option.race?.name ?? 'Unknown race'} • ${classLabel}${ownerLabel}`
}

export function formatNpcOptionSubtitle(option: {
  race?: string | null
  classes?: { className?: string; level: number }[]
}): string {
  const classLabel = option.classes && option.classes.length > 0
    ? option.classes.map((cls) => `${cls.className ?? 'Class'} ${cls.level}`).join(' / ')
    : 'No class levels'
  return `${option.race ?? 'Unknown race'} • ${classLabel}`
}

export function formatMonsterOptionSubtitle(monster: Monster): string {
  const typeLabel = monster.type ?? 'monster'
  const sizeLabel = monster.sizeCategory ?? 'size unknown'
  const challengeRating = monster.lore?.challengeRating ?? '—'
  return `CR ${challengeRating} • ${sizeLabel} ${typeLabel}`
}

export function buildMonsterAttackEntries(
  monster: Monster,
  weaponsById: Record<string, { name: string; damage?: { default?: DiceOrFlat }; damageType?: string }>,
): CombatantAttackEntry[] {
  const actions = monster.mechanics.actions ?? []

  return actions.map((action, index) => {
    if (action.kind === 'weapon') {
      const equippedWeapon = monster.mechanics.equipment?.weapons?.[action.weaponRef]
      const weaponId = equippedWeapon?.weaponId ?? action.weaponRef
      const weapon = weaponsById[weaponId]

      return {
        id: `${monster.id}-weapon-${action.weaponRef}-${index}`,
        name: equippedWeapon?.aliasName ?? weapon?.name ?? action.weaponRef,
        attackBonus: equippedWeapon?.attackBonus,
        damage: formatDice(equippedWeapon?.damageOverride ?? weapon?.damage?.default),
        damageType: weapon?.damageType,
        notes: equippedWeapon?.notes,
      }
    }

    if (action.kind === 'natural') {
      return {
        id: `${monster.id}-natural-${index}`,
        name: action.name ?? action.attackType,
        attackBonus: action.attackBonus,
        damage: formatDice(action.damage),
        damageType: action.damageType,
        notes: action.notes,
      }
    }

    return {
      id: `${monster.id}-special-${index}`,
      name: action.name,
      attackBonus: action.attackBonus,
      damage: formatDice(action.damage),
      damageType: action.damageType,
      notes: [action.description, action.notes].filter(Boolean).join(' '),
    }
  })
}

export function buildMonsterEffectLabels(
  monster: Monster,
  context: {
    environment: ManualEnvironmentContext
    form: MonsterFormContext
    manual: ManualMonsterTriggerContext
  },
): string[] {
  const activeEffects = buildActiveMonsterEffects(monster, context)
  const activeEffectSet = new Set(activeEffects)

  return (monster.mechanics.traits ?? []).flatMap((trait) =>
    (trait.effects ?? [])
      .filter((effect) => activeEffectSet.has(effect))
      .map((effect) => `${trait.name}: ${formatEffectLabel(effect)}`),
  )
}

export function buildTurnHooksFromEffects(effects: Effect[]): RuntimeTurnHook[] {
  return effects.flatMap((effect, index) => {
    if (effect.kind !== 'trigger') return []
    if (effect.trigger !== 'turn_start' && effect.trigger !== 'turn_end') return []

    return [
      {
        id: `effect-trigger-${effect.trigger}-${index}`,
        label: effect.text ?? `Trigger: ${effect.trigger}`,
        boundary: effect.trigger === 'turn_start' ? 'start' : 'end',
        effects: effect.effects,
      },
    ]
  })
}

export function formatRuntimeLabel(name: string, runtimeId: string, sourceId: string): string {
  return runtimeId === sourceId ? name : `${name} (${runtimeId})`
}

function buildAttackActions(
  attacks: CombatantAttackEntry[],
  kind: 'weapon_attack' | 'monster_action',
): CombatActionDefinition[] {
  return attacks.map((attack) => ({
    id: attack.id,
    label: attack.name,
    kind,
    cost: { action: true },
    resolutionMode: attack.attackBonus != null ? 'attack_roll' : 'log_only',
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
  }))
}

export function buildCharacterCombatantInstance(args: {
  runtimeId: string
  side: CombatantSide
  sourceKind: 'pc' | 'npc'
  character: CharacterDetailDto
  combatStats: ReturnType<typeof useCombatStats>
  attacks: CombatantAttackEntry[]
  turnHooks: RuntimeTurnHook[]
}): CombatantInstance {
  const { runtimeId, side, sourceKind, character, combatStats, attacks, turnHooks } = args

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: sourceKind,
      sourceId: character.id,
      label: formatRuntimeLabel(character.name, runtimeId, character.id),
    },
    stats: {
      armorClass: combatStats.armorClass,
      maxHitPoints: combatStats.maxHp,
      currentHitPoints: character.hitPoints.total,
      initiativeModifier: combatStats.initiative,
      dexterityScore: character.abilityScores.dexterity,
    },
    attacks,
    actions: buildAttackActions(attacks, 'weapon_attack'),
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
  initiativeModifier: number
  armorClass: number
  currentHitPoints: number
  activeEffects: Effect[]
  turnHooks: RuntimeTurnHook[]
}): CombatantInstance {
  const { runtimeId, monster, attacks, initiativeModifier, armorClass, currentHitPoints, activeEffects, turnHooks } = args

  return {
    instanceId: runtimeId,
    side: 'enemies',
    source: {
      kind: 'monster',
      sourceId: monster.id,
      label: formatRuntimeLabel(monster.name, runtimeId, monster.id),
    },
    stats: {
      armorClass,
      maxHitPoints: currentHitPoints,
      currentHitPoints,
      initiativeModifier,
      dexterityScore: monster.mechanics.abilities?.dexterity ?? undefined,
      speeds: monster.mechanics.movement,
    },
    attacks,
    actions: buildAttackActions(attacks, 'monster_action'),
    activeEffects,
    runtimeEffects: [],
    turnHooks,
    suppressedHooks: [],
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
