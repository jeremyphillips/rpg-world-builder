import type { CombatantInstance } from '../state/types'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/perception/perception.types'
import type { Monster } from '@/features/content/monsters/domain/types'

export interface ResolveCombatActionSelection {
  actorId: string
  /**
   * Selected creature for single-target actions. For **creature-anchored** attached emanations
   * (`attachedEmanation.anchorMode === 'creature'`), this id is also the runtime sphere anchor combatant.
   */
  targetId?: string
  actionId: string
  /** Values for {@link CombatActionDefinition.casterOptions}, keyed by field `id`. */
  casterOptions?: Record<string, string>
  /**
   * Grid cell id for the center of an AoE when {@link CombatActionDefinition.areaTemplate} is set, and for
   * **place-anchored** attached emanations (`attachedEmanation.anchorMode === 'place'`) as the persistent
   * sphere center (maps to `BattlefieldEffectAnchor` `{ kind: 'place', cellId }`).
   */
  aoeOriginCellId?: string
  /** Grid cell id for summon placement when the action requires single-cell placement (spawn `single-cell`). */
  singleCellPlacementCellId?: string
  /** Spirit Guardians–style: combatants designated unaffected at cast (stored on attached aura). */
  unaffectedCombatantIds?: string[]
  /**
   * Grid object id (`EncounterSpace.gridObjects`) when {@link CombatActionDefinition.attachedEmanation}.`anchorMode === 'object'`.
   */
  objectId?: string
}

export interface ResolveCombatActionOptions {
  rng?: () => number
  /** Merged ruleset monster catalog — used for `spawn` resolution (ids, random pools). */
  monstersById?: Record<string, Monster>
  /** When set with `monstersById`, `spawn` can instantiate party-side monster combatants. */
  buildSummonAllyCombatant?: (args: { monster: Monster; runtimeId: string }) => CombatantInstance
  /**
   * Called when a spell action is spent. Use to persist character.resources.
   * Set resources[`spell_used_${spellId}`] = 1.
   *
   * KNOWN EDGE CASES:
   * - Warlock pact: Different period (short-rest); would need separate callback or payload.
   */
  onSpellSlotSpent?: (sourceId: string, spellId: string) => void
  /**
   * When true (default), hostile `single-target` actions cannot target same-side combatants (legacy "enemies only").
   * Set false for pure core (friendly fire / PC vs PC on same side allowed). Prefer driving from ruleset `mechanics.combat.encounter.suppressSameSideHostile` in app code.
   */
  suppressSameSideHostileActions?: boolean
  /**
   * Passed into effect resolution for sight-based checks (`CheckEffect.requiresSight`) and other
   * shared-perception call sites that accept `EncounterViewerPerceptionCapabilities`.
   */
  perceptionCapabilities?: EncounterViewerPerceptionCapabilities
}
