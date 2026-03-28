import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { actionRequiresCreatureTargetForResolve } from '@/features/mechanics/domain/encounter'

import { isAreaGridAction, isSelfCenteredAreaAction, type AoeStep } from '../../helpers/area-grid-action'
import { deriveCombatantTurnExhaustion, type CombatantTurnExhaustionInput } from '../turn/combatant-turn-exhaustion'
import type { GridInteractionMode } from '../interaction/encounter-interaction.types'

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

export type EncounterHeaderDisplayArgs = {
  selectedActionLabel: string | null
  selectedTargetLabel: string | null
}

export type DeriveEncounterHeaderModelArgs = {
  turn: EncounterHeaderTurnArgs
  interaction: EncounterHeaderInteractionArgs
  display: EncounterHeaderDisplayArgs
}

/**
 * Directive copy + End Turn emphasis for the encounter command header.
 * Turn exhaustion comes from {@link deriveCombatantTurnExhaustion}; this function only maps to copy/priority.
 *
 * Priority: move mode → AoE placement/confirm → fully exhausted → target/action guidance → post-action hint.
 */
export function deriveEncounterHeaderModel(args: DeriveEncounterHeaderModelArgs): EncounterHeaderModel {
  const { turn, interaction, display } = args
  const {
    interactionMode,
    selectedActionId,
    selectedAction,
    selectedCasterOptions,
    aoeStep,
    canResolveAction,
    selectedActionRequiresCreatureTarget,
  } = interaction
  const { selectedActionLabel, selectedTargetLabel } = display

  const exhaustion = deriveCombatantTurnExhaustion(turn)
  const movementRemaining = turn.turnResources?.movementRemaining ?? 0
  const actionSpent = turn.turnResources ? !turn.turnResources.actionAvailable : false

  const subtle: EndTurnEmphasis = 'subtle'
  const strong: EndTurnEmphasis = 'strong'

  const defaultEmphasis = (): EndTurnEmphasis =>
    exhaustion.isFullySpent && !canResolveAction ? strong : subtle

  if (interactionMode === 'move') {
    return {
      directive: `Move on the grid — ${movementRemaining} ft remaining`,
      endTurnEmphasis: defaultEmphasis(),
    }
  }

  if (interactionMode === 'single-cell-place') {
    return {
      directive: 'Choose a cell on the grid for placement',
      endTurnEmphasis: subtle,
    }
  }

  if (interactionMode === 'object-anchor-select') {
    return {
      directive: 'Select a battlefield object on the grid',
      endTurnEmphasis: subtle,
    }
  }

  const areaAction =
    selectedAction && isAreaGridAction(selectedAction, selectedCasterOptions) ? selectedAction : null
  const inAoeFlow = Boolean(areaAction && aoeStep !== 'none')
  const selfCentered = Boolean(
    areaAction && isSelfCenteredAreaAction(areaAction, selectedCasterOptions),
  )

  if (inAoeFlow && areaAction) {
    const label = selectedActionLabel ?? 'this area effect'
    if (aoeStep === 'placing' && !selfCentered) {
      return {
        directive: `Select a point for ${label}`,
        endTurnEmphasis: subtle,
      }
    }
    if (aoeStep === 'confirm') {
      return {
        directive: canResolveAction
          ? `Ready — confirm ${label} in the action panel`
          : `Area set — ${label}`,
        endTurnEmphasis: canResolveAction ? subtle : defaultEmphasis(),
      }
    }
  }

  if (exhaustion.isFullySpent && !canResolveAction) {
    return {
      directive: 'Turn complete — end turn when ready',
      endTurnEmphasis: strong,
    }
  }

  const hasActionPick = Boolean(selectedActionId)
  const hasTargetPick = Boolean(selectedTargetLabel)

  if (!hasActionPick && !hasTargetPick) {
    return {
      directive: 'Choose a target or an action',
      endTurnEmphasis: defaultEmphasis(),
    }
  }

  if (hasTargetPick && !hasActionPick) {
    return {
      directive: `Choose an action — targeting ${selectedTargetLabel}`,
      endTurnEmphasis: defaultEmphasis(),
    }
  }

  if (
    hasActionPick &&
    !hasTargetPick &&
    selectedAction &&
    !isAreaGridAction(selectedAction, selectedCasterOptions)
  ) {
    const requiresCreatureTarget =
      selectedActionRequiresCreatureTarget !== undefined
        ? selectedActionRequiresCreatureTarget
        : actionRequiresCreatureTargetForResolve(selectedAction)
    if (!requiresCreatureTarget) {
      return {
        directive: `Finish ${selectedActionLabel ?? 'this action'} in the action panel`,
        endTurnEmphasis: defaultEmphasis(),
      }
    }
    return {
      directive: `Choose a target for ${selectedActionLabel ?? 'this action'}`,
      endTurnEmphasis: defaultEmphasis(),
    }
  }

  if (
    hasActionPick &&
    hasTargetPick &&
    canResolveAction &&
    !isAreaGridAction(selectedAction, selectedCasterOptions)
  ) {
    return {
      directive: `Ready — ${selectedActionLabel ?? 'Action'} → ${selectedTargetLabel}`,
      endTurnEmphasis: subtle,
    }
  }

  if (actionSpent && !canResolveAction && exhaustion.hasAnyPrimaryOptionRemaining) {
    return {
      directive: 'Action used — you can still move, use a bonus action, or react',
      endTurnEmphasis: subtle,
    }
  }

  return {
    directive: hasActionPick && hasTargetPick
      ? `${selectedActionLabel ?? 'Action'} — ${selectedTargetLabel}`
      : 'Continue your turn',
    endTurnEmphasis: defaultEmphasis(),
  }
}
