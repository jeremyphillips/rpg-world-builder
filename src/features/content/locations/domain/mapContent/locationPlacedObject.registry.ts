/**
 * Canonical registry for authored map placed objects (place tool vocabulary).
 * Add new kinds here — derive meta, runtime defaults, and per-scale palette via
 * {@link ./locationPlacedObject.selectors}.
 */
import type { GridObjectCoverKind } from '@/features/mechanics/domain/combat/space/space.types';
import type { LocationScaleId } from '@/shared/domain/locations';

import type { LocationMapGlyphIconName } from './locationMapIconNames';

export type AuthoredPlacedObjectRuntimeFields = {
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
  coverKind: GridObjectCoverKind;
  isMovable: boolean;
};

/** Alias for combat/runtime hydration — same shape as registry `runtime` on each definition. */
export type LocationPlacedObjectKindRuntimeDefaults = AuthoredPlacedObjectRuntimeFields;

export type AuthoredPlacedObjectDefinition = {
  label: string;
  description?: string;
  iconName: LocationMapGlyphIconName;
  /** If set, place tool uses linked-location flow for this scale. */
  linkedScale?: LocationScaleId;
  /** Host scales where this kind is offered in the place palette. */
  allowedScales: readonly LocationScaleId[];
  runtime: AuthoredPlacedObjectRuntimeFields;
};

/**
 * Single source of truth for authored placed-object ids and their metadata + runtime defaults.
 */
export const AUTHORED_PLACED_OBJECT_DEFINITIONS = {
  city: {
    label: 'City',
    description: 'Settlement or major urban marker.',
    iconName: 'map_city',
    linkedScale: 'city',
    allowedScales: ['world'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
  },
  building: {
    label: 'Building',
    description: 'Structure footprint or icon.',
    iconName: 'map_building',
    linkedScale: 'building',
    allowedScales: ['city'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
  },
  site: {
    label: 'Site',
    description: 'Point of interest or minor location.',
    iconName: 'map_site',
    linkedScale: 'site',
    allowedScales: ['city'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
  },
  tree: {
    label: 'Tree',
    description: 'Vegetation or landmark tree.',
    iconName: 'tree',
    allowedScales: ['city'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
  },
  table: {
    label: 'Table',
    description: 'Furniture or surface.',
    iconName: 'table',
    allowedScales: ['floor'],
    runtime: {
      blocksMovement: false,
      blocksLineOfSight: false,
      coverKind: 'half',
      isMovable: true,
    },
  },
  stairs: {
    label: 'Stairs',
    description: 'Vertical circulation between levels.',
    iconName: 'stairs',
    allowedScales: ['floor'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
  },
  treasure: {
    label: 'Treasure',
    description: 'Loot, hoard, or objective.',
    iconName: 'treasure',
    allowedScales: ['floor'],
    runtime: {
      blocksMovement: true,
      blocksLineOfSight: true,
      coverKind: 'none',
      isMovable: false,
    },
  },
} as const satisfies Record<string, AuthoredPlacedObjectDefinition>;

export type LocationPlacedObjectKindId = keyof typeof AUTHORED_PLACED_OBJECT_DEFINITIONS;
