import type { AuthoredPlacedObjectInteraction } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import type { LocationMapAuthoredObjectRenderItem } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.types';
import type { ResolvedAuthoredDoorState } from '@/shared/domain/locations/map/locationMapDoorAuthoring.helpers';

export type EncounterSpaceMode =
  | 'zone-grid'
  | 'square-grid'
  | 'hex-grid'
  | 'svg-zones';

export type EncounterSpaceScale =
  | { kind: 'zone' }
  | { kind: 'grid'; cellFeet: 5 | 10 };

/**
 * D&D-style tactical combat cover granted by a grid object when used as cover (half / three-quarters / none).
 * Does **not** control movement blocking or line of sight — use {@link GridObject.blocksMovement} and
 * {@link GridObject.blocksLineOfSight} for those concerns.
 */
export type CombatCoverKind = 'none' | 'half' | 'three-quarters';

/** @deprecated Use {@link CombatCoverKind}. */
export type GridObjectCoverKind = CombatCoverKind;

/**
 * Runtime record for a placed map object on the tactical grid (single-cell footprint today).
 * Distinct from {@link EncounterEdge} / {@link EncounterAuthoringPresentation} wall segments.
 *
 * **Authored-only:** Created from location map placement via `buildGridObjectFromAuthoredPlacedObject`.
 * `authoredPlaceKindId` identifies the palette/registry kind; runtime fields must match
 * `resolveLocationPlacedObjectKindRuntimeDefaults(authoredPlaceKindId)` at hydration time.
 *
 * **Spatial vs cover:** `blocksMovement` and `blocksLineOfSight` drive encounter movement and sight checks.
 * `combatCoverKind` is **only** for attack/cover when the object is used as **tactical cover** — it does not replace
 * or duplicate the two boolean fields above.
 *
 * **`interaction`:** Optional transition/interaction hint from the registry — not implied by `blocksMovement`
 * alone. TODO: extend for ladders, portals, hatches; not all kinds populate this field yet.
 */
export type GridObject = {
  id: string;
  cellId: string;
  /** Traversal / collision for this object’s footprint. */
  blocksMovement: boolean;
  /** Line-of-sight blocking for encounter resolution (not the same as `combatCoverKind`). */
  blocksLineOfSight: boolean;
  /**
   * Tactical combat cover when used as cover (half / three-quarters / none). Does not control movement or LoS;
   * see `blocksMovement` and `blocksLineOfSight`.
   */
  combatCoverKind: CombatCoverKind;
  /** Whether the object can be repositioned by combat rules (e.g. shove); not “structural immovability”. */
  isMovable: boolean;
  /** Palette / registry kind from authored map placement (`LocationPlacedObjectKindId`). */
  authoredPlaceKindId: LocationPlacedObjectKindId;
  /** When set, object may drive contextual encounter prompts (e.g. stair traversal). */
  interaction?: AuthoredPlacedObjectInteraction;
};

/** Alias for grid VM / labels — same as {@link GridObject.authoredPlaceKindId}. */
export type GridObjectAuthoredKindId = LocationPlacedObjectKindId;

/**
 * Serialized authored map chrome for combat **presentation only** (fills, region tint, paths, wall strokes, authored object icons).
 * Mechanics (movement, LoS, targeting) use {@link EncounterCell} / {@link EncounterEdge} on this space;
 * this blob is optional and ignored by the engine when absent.
 */
export type EncounterAuthoringPresentation = {
  edgeEntries: Array<{ edgeId: string; kind: 'wall' | 'door' | 'window' }>;
  pathEntries: Array<{ id: string; kind: string; cellIds: string[] }>;
  /** Combat cell id (`c-x-y`) → sparse authored cell fill (family + variant). */
  cellFillByCombatCellId: Record<string, { familyId: string; variantId: string }>;
  /** Combat cell id → region color key (e.g. `regionRed`) for semi-transparent overlay. */
  regionColorKeyByCombatCellId?: Record<string, string>;
  /**
   * Authored map objects for display only (same shape as `LocationMapAuthoredObjectRenderItem` in shared domain).
   * Distinct from runtime `GridObject` and tactical object glyphs on the grid view model.
   */
  authoredObjectRenderItems?: LocationMapAuthoredObjectRenderItem[];
};

export type EncounterSpace = {
  id: string;
  locationId?: string | null;

  name: string;
  description?: string;

  mode: EncounterSpaceMode;

  width: number;
  height: number;

  cells: EncounterCell[];
  edges?: EncounterEdge[];
  features?: EncounterFeature[];
  /** Placed runtime objects from authored map hydration only. */
  gridObjects?: GridObject[];
  scale: EncounterSpaceScale;

  render?: EncounterSpaceRenderMeta;
  /** Authoring-derived visuals for play; does not drive combat resolution. */
  authoringPresentation?: EncounterAuthoringPresentation;
};

export type EncounterCell = {
  id: string;
  x: number;
  y: number;

  label?: string;
  kind?: 'open' | 'wall' | 'difficult' | 'blocking' | 'hazard' | 'elevated';

  terrainTags?: string[];

  movementCost?: number;
  blocksMovement?: boolean;
  blocksSight?: boolean;
  blocksProjectiles?: boolean;

  occupancyLimit?: number | null;

  featureIds?: string[];
};

export type EncounterEdge = {
  fromCellId: string;
  toCellId: string;
  kind?: 'open' | 'door' | 'stairs' | 'narrow' | 'secret';
  bidirectional?: boolean;
  movementCost?: number;
  blocksMovement?: boolean;
  blocksSight?: boolean;
  /**
   * Stable id from location map `edgeEntries[].edgeId` when this segment was hydrated from authoring.
   * Preferred identity for future door-edge intents (open/close/unlock).
   */
  mapEdgeId?: string;
  /** Optional override for Pick Lock DC on this edge (default 15 when omitted). */
  lockPickDc?: number;
  /** Sanitized open/lock snapshot for door segments; drives Phase 1 open interaction (runtime only). */
  doorState?: ResolvedAuthoredDoorState;
};

export type EncounterFeature = {
  id: string;
  name: string;
  kind: 'cover' | 'hazard' | 'trap' | 'object' | 'light-source' | 'elevation' | 'zone-effect';
  cellIds: string[];
  notes?: string;
  tags?: string[];
};

export type EncounterSpaceRenderMeta = {
  theme?: 'room' | 'dungeon' | 'outdoor';
  cellShape?: 'square' | 'rounded';
  showCoordinates?: boolean;
};

export type CombatantPosition = {
  combatantId: string;
  cellId: string;
  /**
   * Which {@link EncounterSpace} in {@link EncounterState.spacesById} this token occupies.
   * When omitted, resolved from `floorLocationId` + registry or legacy single `EncounterState.space`.
   */
  encounterSpaceId?: string | null;
  /**
   * Campaign floor location id (`scale === 'floor'`) for this token when multiple floors share one encounter.
   * When omitted, treated as {@link EncounterSpace.locationId} for the active tactical space (legacy single-floor).
   */
  floorLocationId?: string | null;
  /** Footprint in cells (1 = Medium/Small, 2 = Large, 3 = Huge, 4 = Gargantuan). Default 1. */
  size?: number;
};

export type InitialPlacementOptions = {
  allySide?: 'left' | 'right' | 'top' | 'bottom';
  enemySide?: 'left' | 'right' | 'top' | 'bottom';
  randomizeWithinSide?: boolean;
};
