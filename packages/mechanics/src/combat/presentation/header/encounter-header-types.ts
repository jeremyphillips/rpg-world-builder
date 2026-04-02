import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'
import type { AoeStep } from '@/features/mechanics/domain/combat/resolution/action/area-grid-action'
import type { CombatantTurnExhaustionInput } from '@/features/mechanics/domain/combat/selectors/turn/combatant-turn-exhaustion'
import type { GridInteractionMode } from '@/features/mechanics/domain/combat/selectors/interaction/encounter-interaction.types'

export type EndTurnEmphasis = 'subtle' | 'strong'

export type EncounterHeaderModel = {
  directive: string
  endTurnEmphasis: EndTurnEmphasis
}

export type EncounterHeaderTurnArgs = {
  combatantActions: CombatantTurnExhaustionInput['combatantActions']
  availableActionIds: CombatantTurnExhaustionInput['availableActionIds']
  turnResources: CombatantTurnExhaustionInput['turnResources']
}

export type EncounterHeaderInteractionArgs = {
  interactionMode: GridInteractionMode
  selectedActionId: string
  selectedAction: CombatActionDefinition | null
  /** Resolves {@link CombatActionDefinition.attachedEmanation} `place-or-object` vs pure place/all-enemies. */
  selectedCasterOptions?: Record<string, string>
  aoeStep: AoeStep
  canResolveAction: boolean
  /**
   * When `false`, the selected action does not use a creature target (e.g. summon with `targeting.none`).
   * When omitted, inferred from {@link actionRequiresCreatureTargetForResolve} so spawn / none-targeting
   * spells are not treated as needing a creature pick.
   */
  selectedActionRequiresCreatureTarget?: boolean
}

/** Mirrors {@link EncounterCapabilities.tonePerspective} — who the header copy speaks to when not acting. */
export type EncounterHeaderTonePerspective = 'self' | 'observer' | 'dm'

export type EncounterHeaderViewerPolicy = {
  viewerMayActOnTurn: boolean
  tonePerspective: EncounterHeaderTonePerspective
}

export type EncounterHeaderDisplayArgs = {
  selectedActionLabel: string | null
  selectedTargetLabel: string | null
  /** Active combatant label — used for observer/DM-safe copy when the viewer is not acting. */
  activeCombatantDisplayLabel: string
}

export type DeriveEncounterHeaderModelArgs = {
  turn: EncounterHeaderTurnArgs
  interaction: EncounterHeaderInteractionArgs
  display: EncounterHeaderDisplayArgs
  viewer: EncounterHeaderViewerPolicy
}
