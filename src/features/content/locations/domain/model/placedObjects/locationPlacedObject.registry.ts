/**
 * Canonical **family-oriented** registry for authored map placed objects (place tool vocabulary).
 * Top-level keys are **family ids**; each family has explicit **palette category**, family-level **runtime**,
 * and explicit **variants** (Phase 2: `defaultVariantId` + a record of family-scoped variant ids). Derive meta and palette via
 * {@link ./locationPlacedObject.selectors}.
 */
import type { CombatCoverKind } from '@/features/mechanics/domain/combat/space/space.types';
import type { LocationScaleId } from '@/shared/domain/locations';

import type { LocationMapGlyphIconName } from '../map/locationMapIconNames';

export type AuthoredPlacedObjectRuntimeFields = {
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
  /**
   * D&D-style tactical combat cover granted by this object when used as cover.
   * This does not control collision or line of sight.
   * Use `blocksMovement` and `blocksLineOfSight` for those concerns.
   */
  combatCoverKind: CombatCoverKind;
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

/**
 * Common variant **key** for families still on the legacy single-row pattern (`variants.default`, e.g. `city`, `site`).
 * Primary selection is always the family’s **`defaultVariantId`** — concrete-key families (table, stairs, …) do not use this literal.
 */
export const DEFAULT_PLACED_OBJECT_VARIANT_ID = 'default' as const;
export type PlacedObjectDefaultVariantId = typeof DEFAULT_PLACED_OBJECT_VARIANT_ID;

/**
 * Authoring/editor/render hints — not mechanics truth (see family-level `runtime` on each registry family).
 * Keep local to this registry until multiple families or domains reuse the same vocabulary; then consider extracting
 * from `shared/domain` (deferred intentionally).
 */
export type AuthoredObjectMaterial = 'wood' | 'stone' | 'metal';

export type AuthoredObjectShape = 'rectangle' | 'circle' | 'square';

/**
 * Lightweight authoring/editor/render hints — families may use different subsets (`form`, `kind`, …).
 * Keep local; defer `shared/domain` extraction until multiple domains reuse the same vocabulary.
 */
export type AuthoredPlacedObjectVariantPresentation = {
  material?: AuthoredObjectMaterial;
  shape?: AuthoredObjectShape;
  form?: string;
  kind?: string;
  type?: string;
  size?: string;
};

/**
 * Per-variant palette/render metadata. Core UI fields stay flat; structured hints live under `presentation`.
 * `iconName` is the place-tool glyph id (`LocationMapGlyphIconName`), not persisted map object icon ids.
 */
export type AuthoredPlacedObjectVariantDefinition = {
  label: string;
  description?: string;
  iconName: LocationMapGlyphIconName;
  presentation?: AuthoredPlacedObjectVariantPresentation;
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
  /**
   * **Only** source of truth for which variant is primary-selected in the palette — must equal a key in `variants`.
   * Prefer **concrete** variant keys (`rect_wood`, …); do not add a redundant `variants.default` entry when this id
   * already names the default row (see `table`).
   */
  defaultVariantId: string;
  /** Family-scoped variant ids → concrete definitions only; wire mapping stays in placement resolver / persistence helpers. */
  variants: Record<string, AuthoredPlacedObjectVariantDefinition>;
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
    defaultVariantId: 'default',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      combatCoverKind: 'none',
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
    allowedScales: ['world', 'city', 'site'],
    defaultVariantId: 'residential',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      combatCoverKind: 'none',
      isMovable: false,
    },
    variants: {
      residential: {
        label: 'Building',
        description: 'Residential structure or home.',
        iconName: 'map_building',
        presentation: {
          kind: 'residential',
        },
      },
      civic: {
        label: 'Civic Building',
        description: 'Public, institutional, or community structure.',
        iconName: 'map_building',
        presentation: {
          kind: 'civic',
        },
      },
    },
  },
  site: {
    category: 'structure',
    placementMode: 'cell',
    allowedScales: ['city'],
    linkedScale: 'site',
    defaultVariantId: 'default',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      combatCoverKind: 'none',
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
    allowedScales: ['world', 'city', 'site'],
    defaultVariantId: 'deciduous',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      combatCoverKind: 'half',
      isMovable: false,
    },
    variants: {
      deciduous: {
        label: 'Tree',
        description: 'Broad-canopy deciduous tree.',
        iconName: 'tree',
        presentation: {
          type: 'deciduous',
          size: 'medium',
        },
      },
      pine: {
        label: 'Pine Tree',
        description: 'Conifer or pine-like tree.',
        iconName: 'tree',
        presentation: {
          type: 'conifer',
          size: 'medium',
        },
      },
    },
  },
  table: {
    category: 'furniture',
    placementMode: 'cell',
    allowedScales: ['floor'],
    defaultVariantId: 'rect_wood',
    runtime: {
      blocksMovement: false,
      blocksLineOfSight: false,
      combatCoverKind: 'half',
      isMovable: true,
    },
    variants: {
      rect_wood: {
        label: 'Table',
        description: 'Rectangular wood table.',
        iconName: 'table',
        presentation: {
          material: 'wood',
          shape: 'rectangle',
        },
      },
      circle_wood: {
        label: 'Round Table (wood)',
        description: 'Round wood table.',
        iconName: 'table',
        presentation: {
          material: 'wood',
          shape: 'circle',
        },
      },
    },
  },
  stairs: {
    category: 'structure',
    placementMode: 'cell',
    allowedScales: ['floor'],
    defaultVariantId: 'straight',
    runtime: {
      blocksMovement: false,
      blocksLineOfSight: false,
      combatCoverKind: 'none',
      isMovable: false,
    },
    interaction: { role: 'transition', transitionKind: 'stairs' },
    variants: {
      straight: {
        label: 'Stairs',
        description: 'Straight stair run for vertical circulation between levels.',
        iconName: 'stairs',
        presentation: {
          form: 'straight',
        },
      },
      spiral: {
        label: 'Spiral Stairs',
        description: 'Compact spiral stair for vertical circulation between levels.',
        iconName: 'stairs',
        presentation: {
          form: 'spiral',
        },
      },
    },
  },
  treasure: {
    category: 'treasure',
    placementMode: 'cell',
    allowedScales: ['floor'],
    defaultVariantId: 'chest',
    runtime: {
      blocksMovement: false,
      blocksLineOfSight: false,
      combatCoverKind: 'none',
      isMovable: true,
    },
    variants: {
      chest: {
        label: 'Treasure Chest',
        description: 'Chest, coffer, or locked loot container.',
        iconName: 'treasure',
        presentation: {
          form: 'chest',
        },
      },
      hoard: {
        label: 'Hoard',
        description: 'Loose treasure pile, stash, or objective cache.',
        iconName: 'treasure',
        presentation: {
          form: 'pile',
        },
      },
    },
  },
} as const satisfies Record<string, AuthoredPlacedObjectFamilyDefinition>;

export type LocationPlacedObjectKindId = keyof typeof AUTHORED_PLACED_OBJECT_DEFINITIONS;
