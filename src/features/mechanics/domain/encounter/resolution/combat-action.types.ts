import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { AbilityId } from '@/features/mechanics/domain/character'
import type { BreakdownToken } from '../../resolution/resolvers/stat-resolver'
import type { CasterOptionField } from '../../spells/caster-options'

export type CombatActionKind =
  | 'weapon-attack'
  | 'monster-action'
  | 'spell'
  | 'combat-effect'

export type CombatActionResolutionMode = 'attack-roll' | 'saving-throw' | 'effects' | 'log-only'

export interface CombatActionCost {
  action?: boolean
  bonusAction?: boolean
  reaction?: boolean
  movementFeet?: number
}

export interface CombatActionAttackProfile {
  attackBonus: number
  attackBreakdown?: BreakdownToken[]
  damage?: string
  damageType?: string
  damageBreakdown?: BreakdownToken[]
}
 
export interface CombatActionSequenceStep {
  actionLabel: string
  count: number
  countFromTrackedPart?: 'head' | 'limb'
}

export interface CombatActionSaveProfile {
  ability: AbilityId
  dc: number
  halfDamageOnSave?: boolean
}

export interface CombatActionTargetingProfile {
  kind:
    | 'single-target'
    | 'all-enemies'
    | 'entered-during-move'
    | 'self'
    | 'single-creature'
    | 'dead-creature'
    /** No creature target (e.g. ally summon); resolver applies effects without a selected target. */
    | 'none'
  creatureTypeFilter?: string[]
  /**
   * "Willing creature" touch buffs: valid targets are same-side only (caster + allies). For now this is the ally approximation.
   * Non-hostile for charm/hostile-action rules.
   */
  requiresWilling?: boolean
  /**
   * From spell targeting metadata: “creature you can see.” Validated via {@link canSeeForTargeting}
   * (blinded, invisible vs See Invisibility, LOS/LoE stubs). Ignored for `self` and `all-enemies` in the resolver.
   */
  requiresSight?: boolean
}

export interface CombatActionMovementProfile {
  upToSpeed?: boolean
  upToSpeedFraction?: 0.5 | 1
  noOpportunityAttacks?: boolean
  canEnterCreatureSpaces?: boolean
  targetSizeMax?: string
  straightTowardVisibleEnemy?: boolean
}

export interface CombatActionUsage {
  recharge?: {
    min: number
    max: number
    ready: boolean
  }
  /**
   * Limited-use actions (e.g. spell slots). period 'day' = long-rest reset.
   *
   * KNOWN EDGE CASES:
   * - Warlock pact: Would need period 'short-rest' and separate resource keys.
   * - Cantrips: Omit usage (unlimited).
   */
  uses?: {
    max: number
    remaining: number
    period: 'day'
  }
}

export type CombatActionDisplayMeta =
  | { source: 'weapon'; range?: string }
  | { source: 'spell'; spellId: string; level: number; concentration: boolean; concentrationDurationTurns?: number; range: string; summary?: string }
  | { source: 'natural'; attackType: string; reach?: number; description?: string }

export interface CombatActionDefinition {
  id: string
  label: string
  kind: CombatActionKind
  cost: CombatActionCost
  resolutionMode: CombatActionResolutionMode
  attackProfile?: CombatActionAttackProfile
  damage?: string
  damageType?: string
  saveProfile?: CombatActionSaveProfile
  targeting?: CombatActionTargetingProfile
  movement?: CombatActionMovementProfile
  usage?: CombatActionUsage
  effects?: Effect[]
  onHitEffects?: Effect[]
  onFailEffects?: Effect[]
  onSuccessEffects?: Effect[]
  sequence?: CombatActionSequenceStep[]
  /** When set with `aboveThresholdEffects`, `effects` apply if target current HP ≤ maxHp; otherwise `aboveThresholdEffects` apply. */
  hpThreshold?: { maxHp: number }
  aboveThresholdEffects?: Effect[]
  logText?: string
  displayMeta?: CombatActionDisplayMeta
  /**
   * Spell-derived: whether the action is a hostile application for charm / same-side targeting rules.
   * When set (spell actions from `buildSpellCombatActions`), `isHostileAction` uses this; otherwise legacy `targeting` kind rules apply.
   */
  hostileApplication?: boolean
  /** From spell `resolution.casterOptions`; encounter UI collects values before resolve. */
  casterOptions?: CasterOptionField[]
}
