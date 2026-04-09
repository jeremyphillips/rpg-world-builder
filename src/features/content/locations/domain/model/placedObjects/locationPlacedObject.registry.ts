/**
 * Canonical **family-oriented** registry for authored map placed objects (place tool vocabulary).
 * Top-level keys are **family ids**; each family has explicit **palette category**, family-level **runtime**,
 * and explicit **variants** (Phase 2: `defaultVariantId` + a record of family-scoped variant ids). Derive meta and palette via
 * {@link ./locationPlacedObject.selectors}.
 */
import type { CombatCoverKind } from '@/features/mechanics/domain/combat/space/space.types';
import type { LocationScaleId } from '@/shared/domain/locations';
import {
  LOCATION_SCALE_IDS_WITH_LEGACY,
  LOCATION_SCALE_RANK_ORDER_LEGACY,
} from '@/shared/domain/locations/location.constants';
import type { MaterialId } from '@/shared/domain/materials';
import type {
  PlacedObjectCellAnchorKind,
  PlacedObjectFootprintFeet,
} from '@/shared/domain/locations/map/placedObjectFootprint.types';

/**
 * Per-family spatial + tactical defaults for authored placed objects (hydrated to combat `GridObject`).
 *
 * - **`blocksMovement`** — traversal / occupancy: can a creature enter this cell while the object is there.
 * - **`blocksLineOfSight`** — visibility / targeting rays for encounter resolution (distinct from decorative map art).
 * - **`combatCoverKind`** — if this object is **used as cover** in tactical combat, what cover grade it grants
 *   (half / three-quarters / none). Does **not** set movement blocking, LoS, or generic obstacle “solidity.”
 * - **`isMovable`** — whether combat rules may reposition the object (e.g. shove), not map-editor placement lock.
 */
export type AuthoredPlacedObjectRuntimeFields = {
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
  /**
   * Tactical combat cover granted when a creature uses this object **as cover** (D&D-style).
   * Separate from movement blocking and line-of-sight blocking; see `blocksMovement` and `blocksLineOfSight`.
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
/**
 * Surface / frame material hints for icons and future rendering.
 * Uses {@link MaterialId} where it exists; `metal` is allowed until/if it joins the canonical list.
 */
export type AuthoredObjectMaterial = Extract<MaterialId, 'wood' | 'stone' | 'glass'> | 'metal';

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
 * `assetId` keys `location-objects.manifest.json` (preview + optional map slice).
 */
export type AuthoredPlacedObjectVariantDefinition = {
  label: string;
  description?: string;
  assetId: string;
  presentation?: AuthoredPlacedObjectVariantPresentation;
  /** Physical footprint in **feet** (square-grid layout only); omit when Phase-2 scale-to-cell is enough. */
  footprint?: PlacedObjectFootprintFeet;
  /** Defaults to {@link DEFAULT_PLACED_OBJECT_CELL_ANCHOR} when `footprint` is set. */
  cellAnchor?: PlacedObjectCellAnchorKind;
};

/** Default anchor for cell-placed objects with a footprint (Phase 3). */
export const DEFAULT_PLACED_OBJECT_CELL_ANCHOR: PlacedObjectCellAnchorKind = 'cell_center';

/** Cell-anchored vs boundary edge authoring — both use the same registry; edge families write `edgeEntries`. */
export type AuthoredPlacedObjectPlacementMode = 'cell' | 'edge';

export type AuthoredPlacedObjectFamilyDefinition = {
  /** Palette / toolbar grouping only — **not** persisted on the map. */
  category: PlacedObjectPaletteCategoryId;
  placementMode: AuthoredPlacedObjectPlacementMode;
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
    /** World: link marker to a child city. Include `city` to use the same link picker on city-scale host maps. */
    allowedScales: ['world', 'city'],
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
        assetId: 'placeholder_no_art',
      },
    },
  },
  building: {
    category: 'structure',
    placementMode: 'cell',
    allowedScales: ['city', 'site'],
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
        assetId: 'placeholder_no_art',
        presentation: {
          kind: 'residential',
        },
      },
      civic: {
        label: 'Civic Building',
        description: 'Public, institutional, or community structure.',
        assetId: 'placeholder_no_art',
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
        assetId: 'placeholder_no_art',
      },
    },
  },
  tree: {
    category: 'vegetation',
    placementMode: 'cell',
    allowedScales: ['city', 'site'],
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
        assetId: 'placeholder_no_art',
        /** Phase 6: canonical canopy span in feet until dedicated vegetation art lands. */
        footprint: { kind: 'circle', diameterFt: 12 },
        presentation: {
          type: 'deciduous',
          size: 'medium',
        },
      },
      pine: {
        label: 'Pine Tree',
        description: 'Conifer or pine-like tree.',
        assetId: 'placeholder_no_art',
        footprint: { kind: 'circle', diameterFt: 10 },
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
        assetId: 'table_rect_wood_5x3',
        footprint: { kind: 'rect', widthFt: 5, depthFt: 3 },
        presentation: {
          material: 'wood',
          shape: 'rectangle',
        },
      },
      /** 10×4 ft variant — distinct `assetId` + footprint (Phase 4); do not stretch the 5×3 art. */
      rect_wood_10x4: {
        label: 'Large Table',
        description: 'Rectangular wood table (10×4 ft).',
        assetId: 'table_rect_wood_10x4',
        footprint: { kind: 'rect', widthFt: 10, depthFt: 4 },
        /** Phase 5: long span aligns along the east-west axis; center sits on the shared edge to the east. */
        cellAnchor: 'between_cells_e',
        presentation: {
          material: 'wood',
          shape: 'rectangle',
        },
      },
      circle_wood: {
        label: 'Round Table (wood)',
        description: 'Round wood table.',
        assetId: 'placeholder_no_art',
        footprint: { kind: 'circle', diameterFt: 4 },
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
        assetId: 'stairs_straight',
        /** Phase 6: long run along one axis; layout clamps to cell / overlaps neighbors visually (not tactical multi-cell). */
        footprint: { kind: 'rect', widthFt: 4, depthFt: 8 },
        presentation: {
          form: 'straight',
        },
      },
      spiral: {
        label: 'Spiral Stairs',
        description: 'Compact spiral stair for vertical circulation between levels.',
        assetId: 'stairs_spiral',
        footprint: { kind: 'circle', diameterFt: 6 },
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
        assetId: 'treasure_chest',
        footprint: { kind: 'rect', widthFt: 3, depthFt: 2 },
        presentation: {
          form: 'chest',
        },
      },
      hoard: {
        label: 'Hoard',
        description: 'Loose treasure pile, stash, or objective cache.',
        assetId: 'placeholder_no_art',
        presentation: {
          form: 'pile',
        },
      },
    },
  },
  door: {
    category: 'structure',
    placementMode: 'edge',
    allowedScales: ['floor'],
    defaultVariantId: 'single_wood',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      combatCoverKind: 'none',
      isMovable: false,
    },
    variants: {
      single_wood: {
        label: 'Door',
        description: 'Single-leaf wood door.',
        assetId: 'door_single_wood',
        presentation: {
          material: 'wood',
          form: 'single-leaf',
        },
      },
      double_wood: {
        label: 'Double Door',
        description: 'Double-leaf wood door.',
        assetId: 'door_double_wood',
        presentation: {
          material: 'wood',
          form: 'double-leaf',
        },
      },
    },
  },
  window: {
    category: 'structure',
    placementMode: 'edge',
    allowedScales: ['floor'],
    defaultVariantId: 'glass',
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: false,
      combatCoverKind: 'none',
      isMovable: false,
    },
    variants: {
      bars: {
        label: 'Barred Window',
        description: 'Window opening secured with bars.',
        assetId: 'window_bars',
        presentation: {
          type: 'bars',
        },
      },
      glass: {
        label: 'Window',
        description: 'Standard glass window.',
        assetId: 'window_glass',
        presentation: {
          material: 'glass',
          type: 'plain',
        },
      },
      stained_glass: {
        label: 'Stained Glass Window',
        description: 'Decorative stained glass window.',
        assetId: 'window_stained_glass',
        presentation: {
          material: 'glass',
          type: 'stained-glass',
        },
      },
      shutters: {
        label: 'Shuttered Window',
        description: 'Window with wooden shutters.',
        assetId: 'window_shutters',
        presentation: {
          material: 'wood',
          type: 'shutters',
        },
      },
    },
  },
} as const satisfies Record<string, AuthoredPlacedObjectFamilyDefinition>;

export type LocationPlacedObjectKindId = keyof typeof AUTHORED_PLACED_OBJECT_DEFINITIONS;

/**
 * Interior / non–place-tool cell links (building → floor, world → site, …). Merged with
 * {@link AUTHORED_PLACED_OBJECT_DEFINITIONS} `linkedScale` × `allowedScales` for map `linkedLocationId` validation.
 */
const STRUCTURAL_MAP_CELL_LINK_TARGETS: Partial<Record<LocationScaleId, readonly LocationScaleId[]>> = {
  world: ['site'],
  city: ['building'],
  site: ['building', 'room'],
  building: ['floor', 'room'],
  floor: ['room'],
};

function buildAllowedLinkedLocationScalesByHost(): Record<LocationScaleId, LocationScaleId[]> {
  const rank = LOCATION_SCALE_RANK_ORDER_LEGACY as readonly string[];
  const byHost = new Map<LocationScaleId, Set<LocationScaleId>>();
  for (const id of LOCATION_SCALE_IDS_WITH_LEGACY) {
    byHost.set(id, new Set());
  }
  for (const family of Object.values(AUTHORED_PLACED_OBJECT_DEFINITIONS)) {
    const target = 'linkedScale' in family ? family.linkedScale : undefined;
    if (!target) continue;
    for (const host of family.allowedScales) {
      byHost.get(host)?.add(target);
    }
  }
  for (const [host, targets] of Object.entries(STRUCTURAL_MAP_CELL_LINK_TARGETS)) {
    const set = byHost.get(host as LocationScaleId);
    if (!set) continue;
    for (const t of targets) set.add(t);
  }
  const sortTargets = (a: LocationScaleId, b: LocationScaleId) => {
    const ia = rank.indexOf(a);
    const ib = rank.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  };
  return Object.fromEntries(
    LOCATION_SCALE_IDS_WITH_LEGACY.map((host) => {
      const arr = [...(byHost.get(host) ?? [])].sort(sortTargets);
      return [host, arr];
    }),
  ) as Record<LocationScaleId, LocationScaleId[]>;
}

/**
 * Host location scale → target scales allowed for map cell `linkedLocationId` (campaign validation + link modal).
 * Derived from linked placed-object families + {@link STRUCTURAL_MAP_CELL_LINK_TARGETS}.
 */
export const ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE = buildAllowedLinkedLocationScalesByHost();
