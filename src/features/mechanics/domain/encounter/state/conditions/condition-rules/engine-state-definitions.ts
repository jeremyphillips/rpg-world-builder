import type { MarkerRule } from './condition-consequences.types'
import { cannotAct } from './condition-consequence-helpers'

/**
 * Engine-level combat markers (not core SRD conditions). Consequences merge with
 * {@link CONDITION_RULES} via {@link ALL_MARKER_RULES} and {@link getActiveConsequences}.
 */
export const ENGINE_STATE_RULES: Record<string, MarkerRule> = {
  banished: {
    id: 'banished',
    label: 'Banished',
    consequences: [
      ...cannotAct(),
      {
        kind: 'battlefield_absence',
        absentFromBattlefield: true,
        presenceReason: 'banished',
      },
    ],
  },

  'off-grid': {
    id: 'off-grid',
    label: 'Off-grid',
    consequences: [
      ...cannotAct(),
      {
        kind: 'battlefield_absence',
        absentFromBattlefield: true,
        presenceReason: 'off-grid',
      },
    ],
  },
}
