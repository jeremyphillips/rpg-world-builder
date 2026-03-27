/**
 * Back-compat re-exports for defeated-only call sites.
 * Prefer {@link PARTICIPATION_VISUALS} / {@link getCombatantPreviewCardOpacity} for new code.
 */

import { PARTICIPATION_VISUALS } from './presentation-participation'

export {
  PARTICIPATION_VISUALS,
  getCombatantPreviewCardOpacity,
  getTurnOrderRowOpacity,
} from './presentation-participation'

export const DEFEATED_PARTICIPATION_OPACITY = PARTICIPATION_VISUALS.defeated.opacity
