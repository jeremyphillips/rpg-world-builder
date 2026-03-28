import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { AttachedEnvironmentZoneProfile } from '../environment/environment.types'
import type { AttachedBattlefieldEffectSource } from '../state/auras/attached-battlefield-source'
import type { AbilityId } from '@/features/mechanics/domain/character'
import type { BreakdownToken } from '../../resolution/resolvers/stat-resolver'
import type { CasterOptionField } from '../../spells/caster-options'

export type CombatActionKind =
  | 'weapon-attack'
  | 'monster-action'
  | 'spell'
  | 'combat-effect'

export type CombatActionResolutionMode = 'attack-roll' | 'saving-throw' | 'effects' | 'log-only' | 'hide'

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

/** When `resolutionMode === 'hide'`, Stealth modifier for the d20 roll (omit to use dex-based default from resolver). */
export type CombatActionHideProfile = {
  stealthModifier?: number
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
   * Maximum range in feet for spatial targeting validation.
   * When set and the encounter has spatial data, targets beyond this distance are excluded.
   * Undefined = no range limit (backwards-compatible with non-spatial encounters).
   */
  rangeFt?: number
  /**
   * "Willing creature" touch buffs: valid targets are same-side only (caster + allies). For now this is the ally approximation.
   * Non-hostile for charm/hostile-action rules.
   */
  requiresWilling?: boolean
  /**
   * From spell targeting metadata: “creature you can see.” Validated via {@link canSeeForTargeting} (delegates
   * to `canPerceiveTargetOccupantForCombat` in `combatant-pair-visibility.ts`) — same seam as attack-roll
   * visibility: **occupant** perception (not cell-only), including world/perception (heavy obscurement,
   * magical darkness) after blinded / invisible vs See Invisibility / LOS. Ignored for `self` and `all-enemies`
   * in the resolver.
   */
  requiresSight?: boolean
  /**
   * When **`requiresSight`** is false/undefined: whether an observer may target using **guessed cell**
   * awareness on the subject (`CombatantAwarenessRuntime`) when they cannot **`canSeeForTargeting`** the
   * occupant. Defaults **true** — “fully unknown” location fails; **false** forces sight-only (same as
   * requiring visible occupant) without setting **`requiresSight`**.
   */
  allowGuessedLocationWhenUnseen?: boolean
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

/** First-pass AoE: grid placement uses Chebyshev distance as a sphere approximation. */
export type CombatActionAreaTemplate =
  | { kind: 'sphere'; radiusFt: number }
  | { kind: 'cube'; edgeFt: number }

/**
 * Where a persistent attached emanation should be anchored in space (action-level intent).
 * Distinct from {@link AttachedBattlefieldEffectSource}, which identifies authored rules.
 */
export type EmanationAnchorMode = 'caster' | 'place' | 'creature' | 'object' | 'place-or-object'

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
  /** When `resolutionMode === 'hide'`: rolled Stealth total = d20 + modifier from profile or dex-based default. */
  hideProfile?: CombatActionHideProfile
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
   * Save DC for effect payloads (8 + PB + ability for spells; monster action save DC when authored).
   * Used when persisting attached auras that resolve interval saves later (e.g. Spirit Guardians).
   */
  saveDc?: number
  /**
   * Spell-derived: whether the action is a hostile application for charm / same-side targeting rules.
   * When set (spell actions from `buildSpellCombatActions`), `isHostileAction` uses this; otherwise legacy `targeting` kind rules apply.
   */
  hostileApplication?: boolean
  /** From spell `resolution.casterOptions`; encounter UI collects values before resolve. */
  casterOptions?: CasterOptionField[]
  /**
   * When set, `all-enemies` resolution filters to creatures in this area on the grid (requires `aoeOriginCellId` in selection).
   * Omit for legacy “all enemies in spell range” without geometry.
   */
  areaTemplate?: CombatActionAreaTemplate
  /** Remote grid point vs centered on caster (self-range emanation). */
  areaPlacement?: 'remote' | 'self'
  /**
   * Persistent emanation metadata for encounter setup (e.g. Spirit Guardians): cast-time unaffected setup + battlefield aura.
   * Does not replace `areaTemplate` / `all-enemies` for targeting metadata.
   *
   * **`anchorMode`:** `caster` → creature-on-caster; `place` → `aoeOriginCellId`; `creature` → `targetId`;
   * `object` → `objectId` (grid obstacle id).
   */
  attachedEmanation?: {
    source: AttachedBattlefieldEffectSource
    radiusFt: number
    /** Always set by spell/monster adapters (`false` when omitted on authored `emanation`). */
    selectUnaffectedAtCast: boolean
    anchorMode: EmanationAnchorMode
    /**
     * When `anchorMode === 'place-or-object'`, the `casterOptions` field id (enum) whose value is `place` or
     * `object`, selecting between point-in-space vs grid obstacle anchor at cast time.
     */
    anchorChoiceFieldId?: string
    /**
     * When set, copied onto the persisted battlefield effect row so environment zone reconciliation can
     * project world coverage (e.g. magical darkness) from authored metadata.
     */
    environmentZoneProfile?: AttachedEnvironmentZoneProfile
  }
}

/** Standard Hide action: `resolutionMode: 'hide'` rolls Stealth and resolves vs passive Perception in the resolver. */
export const DEFAULT_HIDE_COMBAT_ACTION: CombatActionDefinition = {
  id: 'combat-hide',
  label: 'Hide',
  kind: 'combat-effect',
  cost: { action: true },
  resolutionMode: 'hide',
  targeting: { kind: 'self' },
}
