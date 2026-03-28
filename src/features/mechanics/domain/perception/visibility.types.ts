import type { LightingLevel, ObscuredLevel, WorldObscurationPresentationCause } from '../environment/environment.types'

/**
 * Inputs to visibility resolution — baseline environment, effects, or hidden state.
 * Used to build {@link ResolvedCellVisibility}; not stored on encounter state.
 */
export type VisibilityContributor =
  | { kind: 'lighting'; level: LightingLevel; source: 'environment' | 'effect' }
  | {
      kind: 'obscuration'
      level: Exclude<ObscuredLevel, 'none'>
      cause: WorldObscurationPresentationCause
    }
  | { kind: 'hidden'; cause: 'unrevealed' }

/**
 * Semantic visibility at a cell after merging contributors (lighting and obscuration stay separate).
 */
export type VisibilityPrimaryCause = WorldObscurationPresentationCause | 'unrevealed'

export type ResolvedCellVisibility = {
  lighting: LightingLevel
  obscured: ObscuredLevel
  primaryCause?: VisibilityPrimaryCause
  hidden: boolean
}

/**
 * Grid / UI tint ids — mapped from {@link ResolvedCellVisibility} by presentation layer only.
 *
 * - **`fog`** — Smoky / non-black veil for primary cause `fog` (and smoke/dust where mapped to this fill).
 *   Same interpretation as {@link AttachedEnvironmentZoneProfile} `'fog'`: opaque non-darkness cloud
 *   obscurement, not “only literal fog.”
 */
export type VisibilityFillKind = 'dim' | 'fog' | 'darkness' | 'magical-darkness' | 'hidden'
