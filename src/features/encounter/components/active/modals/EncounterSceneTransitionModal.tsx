import type { ReactNode } from 'react'

import { AppModal } from '@/ui/patterns'

/** Reserved for future kind-specific visuals, analytics, or copy presets — not required for rendering today. */
export type EncounterSceneTransitionKind =
  | 'stairs'
  | 'door'
  | 'portal'
  | 'location'
  | 'generic'

export type EncounterSceneTransitionModalProps = {
  open: boolean
  /** Primary line; defaults to neutral scene-change copy. */
  title?: string
  /** Destination or next scene (e.g. space name, floor label). */
  subtitle?: string
  /** Optional clarifier — callers supply copy (e.g. movement affordance); keep base component stairs-agnostic. */
  detail?: string
  headlineIcon?: ReactNode
  /** Shows AppModal’s loading overlay + spinner when true. */
  loading?: boolean
  transitionKind?: EncounterSceneTransitionKind
}

const DEFAULT_TITLE = 'Changing scene'

/**
 * Short-lived, non-dismissible overlay for encounter scene changes (stairs, doors, portals, etc.).
 * Wraps {@link AppModal} so call sites reason about transition semantics, not modal plumbing.
 *
 * TODO: Richer visuals per `transitionKind`; optional min display time to avoid sub-frame flashes.
 * TODO: Error/retry if a future async hydration path can fail mid-transition.
 * TODO: aria-live / assertive announcements if we need stronger screen-reader signaling beyond the dialog label.
 */
export function EncounterSceneTransitionModal({
  open,
  title = DEFAULT_TITLE,
  subtitle,
  detail,
  headlineIcon,
  loading = true,
  transitionKind: _transitionKind,
}: EncounterSceneTransitionModalProps) {
  return (
    <AppModal
      open={open}
      onClose={() => {}}
      size="compact"
      headline={title}
      headlineIcon={headlineIcon}
      subheadline={subtitle}
      description={detail}
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEsc={false}
      dividers={false}
      loading={loading}
      ariaLabel={title}
    />
  )
}
