/**
 * Canonical **family-oriented** registry for authored map placed objects (place tool vocabulary).
 * Top-level keys are **family ids**; each family has explicit **palette category**, family-level **runtime**,
 * and explicit **variants** (Phase 1 uses a single `default` variant per family). Derive meta and palette via
 * {@link ./locationPlacedObject.selectors}.
 */
import type { GridObjectCoverKind } from '@/features/mechanics/domain/combat/space/space.types';
import type { LocationScaleId } from '@/shared/domain/locations';

import type { LocationMapGlyphIconName } from '../map/locationMapIconNames';

export type AuthoredPlacedObjectRuntimeFields = {
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
  coverKind: GridObjectCoverKind;
  isMovable: boolean;
};

/** Alias for combat/runtime hydration — same shape as registry `runtime` on each family. */
export type LocationPlacedObjectKindRuntimeDefaults = AuthoredPlacedObjectRuntimeFields;

/**
 * Interaction / transition semantics for authored placed objects — **not** collision geometry.
 * Use with {@link AuthoredPlacedObjectRuntimeFields} (`blocksMovement`, etc.); do not infer transitions
 * from `blocksMovement: false` alone.
 *
 * TODO: Broader world/campaign interaction surfaces (inspect, use, dialogue) will extend this shape;
 * not every placed kind will define interaction metadata yet.
 */
export type AuthoredPlacedObjectInteractionRole = 'transition';

/** Known transition kinds for contextual prompts (stairs, ladders, …). Extend as new transitions ship. */
export type AuthoredPlacedObjectTransitionKind = 'stairs';

export type AuthoredPlacedObjectInteraction = {
  role: AuthoredPlacedObjectInteractionRole;
  transitionKind: AuthoredPlacedObjectTransitionKind;
};

/**
 * UI palette grouping buckets only — **not** persisted map identity, **not** link vs object behavior.
 * Resolver routing (`linked-content` | `map-object` on `activePlace`) is separate; linking is `linkedScale` + policy.
 */
export type PlacedObjectPaletteCategoryId =
  | 'structure'
  | 'furniture'
  | 'fixture'
  | 'hazard'
  | 'treasure'
  | 'decor'
  | 'vegetation';

/** Stable toolbar section order (subset may be empty for a given scale). */
export const PLACED_OBJECT_PALETTE_CATEGORY_ORDER = [
  'structure',
  'furniture',
  'fixture',
  'hazard',
  'treasure',
  'decor',
  'vegetation',
] as const satisfies readonly PlacedObjectPaletteCategoryId[];

export const PLACED_OBJECT_PALETTE_CATEGORY_LABELS: Record<PlacedObjectPaletteCategoryId, string> = {
  structure: 'Structure',
  furniture: 'Furniture',
  fixture: 'Fixtures',
  hazard: 'Hazards',
  treasure: 'Treasure',
  decor: 'Decor',
  vegetation: 'Vegetation',
};

/** Canonical default variant id for single-variant families (Phase 1). Phase 2 adds sibling variants. */
export const DEFAULT_PLACED_OBJECT_VARIANT_ID = 'default' as const;
export type PlacedObjectDefaultVariantId = typeof DEFAULT_PLACED_OBJECT_VARIANT_ID;

export type AuthoredPlacedObjectVariantDefinition = {
  label: string;
  description?: string;
  iconName: LocationMapGlyphIconName;
};

export type AuthoredPlacedObjectFamilyDefinition = {
  /** Palette / toolbar grouping only — **not** persisted on the map. */
  category: PlacedObjectPaletteCategoryId;
  placementMode: 'cell';
  /** Host scales where this family is offered in the place palette. */
  allowedScales: readonly LocationScaleId[];
  /** Shared combat / spatial defaults for all variants in the family. */
  runtime: AuthoredPlacedObjectRuntimeFields;
  /** If set, place tool uses linked-location flow for this scale. */
  linkedScale?: LocationScaleId;
  /**
   * Optional: contextual interaction / transition role for play and future systems.
   * Distinct from {@link AuthoredPlacedObjectRuntimeFields} spatial blocking.
   */
  interaction?: AuthoredPlacedObjectInteraction;
  /** Explicit variant entries; Phase 1 uses `default` only for each family. */
  variants: {
    default: AuthoredPlacedObjectVariantDefinition;
  };
};

/** @deprecated Use {@link AuthoredPlacedObjectFamilyDefinition}. */
export type AuthoredPlacedObjectDefinition = AuthoredPlacedObjectFamilyDefinition;

/**
 * Single source of truth for authored placed-object **family** ids and their metadata + runtime defaults.
 */
export const AUTHORED_PLACED_OBJECT_DEFINITIONS = {
  city: {
    category: 'structure',
    placementMode: 'cell',
    allowedScales: ['world'],
    linkedScale: 'city',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
    variants: {
      default: {
        label: 'City',
        description: 'Settlement or major urban marker.',
        iconName: 'map_city',
      },
    },
  },
  building: {
    category: 'structure',
    placementMode: 'cell',
    allowedScales: ['city'],
    linkedScale: 'building',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
    variants: {
      default: {
        label: 'Building',
        description: 'Structure footprint or icon.',
        iconName: 'map_building',
      },
    },
  },
  site: {
    category: 'structure',
    placementMode: 'cell',
    allowedScales: ['city'],
    linkedScale: 'site',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
    variants: {
      default: {
        label: 'Site',
        description: 'Point of interest or minor location.',
        iconName: 'map_site',
      },
    },
  },
  tree: {
    category: 'vegetation',
    placementMode: 'cell',
    allowedScales: ['city'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
    variants: {
      default: {
        label: 'Tree',
        description: 'Vegetation or landmark tree.',
        iconName: 'tree',
      },
    },
  },
  table: {
    category: 'furniture',
    placementMode: 'cell',
    allowedScales: ['floor'],
    runtime: {
      blocksMovement: false,
      blocksLineOfSight: false,
      coverKind: 'half',
      isMovable: true,
    },
    variants: {
      default: {
        label: 'Table',
        description: 'Furniture or surface.',
        iconName: 'table',
      },
    },
  },
  stairs: {
    category: 'structure',
    placementMode: 'cell',
    allowedScales: ['floor'],
    runtime: {
      blocksMovement: false,
      blocksLineOfSight: false,
      coverKind: 'none',
      isMovable: false,
    },
    interaction: { role: 'transition', transitionKind: 'stairs' },
    variants: {
      default: {
        label: 'Stairs',
        description: 'Vertical circulation between levels.',
        iconName: 'stairs',
      },
    },
  },
  treasure: {
    category: 'treasure',
    placementMode: 'cell',
    allowedScales: ['floor'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
    variants: {
      default: {
        label: 'Treasure',
        description: 'Loot, hoard, or objective.',
        iconName: 'treasure',
      },
    },
  },
} as const satisfies Record<string, AuthoredPlacedObjectFamilyDefinition>;

export type LocationPlacedObjectKindId = keyof typeof AUTHORED_PLACED_OBJECT_DEFINITIONS;
