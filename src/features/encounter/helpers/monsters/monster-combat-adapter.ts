import type { MonsterAction, MonsterSpecialAction } from '@/features/content/monsters/domain/types/monster-actions.types'
import type { MonsterEquippedWeapon } from '@/features/content/monsters/domain/types/monster-equipment.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import {
  buildCreatureResolutionInput,
  resolveWeaponAttackBonus,
  resolveWeaponDamage,
} from '@/features/mechanics/domain/resolution'
import {
  buildActiveMonsterEffects,
  type CombatActionDefinition,
  type CombatantAttackEntry,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
  type RuntimeTurnHook,
} from '@/features/mechanics/domain/encounter'
import { formatAuthoredDamage } from './combatants'
import { injectSpellSaveDcDeep } from '@/features/mechanics/domain/encounter/state/auras/battlefield-attached-aura-shared'
import { buildMonsterActionRuntimeId } from './monster-action-runtime-ids'

function formatDice(value: DiceOrFlat | undefined): string | undefined {
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
      return effect.grantType === 'condition-immunity'
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

function buildMonsterEvaluationContext(monster: Monster) {
  const abilities = monster.mechanics.abilities

  return buildCreatureResolutionInput({
    id: monster.id,
    level: 1,
    proficiencyBonus: monster.mechanics.proficiencyBonus ?? 2,
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
  })
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

  const { context } = buildMonsterEvaluationContext(monster)
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

function buildMonsterActionLogText(action: MonsterAction): string | undefined {
  if (action.kind === 'special') {
    return [action.description, action.notes].filter(Boolean).join(' ') || undefined
  }

  return undefined
}

function findMonsterCatalogActionById(monster: Monster, actionId: string): MonsterAction | undefined {
  const pool = [...(monster.mechanics.actions ?? []), ...(monster.mechanics.bonusActions ?? [])]
  for (const a of pool) {
    if (a.kind === 'weapon' && a.weaponRef === actionId) return a
    if (a.kind !== 'weapon' && a.id === actionId) return a
  }
  return undefined
}

function resolveMonsterActionDisplayLabel(monster: Monster, action: MonsterAction): string {
  if (action.kind === 'weapon') {
    const equipped = monster.mechanics.equipment?.weapons?.[action.weaponRef]
    return equipped?.aliasName ?? equipped?.weaponId ?? action.weaponRef
  }
  if (action.kind === 'natural') {
    return action.name ?? action.attackType
  }
  return action.name
}

function buildMonsterActionSequence(
  monster: Monster,
  action: MonsterAction,
): CombatActionDefinition['sequence'] {
  if (action.kind !== 'special' || !action.sequence) return undefined

  const usesCurrentHeadCount =
    action.notes?.toLowerCase().includes('current number of heads') ||
    action.description.toLowerCase().includes('as many')

  return action.sequence.map((step) => {
    const found = findMonsterCatalogActionById(monster, step.actionId)
    const actionLabel = found ? resolveMonsterActionDisplayLabel(monster, found) : step.actionId
    return {
      actionLabel,
      count: step.count,
      countFromTrackedPart: usesCurrentHeadCount ? 'head' : undefined,
    }
  })
}

/**
 * Maps **`MonsterSpecialAction`** `recharge` / `uses` to **`CombatActionDefinition['usage']`**.
 *
 * Only **`kind: 'special'`** actions participate; weapon and natural actions return `undefined`.
 * Recharge begins **`ready: true`** until encounter turn logic rolls recharge (see
 * `processActionRecharge` in encounter state runtime). Per-day uses copy **`max`**, **`remaining`**, and
 * **`period`** from **`EffectUses`**. Spend / block rules: `applyActionCost` in the action resolver.
 */
function monsterSpecialResolvableEffects(action: MonsterSpecialAction): Effect[] | undefined {
  if (!action.effects?.length) return undefined
  let filtered = action.effects.filter((e) => e.kind !== 'targeting' && e.kind !== 'emanation')
  const hasEmanation = action.effects.some((e) => e.kind === 'emanation')
  /** Match spell adapter: defer interval / spatial speed multiplier while attached aura is active. */
  if (hasEmanation) {
    filtered = filtered.filter((e) => e.kind !== 'interval' && e.kind !== 'modifier')
  }
  if (filtered.length === 0) return undefined
  const dc = action.save?.dc
  if (typeof dc === 'number') {
    return injectSpellSaveDcDeep(filtered, dc)
  }
  return filtered
}

function deriveMonsterAttachedEmanation(
  monster: Monster,
  action: MonsterSpecialAction,
  index: number,
  cost: CombatActionDefinition['cost'],
): CombatActionDefinition['attachedEmanation'] | undefined {
  const em = action.effects?.find((e): e is Extract<Effect, { kind: 'emanation' }> => e.kind === 'emanation')
  if (!em || em.attachedTo !== 'self' || em.area.kind !== 'sphere') return undefined
  const anchorMode = em.anchorMode ?? 'caster'
  return {
    source: {
      kind: 'monster-action',
      monsterId: monster.id,
      actionId: buildMonsterActionRuntimeId(monster, action, index, cost),
    },
    radiusFt: em.area.size,
    selectUnaffectedAtCast: em.selectUnaffectedAtCast ?? false,
    anchorMode,
    ...(anchorMode === 'place-or-object' && em.anchorChoiceFieldId
      ? { anchorChoiceFieldId: em.anchorChoiceFieldId }
      : {}),
  }
}

function buildMonsterActionUsage(action: MonsterAction): CombatActionDefinition['usage'] {
  if (action.kind !== 'special' || (!action.recharge && !action.uses)) return undefined

  return {
    recharge: action.recharge
      ? {
          min: action.recharge.min,
          max: action.recharge.max,
          ready: true,
        }
      : undefined,
    uses: action.uses
      ? {
          max: action.uses.count,
          remaining: action.uses.count,
          period: action.uses.period,
        }
      : undefined,
  }
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

    const weaponRange = weapon?.range
      ? weapon.range.long
        ? `${weapon.range.normal}/${weapon.range.long}${weapon.range.unit}`
        : `${weapon.range.normal}${weapon.range.unit}`
      : undefined

    return {
      id: `${monster.id}-action-${action.weaponRef}-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
      label: equippedWeapon?.aliasName ?? weapon?.name ?? action.weaponRef,
      kind: 'monster-action',
      cost,
      targeting: { kind: 'single-target', rangeFt: weapon?.range?.normal ?? 5 },
      resolutionMode:
        equippedWeapon?.attackBonus != null || resolvedWeaponAttack?.attackBonus != null
          ? 'attack-roll'
          : 'log-only',
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
      displayMeta: { source: 'weapon' as const, range: weaponRange },
    }
  }

  if (action.kind === 'natural') {
    const damageWithBonus = formatAuthoredDamage(action.damage, action.damageBonus)

    return {
      id: `${monster.id}-natural-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
      label: action.name ?? action.attackType,
      kind: 'monster-action',
      cost,
      targeting: { kind: 'single-target', rangeFt: action.reach ?? 5 },
      resolutionMode: action.attackBonus != null ? 'attack-roll' : 'log-only',
      attackProfile:
        action.attackBonus != null
          ? {
              attackBonus: action.attackBonus,
              damage: damageWithBonus,
              damageType: action.damageType,
            }
          : undefined,
      onHitEffects: action.onHitEffects,
      logText: action.notes,
      displayMeta: {
        source: 'natural' as const,
        attackType: action.attackType,
        reach: action.reach,
        description: action.notes,
      },
    }
  }

  const damageWithBonus = formatAuthoredDamage(action.damage, action.damageBonus)
  const special = action
  const attachedEmanation = deriveMonsterAttachedEmanation(monster, special, index, cost)

  const targeting: CombatActionDefinition['targeting'] =
    attachedEmanation?.anchorMode === 'place'
      ? { kind: 'self', ...(action.reach != null ? { rangeFt: action.reach } : {}) }
      : attachedEmanation?.anchorMode === 'creature'
        ? { kind: 'single-target', rangeFt: action.reach ?? 5 }
        : attachedEmanation?.anchorMode === 'object'
          ? { kind: 'none' }
          : action.target === 'creatures-in-area'
          ? { kind: 'all-enemies', ...(action.reach != null ? { rangeFt: action.reach } : {}) }
          : action.target === 'creatures-entered-during-move'
            ? { kind: 'entered-during-move' }
            : { kind: 'single-target', rangeFt: action.reach ?? 5 }

  return {
    id: `${monster.id}-special-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
    label: action.name,
    kind: 'monster-action',
    cost,
    resolutionMode:
      action.attackBonus != null
        ? 'attack-roll'
        : action.save?.dc != null
          ? 'saving-throw'
          : monsterSpecialResolvableEffects(special)?.length
            ? 'effects'
            : 'log-only',
    damage: damageWithBonus,
    damageType: action.damageType,
    attackProfile:
      action.attackBonus != null
        ? {
            attackBonus: action.attackBonus,
            damage: damageWithBonus,
            damageType: action.damageType,
          }
        : undefined,
    saveProfile:
      action.save?.dc != null
        ? {
            ability: action.save.ability,
            dc: action.save.dc,
            halfDamageOnSave: action.halfDamageOnSave,
          }
        : undefined,
    targeting,
    movement: action.movement,
    usage: buildMonsterActionUsage(action),
    effects: monsterSpecialResolvableEffects(special),
    attachedEmanation,
    ...(attachedEmanation?.anchorMode === 'place'
      ? {
          areaTemplate: { kind: 'sphere' as const, radiusFt: attachedEmanation.radiusFt },
          areaPlacement: 'remote' as const,
        }
      : {}),
    saveDc: typeof action.save?.dc === 'number' ? action.save.dc : undefined,
    onHitEffects: action.attackBonus != null ? action.onSuccess : undefined,
    onFailEffects: action.onFail,
    onSuccessEffects: action.onSuccess,
    sequence: buildMonsterActionSequence(monster, action),
    logText: buildMonsterActionLogText(action),
    displayMeta: {
      source: 'natural' as const,
      attackType: 'special',
      reach: action.reach,
      description: action.description,
    },
  }
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
    if (effect.trigger !== 'turn-start' && effect.trigger !== 'turn-end') return []

    return [
      {
        id: `effect-trigger-${effect.trigger}-${index}`,
        label: effect.text ?? `Trigger: ${effect.trigger}`,
        boundary: effect.trigger === 'turn-start' ? 'start' : 'end',
        effects: effect.effects,
      },
    ]
  })
}
