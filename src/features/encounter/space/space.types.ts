export type EncounterSpaceMode =
  | 'zone-grid'
  | 'square-grid'
  | 'hex-grid'
  | 'svg-zones';

export type EncounterSpaceScale =
  | { kind: 'zone' }
  | { kind: 'grid'; cellFeet: 5 | 10 };

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
  scale: EncounterSpaceScale;

  render?: EncounterSpaceRenderMeta;
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