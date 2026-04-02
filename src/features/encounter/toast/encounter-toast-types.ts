import type { AlertProps } from '@mui/material/Alert'

import type { CombatLogEvent } from '@/features/mechanics/domain/combat'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'
import type { AppAlertTone } from '@/ui/primitives'

/** Structural outcome for policy (no tone). */
export type ActionResolvedOutcomeMeta = {
  hitCount: number
  missCount: number
  hasNat1Miss: boolean
}

export type EncounterToastEventKind = 'action_resolved'

export type EncounterToastEvent =
  | {
      kind: 'action_resolved'
      dedupeKey: string
      events: CombatLogEvent[]
      encounterStateAfter: EncounterState | undefined
      title: string
      narrative: string
      mechanics: string
      outcome: ActionResolvedOutcomeMeta
    }

export type ActionResolvedViewerRelationship =
  | 'actor_controller'
  | 'target_controller'
  | 'dm_observer'
  | 'uninvolved_observer'

export type NormalizedToastViewerContext =
  | { mode: 'simulator' }
  | {
      mode: 'session'
      controlledCombatantIds: string[]
      tonePerspective: 'self' | 'observer' | 'dm'
    }

/** Raw viewer inputs before simulator/session normalization. */
export type EncounterToastViewerInput = {
  viewerMode: 'simulator' | 'session'
  controlledCombatantIds: string[]
  tonePerspective: 'self' | 'observer' | 'dm'
}

/** Per-kind defaults before relationship-specific overrides. */
export type EncounterToastKindDefaults = {
  defaultVariant: AlertProps['variant']
  defaultAutoHideDuration: number | null
  /** Baseline before relationship / event policy (e.g. action_resolved usually shows). */
  defaultShow: boolean
}

/** Policy output: dimensions stay explicit (not one opaque blob). */
export type EncounterToastPolicyDimensions = {
  show: boolean
  tone: AppAlertTone
  variant: AlertProps['variant']
  autoHideDuration: number | null
}

/** Final props for AppToast (presentation). */
export type EncounterToastPresentation = {
  title: string
  children: string
  mechanics: string | undefined
  tone: AppAlertTone
  variant: AlertProps['variant']
  autoHideDuration: number | null
  dedupeKey: string
}
