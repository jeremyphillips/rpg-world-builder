import type {
  EncounterLightingLevel,
  EncounterVisibilityObscured,
  EncounterWorldCellEnvironment,
} from '../environment/environment.types'

/**
 * Optional senses for perception resolution. Omitted flags mean “not available” for this pass.
 * Future: load from combatant stats / effects / equipment.
 */
export type EncounterViewerPerceptionCapabilities = {
  /** E.g. 60 — does not penetrate magical darkness unless combined with other senses. */
  darkvisionRangeFt?: number
  /** Within range, typically ignores non-magical obscurement (rules vary by table). */
  blindsightRangeFt?: number
  truesightActive?: boolean
  /** Warlock Devil’s Sight — see normally in darkness including magical darkness. */
  devilsSightActive?: boolean
  /** Explicit bypass for magical darkness (if rules grant it outside the above). */
  magicalDarknessBypass?: boolean
}

/**
 * What a **viewer** can perceive about a **target cell** — derived, not stored world state.
 * Distinct from {@link EncounterWorldCellEnvironment} (objective grid environment).
 */
export type EncounterViewerPerceptionCell = {
  /** Whether the viewer can meaningfully perceive the cell as a tactical location (outline / “there is a cell”). */
  canPerceiveCell: boolean
  /** Whether occupants (tokens) can be perceived in this cell. */
  canPerceiveOccupants: boolean
  /** Whether grid objects/obstacles in this cell can be perceived. */
  canPerceiveObjects: boolean
  /** Non-magical heavy obscuration or darkness lighting (when not masked as magical darkness). */
  maskedByDarkness: boolean
  /** Magical darkness blocks sight into this cell (when viewer has no bypass). */
  maskedByMagicalDarkness: boolean
  /**
   * When true, AoE/darkness template boundaries for this viewer should be de-emphasized or hidden
   * (e.g. viewer stands inside magical darkness).
   */
  suppressTemplateBoundary: boolean
  worldLightingLevel: EncounterLightingLevel
  worldVisibilityObscured: EncounterVisibilityObscured
  /** Echo of resolved zones on the target cell (debug / tooling). */
  appliedZoneIds: string[]
}

/**
 * Viewer-wide perception mode for battlefield UI (veils, boundary drawing). Derived only.
 */
export type EncounterViewerBattlefieldPerception = {
  viewerCellId: string | null
  viewerInsideMagicalDarkness: boolean
  viewerInsideHeavyObscurement: boolean
  /** Full-screen or heavy dim over non-local UI when viewer cannot see the field. */
  useBattlefieldBlindVeil: boolean
  /** Hide darkness sphere edge when the viewer is inside that darkness. */
  suppressDarknessBoundaryFromInside: boolean
}

export type ResolveViewerPerceptionForCellParams = {
  viewerWorld: EncounterWorldCellEnvironment
  targetWorld: EncounterWorldCellEnvironment
  viewerCellId: string
  targetCellId: string
  capabilities?: EncounterViewerPerceptionCapabilities
  /** When `'dm'`, perception is not restricted (tactical omniscience for the view). */
  viewerRole?: 'dm' | 'pc'
}

export type ResolveViewerBattlefieldPerceptionParams = {
  viewerWorld: EncounterWorldCellEnvironment
  viewerCellId: string | undefined
  capabilities?: EncounterViewerPerceptionCapabilities
  viewerRole?: 'dm' | 'pc'
}
