import type { AppAlertTone } from '@/ui/primitives'

import { deriveLegacyActorOnlyTone } from '../helpers/actions/encounter-action-toast'

import type {
  ActionResolvedOutcomeMeta,
  ActionResolvedViewerRelationship,
  EncounterToastPolicyDimensions,
} from './encounter-toast-types'

function toneForTargetController(outcome: ActionResolvedOutcomeMeta): AppAlertTone {
  const { hitCount: h, missCount: m, hasNat1Miss } = outcome
  if (h > 0 && m === 0) return 'warning'
  if (h === 0 && m > 0) return hasNat1Miss ? 'success' : 'success'
  if (h > 0 && m > 0) return 'warning'
  return 'info'
}

/**
 * Relationship + outcome → explicit policy dimensions (tone, show, variant, autoHide).
 * Does not merge per-kind defaults — caller merges via {@link getEncounterToastKindDefaults}.
 */
export function applyActionResolvedPolicyDimensions(
  outcome: ActionResolvedOutcomeMeta,
  relationship: ActionResolvedViewerRelationship,
): EncounterToastPolicyDimensions {
  switch (relationship) {
    case 'actor_controller':
      return {
        show: true,
        tone: deriveLegacyActorOnlyTone(outcome),
        variant: 'standard',
        autoHideDuration: 8000,
      }
    case 'target_controller':
      return {
        show: true,
        tone: toneForTargetController(outcome),
        variant: 'standard',
        autoHideDuration: 8000,
      }
    case 'dm_observer':
      return {
        show: true,
        tone: 'info',
        variant: 'standard',
        autoHideDuration: 8000,
      }
    case 'uninvolved_observer':
      return {
        show: false,
        tone: 'info',
        variant: 'standard',
        autoHideDuration: 8000,
      }
  }
}
