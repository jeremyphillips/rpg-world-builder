import type { SubclassFeature } from '@/features/content/classes/domain/types/subclass.types'

import type { RaceGrants } from './race-grants.types'

/**
 * Discriminates lineage vs ancestry vs ancestor without separate top-level fields.
 * Class `definitions` are a single bucket; races may need several labeled groups.
 */
export type RaceDefinitionGroupKind =
  | 'lineage'
  | 'ancestry'
  | 'ancestor'
  | 'heritage'
  | 'subrace'
  | 'variant'

/**
 * Class `SubclassSelection`-aligned: id, name, selectionLevel, options.
 * Race-only: `kind` labels the group (Forest vs Cloud vs Draconic, etc.).
 */
export interface RaceDefinitionGroup {
  id: string
  name: string
  kind: RaceDefinitionGroupKind
  description?: string
  /** When the choice is taken (usually `1` at character creation). Mirrors {@link SubclassSelection.selectionLevel}. */
  selectionLevel: number | null
  options: readonly RaceDefinitionOption[]
}

/**
 * Class `Subclass`-aligned: id, name, optional features with per-row level.
 * Static option payload (senses, traits, damage type) lives in {@link RaceGrants}.
 */
export interface RaceDefinitionOption {
  id: string
  name: string
  description?: string
  grants?: RaceGrants
  /** Level-gated spells/effects (same union as subclass features). */
  features?: SubclassFeature[]
  tags?: string[]
}
