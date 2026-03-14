import { useCombatStats } from '@/features/character/hooks'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { MonsterAction } from '@/features/content/monsters/domain/types/monster-actions.types'
import type { MonsterEquippedWeapon } from '@/features/content/monsters/domain/types/monster-equipment.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { EvaluationContext } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { resolveWeaponAttackBonus, resolveWeaponDamage } from '@/features/mechanics/domain/resolution/attack-resolver'
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

function formatAuthoredDamage(
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

function buildMonsterEvaluationContext(monster: Monster): EvaluationContext {
  const abilities = monster.mechanics.abilities

  return {
    self: {
      id: monster.id,
      level: 1,
      hp: 1,
      hpMax: 1,
      abilities: {
        strength: abilities?.str ?? 10,
        dexterity: abilities?.dex ?? 10,
        constitution: abilities?.con ?? 10,
        intelligence: abilities?.int ?? 10,
        wisdom: abilities?.wis ?? 10,
        charisma: abilities?.cha ?? 10,
      },
      conditions: [],
      resources: {},
      equipment: {},
      flags: {},
    },
  }
}

function resolveMonsterWeaponAttack(args: {
  monster: Monster
  proficiencyWeaponId: string
  weapon: Weapon | undefined
  equippedWeapon?: MonsterEquippedWeapon
  effects: Effect[]
}): {
  attackBonus: number
  attackBreakdown: ReturnType<typeof resolveWeaponAttackBonus>['breakdown']
  damage: string
  damageType: string
  damageBreakdown: ReturnType<typeof resolveWeaponDamage>['breakdown']
} | null {
  const { monster, proficiencyWeaponId, weapon, equippedWeapon, effects } = args
  if (!weapon) return null

  const context = buildMonsterEvaluationContext(monster)
  const proficiencyLevel =
    monster.mechanics.proficiencies?.weapons?.[proficiencyWeaponId]?.proficiencyLevel ?? 1
  const proficiencyBonus = monster.mechanics.proficiencyBonus ?? 2
  const weaponInput = {
    type: weapon.mode,
    properties: weapon.properties,
    damage:
      equippedWeapon?.damageOverride != null
        ? {
            ...weapon.damage,
            default: String(equippedWeapon.damageOverride),
            versatile:
              weapon.damage.versatile != null ? String(weapon.damage.versatile) : undefined,
          }
        : {
            default: String(weapon.damage.default),
            versatile:
              weapon.damage.versatile != null ? String(weapon.damage.versatile) : undefined,
          },
    damageType: weapon.damageType,
  }

  const attack = resolveWeaponAttackBonus(context, weaponInput, effects, {
    proficiencyLevel,
    proficiencyBonus,
  })
  const damage = resolveWeaponDamage(context, weaponInput, effects)

  return {
    attackBonus: attack.bonus,
    attackBreakdown: attack.breakdown,
    damage: damage.total,
    damageType: damage.damageType,
    damageBreakdown: damage.breakdown,
  }
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
  weaponsById: Record<string, Weapon>,
  effects: Effect[] = [],
): CombatantAttackEntry[] {
  const actions = monster.mechanics.actions ?? []

  return actions.map((action, index) => {
    if (action.kind === 'weapon') {
      const equippedWeapon = monster.mechanics.equipment?.weapons?.[action.weaponRef]
      const weaponId = equippedWeapon?.weaponId ?? action.weaponRef
      const weapon = weaponsById[weaponId]
      const resolvedWeaponAttack = resolveMonsterWeaponAttack({
        monster,
        proficiencyWeaponId: weaponId,
        weapon,
        equippedWeapon,
        effects,
      })

      return {
        id: `${monster.id}-weapon-${action.weaponRef}-${index}`,
        name: equippedWeapon?.aliasName ?? weapon?.name ?? action.weaponRef,
        attackBonus: equippedWeapon?.attackBonus ?? resolvedWeaponAttack?.attackBonus,
        attackBreakdown: resolvedWeaponAttack?.attackBreakdown,
        damage: resolvedWeaponAttack?.damage ?? formatDice(equippedWeapon?.damageOverride ?? weapon?.damage?.default),
        damageType: weapon?.damageType ?? resolvedWeaponAttack?.damageType,
        damageBreakdown: resolvedWeaponAttack?.damageBreakdown,
        notes: equippedWeapon?.notes,
      }
    }

    if (action.kind === 'natural') {
      return {
        id: `${monster.id}-natural-${index}`,
        name: action.name ?? action.attackType,
        attackBonus: action.attackBonus,
        damage: formatAuthoredDamage(action.damage, action.damageBonus),
        damageType: action.damageType,
        notes: action.notes,
      }
    }

    return {
      id: `${monster.id}-special-${index}`,
      name: action.name,
      attackBonus: action.attackBonus,
      damage: formatAuthoredDamage(action.damage, action.damageBonus),
      damageType: action.damageType,
      notes: [action.description, action.notes].filter(Boolean).join(' '),
    }
  })
}

function buildMonsterActionLogText(action: MonsterAction): string | undefined {
  if (action.kind === 'special') {
    return [action.description, action.notes].filter(Boolean).join(' ') || undefined
  }

  return undefined
}

function buildMonsterActionDefinition(
  monster: Monster,
  action: MonsterAction,
  index: number,
  cost: CombatActionDefinition['cost'],
  weaponsById: Record<string, Weapon>,
  effects: Effect[],
): CombatActionDefinition {
  if (action.kind === 'weapon') {
    const equippedWeapon = monster.mechanics.equipment?.weapons?.[action.weaponRef]
    const weaponId = equippedWeapon?.weaponId ?? action.weaponRef
    const weapon = weaponsById[weaponId]
    const resolvedWeaponAttack = resolveMonsterWeaponAttack({
      monster,
      proficiencyWeaponId: weaponId,
      weapon,
      equippedWeapon,
      effects,
    })

    return {
      id: `${monster.id}-action-${action.weaponRef}-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
      label: equippedWeapon?.aliasName ?? weapon?.name ?? action.weaponRef,
      kind: 'monster_action',
      cost,
      resolutionMode:
        equippedWeapon?.attackBonus != null || resolvedWeaponAttack?.attackBonus != null
          ? 'attack_roll'
          : 'log_only',
      attackProfile:
        equippedWeapon?.attackBonus != null || resolvedWeaponAttack != null
          ? {
              attackBonus: equippedWeapon?.attackBonus ?? resolvedWeaponAttack?.attackBonus ?? 0,
              attackBreakdown: resolvedWeaponAttack?.attackBreakdown,
              damage:
                resolvedWeaponAttack?.damage ?? formatDice(equippedWeapon?.damageOverride ?? weapon?.damage?.default),
              damageType: weapon?.damageType ?? resolvedWeaponAttack?.damageType,
              damageBreakdown: resolvedWeaponAttack?.damageBreakdown,
            }
          : undefined,
      logText: equippedWeapon?.notes,
    }
  }

  if (action.kind === 'natural') {
    // Natural actions use authored attack/damage values directly.
    const damageWithBonus = formatAuthoredDamage(action.damage, action.damageBonus)

    return {
      id: `${monster.id}-natural-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
      label: action.name ?? action.attackType,
      kind: 'monster_action',
      cost,
      resolutionMode: action.attackBonus != null ? 'attack_roll' : 'log_only',
      attackProfile:
        action.attackBonus != null
          ? {
              attackBonus: action.attackBonus,
              damage: damageWithBonus,
              damageType: action.damageType,
            }
          : undefined,
      logText: action.notes,
    }
  }

  // Special actions also rely on canonical authored bonuses.
  const damageWithBonus = formatAuthoredDamage(action.damage, action.damageBonus)

  return {
    id: `${monster.id}-special-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
    label: action.name,
    kind: 'monster_action',
    cost,
    resolutionMode: action.attackBonus != null ? 'attack_roll' : 'log_only',
    attackProfile:
      action.attackBonus != null
        ? {
            attackBonus: action.attackBonus,
            damage: damageWithBonus,
            damageType: action.damageType,
          }
        : undefined,
    logText: buildMonsterActionLogText(action),
  }
}

export function buildMonsterExecutableActions(
  monster: Monster,
  weaponsById: Record<string, Weapon>,
  effects: Effect[] = [],
): CombatActionDefinition[] {
  const actions = (monster.mechanics.actions ?? []).map((action, index) =>
    buildMonsterActionDefinition(monster, action, index, { action: true }, weaponsById, effects),
  )
  const bonusActions = (monster.mechanics.bonusActions ?? []).map((action, index) =>
    buildMonsterActionDefinition(monster, action, index, { bonusAction: true }, weaponsById, effects),
  )

  return [...actions, ...bonusActions]
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

function buildSpellLogText(spell: Spell): string {
  const effectText = (spell.effects ?? [])
    .map((effect) => effect.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join(' ')

  return effectText || spell.description?.trim() || `${spell.name} effect resolution not implemented yet.`
}

export function buildSpellPlaceholderActions(args: {
  runtimeId: string
  spellIds?: string[]
  spellsById: Record<string, Spell>
}): CombatActionDefinition[] {
  const { runtimeId, spellIds = [], spellsById } = args

  return spellIds.flatMap((spellId) => {
    const spell = spellsById[spellId]
    if (!spell) return []

    return [
      {
        id: `${runtimeId}-spell-${spell.id}`,
        label: spell.name,
        kind: 'spell',
        cost: { action: true },
        resolutionMode: 'log_only',
        logText: buildSpellLogText(spell),
      },
    ]
  })
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
    stats: {
      armorClass: combatStats.armorClass,
      maxHitPoints: combatStats.maxHp,
      currentHitPoints: character.hitPoints.total,
      initiativeModifier: combatStats.initiative,
      dexterityScore: character.abilityScores.dexterity,
    },
    attacks,
    actions: [...buildAttackActions(attacks, 'weapon_attack'), ...extraActions],
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
}): CombatantInstance {
  const { runtimeId, monster, attacks, actions = [], initiativeModifier, armorClass, currentHitPoints, activeEffects, turnHooks } = args

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
    actions,
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
