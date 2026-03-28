import {
  ATMOSPHERE_TAGS,
  ENVIRONMENT_SETTINGS,
  LIGHTING_LEVELS,
  TERRAIN_MOVEMENT_TYPES,
  VISIBILITY_OBSCURED_LEVELS,
} from './environment.constants'

export type EncounterEnvironmentSetting = (typeof ENVIRONMENT_SETTINGS)[number]['id']
export type EncounterLightingLevel = (typeof LIGHTING_LEVELS)[number]['id']
export type EncounterTerrainMovement = (typeof TERRAIN_MOVEMENT_TYPES)[number]['id']
export type EncounterVisibilityObscured = (typeof VISIBILITY_OBSCURED_LEVELS)[number]['id']
export type EncounterAtmosphereTag = (typeof ATMOSPHERE_TAGS)[number]['id']

/** Shorter aliases for perception / docs; same ids as {@link EncounterLightingLevel}, etc. */
export type LightingLevel = EncounterLightingLevel
export type ObscuredLevel = EncounterVisibilityObscured
export type EnvironmentSetting = EncounterEnvironmentSetting
export type TerrainMovementType = EncounterTerrainMovement
export type AtmosphereTag = EncounterAtmosphereTag

/**
 * Terrain cover grade at a grid cell after baseline + zone merge (see `resolveWorldEnvironmentForCell`).
 * For **hide**, gridded encounters also use observer-relative max cover along the LoS segment
 * (`resolveTerrainCoverGradeForHideFromObserver`); this field remains the per-cell merged value.
 */
export type TerrainCoverGrade = 'none' | 'half' | 'three-quarters' | 'full'

/**
 * Global default encounter environment: setup seeds it, and `EncounterState.environmentBaseline`
 * holds the **current runtime** values for the fight (day/night, weather, DM edits, etc.).
 * Localized zones apply on top via {@link EncounterEnvironmentZone} and resolve to
 * {@link EncounterWorldCellEnvironment}.
 *
 * Lighting and visibility/obscuration stay independent axes (e.g. bright light + heavy obscurement).
 */
export type EncounterEnvironmentBaseline = {
  setting: EncounterEnvironmentSetting
  lightingLevel: EncounterLightingLevel
  terrainMovement: EncounterTerrainMovement
  visibilityObscured: EncounterVisibilityObscured
  /**
   * Cell-local cover from terrain / authored zones (not per-observer geometry).
   * Default in resolvers when omitted: `'none'`.
   */
  terrainCover?: TerrainCoverGrade
  /** Additive domain tags; combined with baseline lighting/visibility, not a replacement for them. */
  atmosphereTags: EncounterAtmosphereTag[]
}

/** Alias for authored encounter baseline — same shape as {@link EncounterEnvironmentBaseline}. */
export type EnvironmentBaseline = EncounterEnvironmentBaseline

/**
 * Partial update for {@link EncounterEnvironmentBaseline}. Omitted keys are unchanged.
 * When `atmosphereTags` is present, it **replaces** the full tag list (not merged per tag).
 */
export type EncounterEnvironmentBaselinePatch = Partial<EncounterEnvironmentBaseline>

export type EncounterAtmosphere = {
  tags?: EncounterAtmosphereTag[]
  notes?: string
}

export type EncounterHazard = {
  id: string
  name: string
  type: 'damage' | 'movement' | 'visibility' | 'condition' | 'other'
  description?: string
  area?: string
  trigger?: 'start_of_turn' | 'enter' | 'end_of_turn' | 'manual'
}

export type EncounterVisibility = {
  obscured: EncounterVisibilityObscured
  causes?: Array<'fog' | 'smoke' | 'rain' | 'foliage' | 'magical'>
  notes?: string
}

export type EncounterTerrain = {
  movement: EncounterTerrainMovement[]
  cover?: Array<'none' | 'half' | 'three-quarters' | 'full'>
  notes?: string
}

export type EncounterLighting = {
  level: EncounterLightingLevel
  tags?: Array<'sunlight' | 'moonlight' | 'firelight' | 'magical-light'>
  notes?: string
}

/**
 * Optional extended/narrative environment shape (nested notes, hazards).
 * Not the same as {@link EncounterEnvironmentBaseline}; kept for future campaign/doc use.
 */
export type EncounterEnvironmentExtended = {
  setting: EncounterEnvironmentSetting
  lighting?: EncounterLighting
  terrain?: EncounterTerrain
  visibility?: EncounterVisibility
  atmosphere?: EncounterAtmosphere
  hazards?: EncounterHazard
  tags?: string[]
  notes?: string
}

/** What ties a zone to the battle (spell instance, effect id, etc.). */
export type EncounterEnvironmentOverrideSourceKind =
  | 'battlefield-effect'
  | 'attached-aura'
  | 'spell'
  | 'manual'
  | 'terrain-feature'

/**
 * When set on a persistent `BattlefieldEffectInstance`, reconciliation builds/updates a matching
 * {@link EncounterEnvironmentZone} from that row. Extend with new literals as more world projections ship.
 *
 * - **`magical-darkness`** — Zone merge sets darkness lighting, heavy obscured, and magical darkness flags
 *   (see `buildZoneForProfile`).
 *
 * - **`fog`** — Shared profile for **opaque, non-darkness cloud obscurement**: heavy obscured, no forced
 *   darkness lighting, no magical-darkness behavior. The identifier is **not** a claim that every effect is
 *   literal fog; it names one mechanical + presentation path (shared smoky / non-black cloud tint). Examples:
 *   Fog Cloud, Stinking Cloud.
 *
 *   **Revisit** adding a separate profile (e.g. a different id or merge branch) only if an effect needs
 *   different environment merge rules, different precedence in visibility resolution, a distinct grid tint, or
 *   profile-specific side effects that belong in zone/profile code rather than spell-specific logic.
 */
export type AttachedEnvironmentZoneProfile = 'magical-darkness' | 'fog'

/**
 * Presentation-only obscuration causes collected at world merge (baseline + zones).
 * Not combat rules — feeds visibility presentation resolution.
 *
 * - **`fog`** — Aligns with {@link AttachedEnvironmentZoneProfile} `'fog'`: opaque non-darkness cloud
 *   obscurement (same semantics as that profile id — not literal fog only).
 */
export type WorldObscurationPresentationCause =
  | 'environment'
  | 'fog'
  | 'smoke'
  | 'dust'
  | 'darkness'
  | 'magical-darkness'

/** Domain category for a localized environment zone (distinct from {@link EncounterEnvironmentOverrideSourceKind}). */
export type EncounterEnvironmentZoneKind = 'patch' | 'emanation' | 'hazard'

/**
 * Geometry for zone coverage. Prefer **`sphere-ft`** (matches battlefield AoE: Chebyshev distance in feet).
 */
export type EncounterEnvironmentAreaLink =
  | { kind: 'grid-cell-ids'; cellIds: string[] }
  | { kind: 'sphere-ft'; originCellId: string; radiusFt: number }
  | { kind: 'unattached'; note?: string }

export type EncounterEnvironmentZoneOverrides = {
  setting?: EncounterEnvironmentSetting
  lightingLevel?: EncounterLightingLevel
  terrainMovement?: EncounterTerrainMovement
  visibilityObscured?: EncounterVisibilityObscured
  terrainCover?: TerrainCoverGrade
  atmosphereTagsAdd?: EncounterAtmosphereTag[]
  atmosphereTagsRemove?: EncounterAtmosphereTag[]
  /** When set, replaces accumulated tags for subsequent merge steps in that zone’s application order. */
  atmosphereTagsReplace?: EncounterAtmosphereTag[]
}

/**
 * Localized environment layer (spell patch, emanation, hazard region).
 * Merge order: {@link sortZonesForMerge}, then per-field rules in {@link resolveWorldEnvironmentForCell}.
 */
export type EncounterEnvironmentZone = {
  id: string
  kind: EncounterEnvironmentZoneKind
  /**
   * Lower value = earlier in merge order. For scalar fields, **later** zones win (higher priority number wins).
   * Default `0` in resolvers.
   */
  priority?: number
  sourceKind: EncounterEnvironmentOverrideSourceKind
  sourceId?: string
  area: EncounterEnvironmentAreaLink
  overrides: EncounterEnvironmentZoneOverrides
  /** World-state flags; merged with OR across applicable zones (see resolver). */
  magical?: {
    magical?: boolean
    magicalDarkness?: boolean
    blocksDarkvision?: boolean
  }
  /**
   * When set, merged into {@link EncounterWorldCellEnvironment.obscurationPresentationCauses} for this zone’s area.
   * Spell-driven zones can omit this and rely on inference from `magical` / `overrides`.
   */
  visibilityObscurationCause?: WorldObscurationPresentationCause
}

/**
 * **World / environment state** at one grid cell after baseline + zone layering.
 * Not viewer perception and not UI render state — consumers project for display/senses later.
 */
export type EncounterWorldCellEnvironment = {
  setting: EncounterEnvironmentSetting
  lightingLevel: EncounterLightingLevel
  terrainMovement: EncounterTerrainMovement
  visibilityObscured: EncounterVisibilityObscured
  atmosphereTags: EncounterAtmosphereTag[]
  /** True if any applicable zone set `magical.magicalDarkness`. */
  magicalDarkness: boolean
  /** True if any applicable zone set `magical.blocksDarkvision`. */
  blocksDarkvision: boolean
  /** True if any applicable zone set `magical.magical`. */
  magical: boolean
  /** Merged terrain cover at this cell (baseline + zone overrides; last applicable zone wins). */
  terrainCover: TerrainCoverGrade
  /** Zones that covered this cell, sorted by merge order (priority asc, then id asc). */
  appliedZoneIds: string[]
  /**
   * Ordered obscuration causes for presentation (baseline + each applicable zone in merge order).
   * Does not replace {@link visibilityObscured} or {@link lightingLevel}; used for source-aware UI resolution.
   */
  obscurationPresentationCauses: readonly WorldObscurationPresentationCause[]
}
