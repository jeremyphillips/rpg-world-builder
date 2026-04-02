import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';

export type EncounterSpaceMode =
  | 'zone-grid'
  | 'square-grid'
  | 'hex-grid'
  | 'svg-zones';

export type EncounterSpaceScale =
  | { kind: 'zone' }
  | { kind: 'grid'; cellFeet: 5 | 10 };

/** Procedural-only placement kinds (encounter bootstrap); not part of {@link LocationPlacedObjectKindId}. */
export type GridProceduralPlacementKind = 'tree' | 'pillar';

/**
 * Cover from a placed object for attack targeting (first pass; full combat cover rules TBD).
 */
export type GridObjectCoverKind = 'none' | 'half' | 'three-quarters';

/**
 * Runtime record for a placed map object on the tactical grid (single-cell footprint today).
 * Distinct from {@link EncounterEdge} / {@link EncounterAuthoringPresentation} wall segments.
 */
export type GridObject = {
  id: string;
  cellId: string;
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
  coverKind: GridObjectCoverKind;
  /** Whether the object can be repositioned by combat rules (e.g. shove); not “structural immovability”. */
  isMovable: boolean;
  /** From authored location map placement when present. */
  authoredPlaceKindId?: LocationPlacedObjectKindId;
  /** Procedural encounter props (tree/pillar) when not from authored map data. */
  proceduralPlacementKind?: GridProceduralPlacementKind;
};

/** Key used for labels / grid VM when an object is tree, pillar, or an authored placed kind. */
export type GridObjectPlacementKindKey = GridProceduralPlacementKind | LocationPlacedObjectKindId;

/**
 * @deprecated Use {@link GridProceduralPlacementKind}.
 */
export type GridObstacleKind = GridProceduralPlacementKind;

/**
 * @deprecated Use {@link GridObject} for runtime placed-object records. Do not introduce new usages; read legacy data via `getEncounterGridObjects` (`space.helpers`).
 */
export type GridObstacle = {
  id: string;
  kind: GridObstacleKind;
  cellId: string;
  blocksLineOfSight: boolean;
  blocksMovement: boolean;
};

/**
 * Serialized authored map chrome for combat **presentation only** (fills, region tint, paths, wall strokes).
 * Mechanics (movement, LoS, targeting) use {@link EncounterCell} / {@link EncounterEdge} on this space;
 * this blob is optional and ignored by the engine when absent.
 */
export type EncounterAuthoringPresentation = {
  edgeEntries: Array<{ edgeId: string; kind: 'wall' | 'door' | 'window' }>;
  pathEntries: Array<{ id: string; kind: string; cellIds: string[] }>;
  /** Combat cell id (`c-x-y`) → sparse cell fill kind id from location map authoring. */
  cellFillByCombatCellId: Record<string, string>;
  /** Combat cell id → region color key (e.g. `regionRed`) for semi-transparent overlay. */
  regionColorKeyByCombatCellId?: Record<string, string>;
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
  /** Placed runtime objects (trees, furniture, …). Canonical list for new code. */
  gridObjects?: GridObject[];
  /**
   * @deprecated Use {@link EncounterSpace.gridObjects}. Persisted state may still populate this;
   * use {@link getEncounterGridObjects} from `space.helpers` when reading.
   */
  obstacles?: GridObstacle[];
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
  /** Footprint in cells (1 = Medium/Small, 2 = Large, 3 = Huge, 4 = Gargantuan). Default 1. */
  size?: number;
};

export type InitialPlacementOptions = {
  allySide?: 'left' | 'right' | 'top' | 'bottom';
  enemySide?: 'left' | 'right' | 'top' | 'bottom';
  randomizeWithinSide?: boolean;
};