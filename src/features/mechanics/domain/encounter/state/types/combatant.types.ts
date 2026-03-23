import type { Condition } from '@/features/mechanics/domain/conditions/condition.types'
import type { ConditionImmunityId } from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import type { AbilityKey, AbilityRef } from '@/features/mechanics/domain/character'
import type { BreakdownToken } from '../../../resolution/resolvers/stat-resolver'
import type { CombatActionDefinition } from '../../resolution/combat-action.types'

export type CombatantSide = 'party' | 'enemies'

export type CombatantSourceKind = 'pc' | 'npc' | 'monster'

export interface CombatantSourceRef {
  kind: CombatantSourceKind
  sourceId: string
  label: string
}

export type CombatantAttackRange =
  | { kind: 'melee'; rangeFt: number }
  | { kind: 'ranged'; normalFt: number; longFt?: number }

export interface CombatantAttackEntry {
  id: string
  name: string
  attackBonus?: number
  attackBreakdown?: BreakdownToken[]
  damage?: string
  damageType?: string
  damageBreakdown?: BreakdownToken[]
  notes?: string
  range?: CombatantAttackRange
}

export interface CombatantStatBlock {
  armorClass: number
  maxHitPoints: number
  currentHitPoints: number
  initiativeModifier: number
  dexterityScore?: number
  abilityScores?: Partial<Record<AbilityKey, number>>
  savingThrowModifiers?: Partial<Record<AbilityKey, number>>
  speeds?: Partial<Record<'ground' | 'climb' | 'fly' | 'swim' | 'burrow', number>>
}

export interface RuntimeMarkerDuration {
  remainingTurns: number
  tickOn: TurnBoundary
}

export interface RuntimeMarker {
  id: string
  label: string
  duration?: RuntimeMarkerDuration
  sourceInstanceId?: string
  classification?: string[]
}

export interface RuntimeEffectInstance {
  id: string
  label: string
  effectKind: string
  duration: RuntimeMarkerDuration
}

export type RuntimeTurnHookRequirement =
  | { kind: 'self-state'; state: 'bloodied' }
  | { kind: 'damage-taken-this-turn'; damageType?: string; min?: number }
  | { kind: 'hit-points-equals'; value: number }
  | { kind: 'hit-points-above'; value: number }

export interface RuntimeTurnHookRepeatSave {
  ability: AbilityRef
  dc: number
  removeCondition?: string
  removeState?: string
  singleAttempt?: boolean
  onFail?: {
    addCondition?: string
    markerClassification?: string[]
  }
  autoSuccessIfImmuneTo?: ConditionImmunityId
  /** Caster combatant id — stored on conditions applied from this hook (e.g. unconscious). */
  casterInstanceId?: string
  outcomeTrack?: {
    successCountToEnd?: number
    failCountToLock?: number
    failLockStateId?: string
  }
}

export interface RuntimeTurnHook {
  id: string
  label: string
  boundary: TurnBoundary
  effects: Effect[]
  requirements?: RuntimeTurnHookRequirement[]
  suppression?: {
    damageTypes?: string[]
    duration?: RuntimeMarkerDuration
  }
  repeatSave?: RuntimeTurnHookRepeatSave
  /** Populated when `repeatSave.outcomeTrack` is set (Contagion-style save chains). */
  repeatSaveProgress?: { successes: number; fails: number }
}

export interface CombatantTurnContext {
  totalDamageTaken: number
  damageTakenByType: Record<string, number>
}

export interface CombatantTurnResources {
  actionAvailable: boolean
  bonusActionAvailable: boolean
  reactionAvailable: boolean
  opportunityAttackReactionsRemaining: number
  movementRemaining: number
  hasCastBonusActionSpell: boolean
}

export interface RuntimeTrackedPart {
  part: 'head' | 'limb'
  currentCount: number
  initialCount: number
  lostSinceLastTurn: number
  lossAppliedThisTurn: number
  damageWindowTurnKey?: string
  damageTakenThisTurn: number
  damageTakenByTypeThisTurn: Record<string, number>
  regrowthSuppressedByDamageTypes: string[]
  loss?: {
    trigger: 'damage-taken-in-single-turn'
    minDamage: number
    count: number
  }
  deathWhenCountReaches?: number
  regrowth?: {
    trigger: 'turn-end'
    requiresLivingPart?: boolean
    countPerPartLostSinceLastTurn: number
    suppressedByDamageTypes?: string[]
    healHitPoints?: number
  }
}

export function createCombatTurnResources(
  movementRemaining = 0,
  opportunityAttackReactionsRemaining = 0,
): CombatantTurnResources {
  return {
    actionAvailable: true,
    bonusActionAvailable: true,
    reactionAvailable: true,
    opportunityAttackReactionsRemaining,
    movementRemaining,
    hasCastBonusActionSpell: false,
  }
}

export interface RollModifierMarker {
  id: string
  label: string
  appliesTo: string | string[]
  modifier: 'advantage' | 'disadvantage'
  duration?: RuntimeMarkerDuration
  sourceInstanceId?: string
  /**
   * When set, the marker only applies when {@link evaluateCondition} is true at roll time.
   * Context: `self` = combatant holding the marker; `source` = the other combatant in the roll pair
   * (e.g. attacker when the marker is on the defender for incoming attacks).
   */
  condition?: Condition
}

export interface StatModifierMarker {
  id: string
  label: string
  target: string
  mode: 'add' | 'set'
  value: number
  duration?: RuntimeMarkerDuration
  /**
   * When set, {@link patchCombatantEquipmentSnapshot} may remove this modifier if equipment
   * no longer matches (e.g. unarmored-only buffs). Set from authored `effect.condition` in apply flow.
   */
  eligibility?: {
    requiresUnarmored?: boolean
  }
  /** Combat AC before applying a set `armor_class` modifier; used to restore when the modifier expires. */
  armorClassBeforeApply?: number
}

export type DamageResistanceLevel = 'resistance' | 'vulnerability' | 'immunity'

export interface DamageResistanceMarker {
  id: string
  damageType: string
  level: DamageResistanceLevel
  sourceId: string
  label: string
  duration?: RuntimeMarkerDuration
}

export interface ConcentrationState {
  spellId: string
  spellLabel: string
  linkedMarkerIds: string[]
  // Encounter-scoped turn counters. When a non-encounter consumer needs duration
  // tracking (exploration, world clock), refactor to a canonical { value, unit }
  // duration with a shared durationToRounds() utility.
  remainingTurns?: number
  totalTurns?: number
}

/** Minimal equipment snapshot for effect `condition` evaluation in encounter (e.g. unarmored gates). */
export type CombatantEquipmentSnapshot = {
  /** Equipped armor item id, or null/undefined when not wearing armor. */
  armorEquipped?: string | null
  /** Optional wield/shield ids (character loadout); monsters may omit. */
  mainHandWeaponId?: string | null
  offHandWeaponId?: string | null
  shieldId?: string | null
}

/** Physical remains after death — drives resurrection / animate targeting. */
export type CombatantRemainsKind = 'corpse' | 'bones' | 'dust' | 'disintegrated'

export interface CombatantInstance {
  instanceId: string
  side: CombatantSide
  source: CombatantSourceRef
  creatureType?: string
  /**
   * Set when the combatant is dead (0 HP): what is left to target for spells.
   * Defaults to `corpse` on first death unless overridden (e.g. disintegrate, death-outcome).
   */
  remains?: CombatantRemainsKind
  /** Encounter `roundNumber` when the creature first reached 0 HP (for Revivify window). */
  diedAtRound?: number
  /** When set (e.g. from character loadout), enables authored `effect.condition` gates that read `equipment.armorEquipped`. */
  equipment?: CombatantEquipmentSnapshot
  stats: CombatantStatBlock
  attacks: CombatantAttackEntry[]
  actions?: CombatActionDefinition[]
  activeEffects: Effect[]
  runtimeEffects: RuntimeEffectInstance[]
  turnHooks: RuntimeTurnHook[]
  trackedParts?: RuntimeTrackedPart[]
  suppressedHooks?: RuntimeMarker[]
  statModifiers?: StatModifierMarker[]
  rollModifiers?: RollModifierMarker[]
  damageResistanceMarkers?: DamageResistanceMarker[]
  concentration?: ConcentrationState
  turnContext?: CombatantTurnContext
  turnResources?: CombatantTurnResources
  /**
   * **Unconditional** condition immunities only (stat block / species baseline).
   * Engine paths (`includes()`, condition application, save shortcuts) treat these as always-on.
   * Do **not** store scoped or source-limited spell grants here — that silently over-blocks conditions.
   * Scoped grants stay on `activeEffects` and derived presentation only until Phase 3 resolution.
   */
  conditionImmunities?: ConditionImmunityId[]
  conditions: RuntimeMarker[]
  states: RuntimeMarker[]
}
