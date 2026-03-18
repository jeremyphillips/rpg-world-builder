import type { useCombatStats } from '@/features/character/hooks'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { MonsterAction } from '@/features/content/monsters/domain/types/monster-actions.types'
import type { MonsterEquippedWeapon } from '@/features/content/monsters/domain/types/monster-equipment.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type { Spell, SpellDuration } from '@/features/content/spells/domain/types/spell.types'
import type { EffectDuration } from '@/features/mechanics/domain/effects/timing.types'
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { EvaluationContext } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { findCharacterSpellcastingClassEntry } from '@/features/mechanics/domain/spellcasting'
import { resolveWeaponAttackBonus, resolveWeaponDamage } from '@/features/mechanics/domain/resolution'
import { getProficiencyAttackBonus } from '@/features/mechanics/domain/progression'
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

export function getCharacterSpellcastingStats(character: CharacterDetailDto): {
  spellSaveDc: number
  spellAttackBonus: number
} {
  const spellcastingClass = findCharacterSpellcastingClassEntry(character)
  const abilityKey = spellcastingClass?.progression?.spellProgression?.ability
  const abilityScore = abilityKey ? character.abilityScores?.[abilityKey] ?? 10 : 10
  const abilityMod = getAbilityModifier(abilityScore)
  const profBonus = getProficiencyAttackBonus(spellcastingClass?.level ?? 1)

  return {
    spellSaveDc: 8 + profBonus + abilityMod,
    spellAttackBonus: profBonus + abilityMod,
  }
}

function toSavingThrowModifier(score: number | null | undefined, proficiencyLevel = 0, proficiencyBonus = 2): number {
  return getAbilityModifier(score ?? 10) + proficiencyLevel * proficiencyBonus
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

export function formatCharacterSubtitle(character: CharacterDetailDto): string {
  const raceName = character.race?.name ?? 'Unknown race'
  const classes = character.classes.length > 0
    ? character.classes.map((cls) => `${cls.className} ${cls.level}`).join(' / ')
    : 'No class levels'

  return `${raceName} • ${classes}`
}

export function formatAllyOptionSubtitle(option: {
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

function buildMonsterActionSequence(action: MonsterAction): CombatActionDefinition['sequence'] {
  if (action.kind !== 'special' || !action.sequence) return undefined

  const usesCurrentHeadCount =
    action.notes?.toLowerCase().includes('current number of heads') ||
    action.description.toLowerCase().includes('as many')

  return action.sequence.map((step) => ({
    actionLabel: step.actionName,
    count: step.count,
    countFromTrackedPart: usesCurrentHeadCount ? 'head' : undefined,
  }))
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

    return {
      id: `${monster.id}-action-${action.weaponRef}-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
      label: equippedWeapon?.aliasName ?? weapon?.name ?? action.weaponRef,
      kind: 'monster-action',
      cost,
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
    }
  }

  if (action.kind === 'natural') {
    // Natural actions use authored attack/damage values directly.
    const damageWithBonus = formatAuthoredDamage(action.damage, action.damageBonus)

    return {
      id: `${monster.id}-natural-${index}-${cost.bonusAction ? 'bonus' : 'action'}`,
      label: action.name ?? action.attackType,
      kind: 'monster-action',
      cost,
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
    }
  }

  // Special actions also rely on canonical authored bonuses.
  const damageWithBonus = formatAuthoredDamage(action.damage, action.damageBonus)

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
    targeting:
      action.target === 'creatures-in-area'
        ? { kind: 'all-enemies' }
        : action.target === 'creatures-entered-during-move'
          ? { kind: 'entered-during-move' }
          : { kind: 'single-target' },
    movement: action.movement,
    usage: buildMonsterActionUsage(action),
    onHitEffects: action.attackBonus != null ? action.onSuccess : undefined,
    onFailEffects: action.onFail,
    onSuccessEffects: action.onSuccess,
    sequence: buildMonsterActionSequence(action),
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
  }))
}

function buildSpellLogText(spell: Spell): string {
  const effectText = (spell.effects ?? [])
    .map((effect) => effect.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join(' ')

  return effectText || spell.description.summary?.trim() || `${spell.name} effect resolution not implemented yet.`
}

function classifySpellResolutionMode(
  spell: Spell,
): 'attack-roll' | 'effects' | 'log-only' {
  if (spell.deliveryMethod) return 'attack-roll'

  const effects = spell.effects ?? []
  const hasSave = effects.some((e) => e.kind === 'save')
  if (hasSave) return 'effects'

  if (spell.range?.kind === 'self') {
    const hasResolvable = effects.some((e) => e.kind === 'modifier' || e.kind === 'immunity')
    if (hasResolvable) return 'effects'
  }

  return 'log-only'
}

function buildSpellActionCost(spell: Spell): { action?: boolean; bonusAction?: boolean; reaction?: boolean } {
  const unit = spell.castingTime?.normal?.unit
  if (unit === 'bonus-action') return { bonusAction: true }
  if (unit === 'reaction') return { reaction: true }
  return { action: true }
}

function buildSpellTargeting(spell: Spell): { kind: 'single-target' | 'all-enemies' | 'self' } {
  if (spell.range?.kind === 'self') return { kind: 'self' }
  const targeting = (spell.effects ?? []).find((e) => e.kind === 'targeting')
  if (targeting?.kind === 'targeting' && targeting.area) return { kind: 'all-enemies' }
  if (targeting?.kind === 'targeting' && targeting.target === 'creatures-in-area') return { kind: 'all-enemies' }
  return { kind: 'single-target' }
}

function injectSpellSaveDc(effects: Effect[], spellSaveDc: number): Effect[] {
  return effects.map((effect) => {
    if (effect.kind !== 'save') return effect
    if (typeof effect.save.dc === 'number') return effect
    return { ...effect, save: { ...effect.save, dc: spellSaveDc } }
  })
}

function findSpellDamageEffect(spell: Spell): Extract<Effect, { kind: 'damage' }> | undefined {
  return (spell.effects ?? []).find((e): e is Extract<Effect, { kind: 'damage' }> => e.kind === 'damage')
}

function resolveInstanceCount(spell: Spell, casterLevel: number): number {
  const damageEffect = findSpellDamageEffect(spell)
  if (!damageEffect?.instances) return 1

  let count = damageEffect.instances.count
  const thresholds = damageEffect.levelScaling?.thresholds
  if (thresholds) {
    for (const t of thresholds) {
      if (casterLevel >= t.level && t.instances != null) {
        count = t.instances
      }
    }
  }
  return count
}

function buildSpellAttackAction(
  spell: Spell,
  runtimeId: string,
  spellAttackBonus: number,
  casterLevel: number,
): CombatActionDefinition[] {
  const damageEffect = findSpellDamageEffect(spell)
  const instanceCount = resolveInstanceCount(spell, casterLevel)
  const damage = damageEffect ? String(damageEffect.damage) : undefined
  const damageType = damageEffect?.damageType as string | undefined

  const onHitEffects = (spell.effects ?? []).filter(
    (e) => e.kind !== 'targeting' && e.kind !== 'damage' && e.kind !== 'note',
  )

  if (instanceCount <= 1) {
    return [{
      id: `${runtimeId}-spell-${spell.id}`,
      label: spell.name,
      kind: 'spell',
      cost: buildSpellActionCost(spell),
      resolutionMode: 'attack-roll',
      attackProfile: {
        attackBonus: spellAttackBonus,
        damage,
        damageType,
      },
      targeting: { kind: 'single-target' },
      onHitEffects: onHitEffects.length > 0 ? onHitEffects : undefined,
      logText: buildSpellLogText(spell),
    }]
  }

  const beamLabel = `${spell.name} Beam`
  const beamId = `${runtimeId}-spell-${spell.id}-beam`

  const beamAction: CombatActionDefinition = {
    id: beamId,
    label: beamLabel,
    kind: 'spell',
    cost: {},
    resolutionMode: 'attack-roll',
    attackProfile: {
      attackBonus: spellAttackBonus,
      damage,
      damageType,
    },
    targeting: { kind: 'single-target' },
    onHitEffects: onHitEffects.length > 0 ? onHitEffects : undefined,
  }

  const parentAction: CombatActionDefinition = {
    id: `${runtimeId}-spell-${spell.id}`,
    label: spell.name,
    kind: 'spell',
    cost: buildSpellActionCost(spell),
    resolutionMode: 'attack-roll',
    attackProfile: {
      attackBonus: spellAttackBonus,
      damage,
      damageType,
    },
    targeting: { kind: 'single-target' },
    sequence: [{ actionLabel: beamLabel, count: instanceCount }],
    logText: buildSpellLogText(spell),
  }

  return [parentAction, beamAction]
}

function spellDurationToEffectDuration(spellDuration: SpellDuration): EffectDuration | undefined {
  if (spellDuration.kind === 'until-turn-boundary') {
    return {
      kind: 'until-turn-boundary',
      subject: spellDuration.subject,
      turn: spellDuration.turn,
      boundary: spellDuration.boundary,
    }
  }
  return undefined
}

function injectSpellEffectDuration(effects: Effect[], spellDuration: SpellDuration): Effect[] {
  const effectDuration = spellDurationToEffectDuration(spellDuration)
  if (!effectDuration) return effects

  return effects.map((effect) => {
    if (effect.duration) return effect
    return { ...effect, duration: effectDuration } as Effect
  })
}

function buildSpellEffectsAction(
  spell: Spell,
  runtimeId: string,
  spellSaveDc: number,
): CombatActionDefinition {
  let enrichedEffects = injectSpellSaveDc(spell.effects ?? [], spellSaveDc)
  enrichedEffects = injectSpellEffectDuration(enrichedEffects, spell.duration)
  const resolvableEffects = enrichedEffects.filter((e) => e.kind !== 'targeting')

  return {
    id: `${runtimeId}-spell-${spell.id}`,
    label: spell.name,
    kind: 'spell',
    cost: buildSpellActionCost(spell),
    resolutionMode: 'effects',
    effects: resolvableEffects,
    targeting: buildSpellTargeting(spell),
    logText: buildSpellLogText(spell),
  }
}

export function buildSpellCombatActions(args: {
  runtimeId: string
  spellIds?: string[]
  spellsById: Record<string, Spell>
  spellSaveDc: number
  spellAttackBonus: number
  casterLevel: number
}): CombatActionDefinition[] {
  const { runtimeId, spellIds = [], spellsById, spellSaveDc, spellAttackBonus, casterLevel } = args

  return spellIds.flatMap((spellId) => {
    const spell = spellsById[spellId]
    if (!spell) return []

    const mode = classifySpellResolutionMode(spell)

    if (mode === 'attack-roll') {
      return buildSpellAttackAction(spell, runtimeId, spellAttackBonus, casterLevel)
    }

    if (mode === 'effects') {
      return [buildSpellEffectsAction(spell, runtimeId, spellSaveDc)]
    }

    return [{
      id: `${runtimeId}-spell-${spell.id}`,
      label: spell.name,
      kind: 'spell',
      cost: buildSpellActionCost(spell),
      resolutionMode: 'log-only',
      logText: buildSpellLogText(spell),
    }]
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
