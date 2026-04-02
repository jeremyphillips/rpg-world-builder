import { deriveCombatantTurnExhaustion } from '@/features/mechanics/domain/combat/selectors/turn/combatant-turn-exhaustion'

import type { EncounterHeaderPhase } from './encounter-header-phase'
import { resolveEncounterHeaderPhase } from './encounter-header-phase'
import type {
  DeriveEncounterHeaderModelArgs,
  EncounterHeaderModel,
  EncounterHeaderTonePerspective,
  EndTurnEmphasis,
} from './encounter-header-types'
export type {
  DeriveEncounterHeaderModelArgs,
  EncounterHeaderDisplayArgs,
  EncounterHeaderInteractionArgs,
  EncounterHeaderModel,
  EncounterHeaderTonePerspective,
  EncounterHeaderTurnArgs,
  EncounterHeaderViewerPolicy,
  EndTurnEmphasis,
} from './encounter-header-types'

export { resolveEncounterHeaderPhase, type EncounterHeaderPhase } from './encounter-header-phase'

function defaultEmphasis(
  exhaustion: ReturnType<typeof deriveCombatantTurnExhaustion>,
  canResolveAction: boolean,
): EndTurnEmphasis {
  return exhaustion.isFullySpent && !canResolveAction ? 'strong' : 'subtle'
}

function actorDirectiveForPhase(
  phase: EncounterHeaderPhase,
  ctx: {
    canResolveAction: boolean
    exhaustion: ReturnType<typeof deriveCombatantTurnExhaustion>
  },
): EncounterHeaderModel {
  const { canResolveAction, exhaustion } = ctx
  const subtle: EndTurnEmphasis = 'subtle'
  const strong: EndTurnEmphasis = 'strong'
  const de = (): EndTurnEmphasis => defaultEmphasis(exhaustion, canResolveAction)

  switch (phase.kind) {
    case 'move':
      return {
        directive: `Move on the grid — ${phase.movementRemainingFt} ft remaining`,
        endTurnEmphasis: de(),
      }
    case 'singleCellPlace':
      return { directive: 'Choose a cell on the grid for placement', endTurnEmphasis: subtle }
    case 'objectAnchorSelect':
      return { directive: 'Select a battlefield object on the grid', endTurnEmphasis: subtle }
    case 'areaPlacing':
      return { directive: `Select a point for ${phase.label}`, endTurnEmphasis: subtle }
    case 'areaConfirm':
      return {
        directive: phase.canResolveAction
          ? `Ready — confirm ${phase.label} in the action panel`
          : `Area set — ${phase.label}`,
        endTurnEmphasis: phase.canResolveAction ? subtle : de(),
      }
    case 'turnExhausted':
      return { directive: 'Turn complete — end turn when ready', endTurnEmphasis: strong }
    case 'selectionIdle':
      return { directive: 'Choose a target or an action', endTurnEmphasis: de() }
    case 'targetOnly':
      return {
        directive: `Choose an action — targeting ${phase.targetLabel}`,
        endTurnEmphasis: de(),
      }
    case 'actionFinishInPanel':
      return {
        directive: `Finish ${phase.actionLabel} in the action panel`,
        endTurnEmphasis: de(),
      }
    case 'actionNeedsTarget':
      return {
        directive: `Choose a target for ${phase.actionLabel}`,
        endTurnEmphasis: de(),
      }
    case 'readyToResolve':
      return {
        directive: `Ready — ${phase.actionLabel} → ${phase.targetLabel}`,
        endTurnEmphasis: subtle,
      }
    case 'postActionHint':
      return {
        directive: 'Action used — you can still move, use a bonus action, or react',
        endTurnEmphasis: subtle,
      }
    case 'fallback': {
      const { hasActionPick, hasTargetPick, actionLabel, targetLabel } = phase
      return {
        directive:
          hasActionPick && hasTargetPick
            ? `${actionLabel ?? 'Action'} — ${targetLabel}`
            : 'Continue your turn',
        endTurnEmphasis: de(),
      }
    }
  }
}

function observerDmDirectiveForPhase(
  phase: EncounterHeaderPhase,
  name: string,
  tone: EncounterHeaderTonePerspective,
): EncounterHeaderModel {
  const subtle: EndTurnEmphasis = 'subtle'
  const isDm = tone === 'dm'

  const active = (detail: string) =>
    isDm ? `Active turn — ${name} (${detail})` : `${name} — ${detail}`

  switch (phase.kind) {
    case 'move':
      return {
        directive: isDm
          ? `Active turn — ${name} (moving; ${phase.movementRemainingFt} ft remaining)`
          : `${name} — ${phase.movementRemainingFt} ft of movement remaining`,
        endTurnEmphasis: subtle,
      }
    case 'singleCellPlace':
      return {
        directive: active('placing on the grid'),
        endTurnEmphasis: subtle,
      }
    case 'objectAnchorSelect':
      return {
        directive: active('selecting a battlefield object'),
        endTurnEmphasis: subtle,
      }
    case 'areaPlacing':
      return {
        directive: active(`placing ${phase.label}`),
        endTurnEmphasis: subtle,
      }
    case 'areaConfirm':
      return {
        directive: phase.canResolveAction
          ? active(`${phase.label} — ready to confirm`)
          : active(`${phase.label} area set`),
        endTurnEmphasis: subtle,
      }
    case 'turnExhausted':
      return {
        directive: isDm ? `Active turn — ${name} (turn complete)` : `${name}'s turn is complete`,
        endTurnEmphasis: subtle,
      }
    case 'selectionIdle':
      return {
        directive: isDm ? `Active turn — ${name}` : `Watching ${name}'s turn`,
        endTurnEmphasis: subtle,
      }
    case 'targetOnly':
      return {
        directive: active(`targeting ${phase.targetLabel}`),
        endTurnEmphasis: subtle,
      }
    case 'actionFinishInPanel':
      return {
        directive: active(phase.actionLabel),
        endTurnEmphasis: subtle,
      }
    case 'actionNeedsTarget':
      return {
        directive: active(`needs target for ${phase.actionLabel}`),
        endTurnEmphasis: subtle,
      }
    case 'readyToResolve':
      return {
        directive: active(`${phase.actionLabel} → ${phase.targetLabel}`),
        endTurnEmphasis: subtle,
      }
    case 'postActionHint':
      return {
        directive: isDm
          ? `Active turn — ${name} (action used; can still move, bonus action, or react)`
          : `${name} — action used; can still move or use a bonus action`,
        endTurnEmphasis: subtle,
      }
    case 'fallback': {
      const { hasActionPick, hasTargetPick, actionLabel, targetLabel } = phase
      if (hasActionPick && hasTargetPick && actionLabel && targetLabel) {
        return {
          directive: active(`${actionLabel} → ${targetLabel}`),
          endTurnEmphasis: subtle,
        }
      }
      return {
        directive: isDm ? `Active turn — ${name}` : `${name}'s turn`,
        endTurnEmphasis: subtle,
      }
    }
  }
}

/**
 * Directive copy + End Turn emphasis for the encounter command header.
 * Turn exhaustion comes from {@link deriveCombatantTurnExhaustion}; phase resolution from
 * {@link resolveEncounterHeaderPhase}; viewer policy gates actor-imperative vs observer/DM-safe copy.
 */
export function deriveEncounterHeaderModel(args: DeriveEncounterHeaderModelArgs): EncounterHeaderModel {
  const { turn, interaction, display, viewer } = args

  const phase = resolveEncounterHeaderPhase({
    turn,
    interaction,
    display: {
      selectedActionLabel: display.selectedActionLabel,
      selectedTargetLabel: display.selectedTargetLabel,
    },
  })

  const exhaustion = deriveCombatantTurnExhaustion(turn)
  const canResolveAction = interaction.canResolveAction

  if (viewer.viewerMayActOnTurn) {
    return actorDirectiveForPhase(phase, { canResolveAction, exhaustion })
  }

  return observerDmDirectiveForPhase(phase, display.activeCombatantDisplayLabel, viewer.tonePerspective)
}
