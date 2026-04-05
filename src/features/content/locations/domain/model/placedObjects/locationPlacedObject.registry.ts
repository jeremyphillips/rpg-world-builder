/**
 * Canonical registry for authored map placed objects (place tool vocabulary).
 * Add new kinds here — derive meta, runtime defaults, and per-scale palette via
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

/** Alias for combat/runtime hydration — same shape as registry `runtime` on each definition. */
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

export type AuthoredPlacedObjectDefinition = {
  label: string;
  description?: string;
  iconName: LocationMapGlyphIconName;
  /** If set, place tool uses linked-location flow for this scale. */
  linkedScale?: LocationScaleId;
  /** Host scales where this kind is offered in the place palette. */
  allowedScales: readonly LocationScaleId[];
  runtime: AuthoredPlacedObjectRuntimeFields;
  /**
   * Optional: contextual interaction / transition role for play and future systems.
   * Distinct from {@link AuthoredPlacedObjectRuntimeFields} spatial blocking.
   */
  interaction?: AuthoredPlacedObjectInteraction;
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
      blocksMovement: false,
      blocksLineOfSight: false,
      coverKind: 'none',
      isMovable: false,
    },
    interaction: { role: 'transition', transitionKind: 'stairs' },
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
