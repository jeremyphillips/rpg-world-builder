import type { Condition } from '@/features/mechanics/domain/conditions/condition.types'
import type { ConditionImmunityId } from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import type { AbilityKey, AbilityRef } from '@/features/mechanics/domain/character'
import type { BreakdownToken } from '@/features/mechanics/domain/resolution/resolvers/stat-resolver'
import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'

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

/** 0 = none, 1 = proficient, 2 = expertise (same semantics as character `ProficiencyLevel`). */
export type CombatantSkillProficiencyLevel = 0 | 1 | 2

/**
 * Minimal Perception / Stealth runtime seam for encounter rules (no generalized skill engine).
 * Populated by character/monster combatant builders; stealth rules read only this plus ability scores.
 */
/**
 * Feat/trait-sourced inputs for hide eligibility (`sight-hide-rules` / `combatant-hide-eligibility.ts`).
 * Extend with new optional booleans as hide rules grow; keep in sync with `CombatantHideEligibilityExtension.featureFlags`.
 */
export type CombatantHideEligibilityFeatureFlagsRuntime = {
  allowHalfCoverForHide?: boolean
  /** Dim light alone (`lightingLevel === 'dim'`) counts as hide basis only when set — not universal. */
  allowDimLightHide?: boolean
  /**
   * Magically tagged **light** obscurement (`visibilityObscured === 'light'` and merged `world.magical`).
   * Natural (non-magical) light obscurement remains baseline for everyone; see `sight-hide-rules.ts`.
   */
  allowMagicalConcealmentHide?: boolean
  /**
   * **Difficult terrain** on the hider’s merged cell (`terrainMovement` **`difficult`** or **`greater-difficult`**)
   * counts as hide world basis (brush, rubble). Entry + sustain; hider cell only, not observer-relative.
   */
  allowDifficultTerrainHide?: boolean
  /**
   * **High wind** on the hider’s merged cell (`atmosphereTags` includes **`high-wind`**) counts as hide
   * world basis (dust, noise). Entry + sustain; hider cell only.
   */
  allowHighWindHide?: boolean
}

/**
 * Snapshot of authored senses on a combatant (e.g. from monster stat block). Used for darkvision / blindsight
 * range in viewer perception; optional on PCs until character/race wiring exists.
 */
export type CombatantSensesSnapshot = {
  special?: Array<{ type: string; range?: number; notes?: string }>
  passivePerception?: number
}

export type CombatantSkillRuntimeSnapshot = {
  /** Ruleset or creature proficiency bonus; used as `bonus × proficiencyLevel` for skills when deriving modifiers. */
  proficiencyBonus?: number
  /** Wisdom (Perception): proficiency level for passive Perception derivation. */
  perceptionProficiencyLevel?: CombatantSkillProficiencyLevel
  /** Dexterity (Stealth): proficiency level for Stealth check modifier derivation. */
  stealthProficiencyLevel?: CombatantSkillProficiencyLevel
  /** Authoritative passive Perception when authored (e.g. monster senses). Takes precedence over derivation. */
  passivePerception?: number
  /** From authored senses (e.g. monster `darkvision` range); feeds encounter viewer perception only. */
  darkvisionRangeFt?: number
  /** When set, Stealth check uses this total modifier instead of Dex + proficiency contribution. */
  stealthCheckModifierOverride?: number
  /**
   * Authoring-time hide-eligibility flags (feats/traits from builders). OR-merged in
   * `getCombatantHideEligibilityExtensionOptions` with temporary `activeEffects` / marker grants — not
   * the persisted stealth snapshot (see `stealth.hideEligibility`).
   */
  hideEligibilityFeatureFlags?: CombatantHideEligibilityFeatureFlagsRuntime
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
  /** Perception / Stealth proficiency thread; preferred source for passive Perception and Stealth modifiers. */
  skillRuntime?: CombatantSkillRuntimeSnapshot
  /** Legacy/explicit passive Perception on stats (e.g. tests). Precedence: `skillRuntime.passivePerception` then this field. */
  passivePerception?: number
}

export interface RuntimeMarkerDuration {
  remainingTurns: number
  tickOn: TurnBoundary
}

export interface RuntimeMarker {
  /** Semantic condition/state id (matches mechanics vocabulary); prefer for presentation lookup. */
  id: string
  /** Not canonical user-facing copy; encounter UI resolves via `resolveEffectPresentation` / `enrichWithPresentation`. */
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
  /** Feet moved this turn; used with spatial speed changes (attached auras) to reconcile remaining movement. */
  movementSpentThisTurn?: number
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
  /**
   * Human-readable hint for logs, authoring, or debug — not authoritative for encounter UI.
   * Encounter badge surfaces derive display text from `level` + `damageType` (see encounter defense badges).
   */
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
  /** Gear item ids carried (e.g. `thieves-tools`); populated from character equipment for PCs/NPCs. */
  gearIds?: string[]
}

/** Physical remains after death — drives resurrection / animate targeting. */
export type CombatantRemainsKind = 'corpse' | 'bones' | 'dust' | 'disintegrated'

/**
 * Recorded when damage (or equivalent) reduces a creature to 0 HP and defeat is finalized.
 * Not applied when a trait stabilizes the creature (e.g. Undead Fortitude → 1 HP).
 * Semantic helpers live in `combatant-participation.ts`.
 */
export type CombatantDeathRecord = {
  remains: CombatantRemainsKind
  diedAtRound: number
}

/** Set when a replacement spawn (e.g. Animate Dead) consumes the corpse; combatant row stays for history. */
export type RemainsConsumptionRecord = {
  atRound: number
  spawnInstanceId?: string
}

/**
 * Derived effective participation / presence / capability for turn handling — computed from
 * {@link CombatantInstance} via `getCombatantTurnStatus` in `combatant-participation.ts`.
 * **Not persisted** on the combatant; not initiative-row presentation (`TurnOrderStatus`);
 * not timing (`TurnBoundary`, duration helpers).
 */
export type CombatantTurnStatus = {
  isDefeated: boolean
  isDead: boolean

  hasBattlefieldPresence: boolean
  occupiesGrid: boolean
  canBeTargetedOnGrid: boolean

  canTakeActions: boolean
  canTakeBonusActions: boolean
  canTakeReactions: boolean
  canMove: boolean

  shouldAutoSkipTurn: boolean
  /**
   * When `shouldAutoSkipTurn` is true. Precedence: banished / off-grid → remains-consumed (defeated) → defeated → cannot-act.
   */
  skipReason?: 'defeated' | 'cannot-act' | 'banished' | 'off-grid' | 'remains-consumed'

  /** Matches “alive for initiative re-roll” (`HP > 0`, see `buildAliveInitiativeParticipants`). */
  remainsInInitiative: boolean
}

/**
 * Hide eligibility extension flags persisted on stealth — same semantic shape as
 * `HideEligibilityExtensionOptions` / `cellWorldSupportsHideAttemptWorldBasis` in `sight-hide-rules.ts`
 * (import cycle avoided by duplicating the minimal surface here).
 */
export type CombatantHideEligibilityExtension = {
  featureFlags?: {
    allowHalfCoverForHide?: boolean
    allowDimLightHide?: boolean
    allowMagicalConcealmentHide?: boolean
    allowDifficultTerrainHide?: boolean
    allowHighWindHide?: boolean
  }
}

/**
 * Observer-relative **non-visual** location hints (e.g. sound). Does **not** grant sight or satisfy
 * requires-sight targeting — see `awareness-rules.ts` and `canSeeForTargeting`.
 */
export interface CombatantAwarenessRuntime {
  /**
   * Observer combatant id → **grid cell id** this observer currently attributes to the subject.
   * Cleared for a pair when the observer can **perceive the subject’s occupant** (vision supersedes).
   */
  guessedCellByObserverId?: Record<string, string>
}

/**
 * Observer-relative stealth bookkeeping on the **subject** (hider). Not a substitute for perception
 * (`canPerceiveTargetOccupantForCombat` remains the sight seam); stealth layers rules that need
 * hidden-state semantics. Extend with metadata later without reshaping `CombatantInstance`.
 */
export interface CombatantStealthRuntime {
  /**
   * Observers for whom this combatant is treated as **hidden** (runtime stealth), subject to
   * reconciliation with perception in `stealth-rules.ts`.
   */
  hiddenFromObserverIds: string[]
  /**
   * Eligibility extension flags in effect for this hider (e.g. from successful hide resolution or
   * manual application). **Stealth sustain** merges persisted values before call-site `StealthRulesOptions`
   * so feat-style hide matches reconciliation after the hide succeeds.
   */
  hideEligibility?: CombatantHideEligibilityExtension
}

export interface CombatantInstance {
  instanceId: string
  side: CombatantSide
  source: CombatantSourceRef
  /** Optional authored senses (e.g. monster `senses.special`); preferred source for darkvision range in perception. */
  senses?: CombatantSensesSnapshot
  /**
   * Portrait media key at roster/build time (storage key or `/…` path). Not a resolved CDN URL.
   * Presentation uses `resolveImageUrl`; keeps encounter state stable across URL strategy changes.
   */
  portraitImageKey?: string | null
  creatureType?: string
  /**
   * Aftermath once a death record exists (lethal 0 HP). Semantics by helper:
   * - **Living:** usually `undefined` (no corpse on the field).
   * - **Defeated with record:** concrete kind (`corpse`, `bones`, `dust`, …).
   * - **`undefined` at 0 HP:** possible only in synthetic/test state; `canTargetAsDeadCreature`
   *   treats that as implicit corpse for spells; `hasRemainsOnGrid` stays false until explicit `remains`.
   * Mutated by lethal damage (e.g. disintegrate) and `death-outcome` effects (e.g. turns-to-dust).
   */
  remains?: CombatantRemainsKind
  /**
   * When set, tactical remains were consumed (e.g. replacement spawn); targeting/presence helpers
   * treat the body as gone. Does **not** remove this combatant from `combatantsById` or logs.
   */
  remainsConsumed?: RemainsConsumptionRecord
  /**
   * **Death record** — set when damage (etc.) applies a lethal crossing to 0 HP in resolution.
   * **Truth source for “dead” in code** (`isDeadCombatant`): not the same as “defeated” (`HP ≤ 0`).
   * Cleared when healing brings `currentHitPoints` above 0 (revival). Used for revival windows (e.g. Revivify).
   */
  diedAtRound?: number
  /** When set (e.g. from character loadout), enables authored `effect.condition` gates that read `equipment.armorEquipped`. */
  equipment?: CombatantEquipmentSnapshot
  /**
   * Tool proficiencies granted at combatant build (e.g. from class definitions). Used for Pick Lock eligibility.
   * Ids align with system gear / class `proficiencies.tools.items` (e.g. `thieves-tools`).
   */
  grantedToolProficiencies?: readonly string[]
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
  /**
   * Grid cell to return to when the creature re-enters the map after temporary battlefield absence
   * (e.g. banished, off-grid). Set when placement is cleared; cleared after a successful restore placement.
   */
  battlefieldReturnCellId?: string
  /**
   * Stealth / hidden-from-observers state (wrapper for future round/source/debug fields).
   * Owned and mutated only via `stealth-rules.ts`.
   */
  stealth?: CombatantStealthRuntime
  /**
   * Sound / guessed-cell awareness (observer-relative). Owned and mutated via `awareness-rules.ts`.
   * Independent of `stealth` — a subject may be hidden and still have guessed cells for some observers.
   */
  awareness?: CombatantAwarenessRuntime
  conditions: RuntimeMarker[]
  states: RuntimeMarker[]
}
