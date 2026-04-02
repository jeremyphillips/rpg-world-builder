import type { EncounterEnvironmentBaseline } from '@/features/mechanics/domain/environment'
import type { GridSizePreset } from '@/shared/domain/grid/gridPresets'

import type { OpponentRosterEntry } from '../../types'

/**
 * Default roster selection for encounter setup.
 *
 * Option *lists* (party, NPCs, monsters) come from campaign/catalog hooks (`useEncounterOptions`);
 * this policy only supplies **initial** selections when a flow needs seeded defaults (e.g. future
 * session context pre-picking PCs). It does **not** encode player vs DM permissions — this setup
 * surface remains **DM / Encounter Simulator only**; player-facing participation belongs on a
 * separate lobby/session route, not readonly variants of this page.
 */
export type EncounterSetupRosterPolicy = {
  defaultSelectedAllyIds: string[]
  defaultOpponentRoster: OpponentRosterEntry[]
}

/**
 * Environment baseline defaults for setup (e.g. session-preseeded location context later).
 * Editing is always appropriate on this setup surface for whoever is allowed on the route (DM/simulator).
 */
export type EncounterSetupEnvironmentPolicy = {
  environmentDefaults: EncounterEnvironmentBaseline
}

export type EncounterSetupGridPolicy = {
  gridSizePresetDefault: GridSizePreset
}

/**
 * Policy-driven **defaults** for encounter setup (roster seeds, environment/grid starting values).
 * Simulator uses {@link SIMULATOR_ENCOUNTER_SETUP_POLICY}. A future GameSession DM flow can swap
 * defaults without forking setup UI; player lobby UI stays a separate concern.
 */
export type EncounterSetupPolicy = {
  roster: EncounterSetupRosterPolicy
  environment: EncounterSetupEnvironmentPolicy
  grid: EncounterSetupGridPolicy
}
