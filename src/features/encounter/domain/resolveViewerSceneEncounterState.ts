import type { EncounterState } from '@/features/mechanics/domain/combat'

import type { SceneFocus } from './sceneFocus.types'

/**
 * Resolves which {@link EncounterState} the **viewer’s** grid and scene-aligned presentation
 * should use, given authoritative encounter state and viewer-local {@link SceneFocus}.
 *
 * - **Authoritative** `EncounterState` from mechanics / hydration is always the truth for
 *   combat resolution, intents, and persistence (including multi-space `spacesById` + per-placement
 *   `encounterSpaceId` when present).
 * - **Presentation** state may diverge when `sceneFocus` pins a different tactical space than
 *   `authoritative.space` (future); Phase A returns the authoritative state unchanged for
 *   `followEncounterSpace`.
 *
 * Callers should pass the result into grid view models, scene-aligned perception, and other
 * **display-only** paths — not into `applyCombatIntent` / persisted intent pipelines.
 */
export function resolveViewerSceneEncounterState(
  authoritative: EncounterState | null,
  sceneFocus: SceneFocus,
): EncounterState | null {
  if (!authoritative) return null

  switch (sceneFocus.kind) {
    case 'followEncounterSpace':
      return authoritative
    case 'pinnedScene':
      // TODO: swap `space` (and possibly filter placements) when pinned snapshot / cache exists.
      return authoritative
  }
}
