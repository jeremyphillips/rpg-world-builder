import type { AlertProps } from '@mui/material/Alert'

import type { CombatLogEvent } from '@/features/mechanics/domain/combat'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'
import type { AppAlertTone } from '@/ui/primitives'

import { buildActionResolvedNeutralContent } from '../helpers/actions/encounter-action-toast'

import { deriveActionResolvedViewerRelationship } from './derive-viewer-relationship'
import { applyActionResolvedPolicyDimensions } from './encounter-toast-policy'
import { getEncounterToastKindDefaults } from './encounter-toast-defaults'
import { normalizeToastViewerContext } from './normalize-toast-viewer'
import type {
  EncounterToastEvent,
  EncounterToastPresentation,
  EncounterToastViewerInput,
} from './encounter-toast-types'

function mergeWithKindDefaults(
  kind: 'action_resolved',
  policy: {
    show: boolean
    tone: AppAlertTone
    variant: AlertProps['variant']
    autoHideDuration: number | null
  },
): {
  show: boolean
  tone: AppAlertTone
  variant: AlertProps['variant']
  autoHideDuration: number | null
} {
  const defaults = getEncounterToastKindDefaults(kind)
  return {
    show: policy.show && defaults.defaultShow,
    tone: policy.tone,
    variant: policy.variant ?? defaults.defaultVariant,
    autoHideDuration: policy.autoHideDuration ?? defaults.defaultAutoHideDuration,
  }
}

/**
 * Full pipeline: neutral content → event → relationship → policy → presentation (or suppress).
 */
export function deriveEncounterToastForViewer(
  events: CombatLogEvent[],
  stateAfter: EncounterState | undefined,
  viewerInput: EncounterToastViewerInput,
): EncounterToastPresentation | null {
  const neutral = buildActionResolvedNeutralContent(events, stateAfter)
  if (!neutral) return null

  const event: EncounterToastEvent = {
    kind: 'action_resolved',
    dedupeKey: neutral.dedupeKey,
    events,
    encounterStateAfter: stateAfter,
    title: neutral.title,
    narrative: neutral.narrative,
    mechanics: neutral.mechanics,
    outcome: neutral.outcome,
  }

  const normalized = normalizeToastViewerContext(viewerInput)
  const relationship = deriveActionResolvedViewerRelationship(events, normalized)
  const rawPolicy = applyActionResolvedPolicyDimensions(event.outcome, relationship)
  const merged = mergeWithKindDefaults('action_resolved', rawPolicy)

  if (!merged.show) return null

  return {
    title: event.title,
    children: event.narrative,
    mechanics: event.mechanics.trim() ? event.mechanics : undefined,
    tone: merged.tone,
    variant: merged.variant,
    autoHideDuration: merged.autoHideDuration,
    dedupeKey: event.dedupeKey,
  }
}
