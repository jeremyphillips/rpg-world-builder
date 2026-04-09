/**
 * Building-scale location fields — nested under shared location domain.
 * Used when `scale === 'building'`; complements `scale` / `category`, does not replace them.
 *
 * Target persistence: `buildingMeta` (identity) + `buildingStructure` (topology).
 * Legacy: `buildingProfile` combined both; migrate off with `scripts/migrateLocationBuildingProfile.ts`.
 */

import type { LocationVerticalStairConnection } from './locationBuildingStairConnection.types';

/** Reference to an NPC or player character for ownership / staffing. */
export type LocationEntityRef = {
  kind: 'npc' | 'character';
  id: string;
};

/** Lightweight business/public hours — string-based, not a scheduling engine. */
export type LocationHoursOfOperation = {
  isAlwaysOpen?: boolean;
  openTime?: string;
  closeTime?: string;
  /** e.g. weekday names or short codes — author-defined until stricter schema exists. */
  openDays?: string[];
};

export const LOCATION_BUILDING_PRIMARY_TYPE_IDS = [
  'residence',
  'business',
  'temple',
  'civic',
  'industrial',
  'military',
  'guild',
  'other',
] as const;

export type LocationBuildingPrimaryTypeId = (typeof LOCATION_BUILDING_PRIMARY_TYPE_IDS)[number];

export const LOCATION_BUILDING_PRIMARY_SUBTYPE_IDS = [
  'house',
  'manor',
  'apartment',
  'blacksmith',
  'apothecary',
  'general-store',
  'bakery',
  'workshop',
  'warehouse',
  'tavern',
  'inn',
  'brothel',
  'shrine',
  'temple',
  'cathedral',
  'town-hall',
  'guard-post',
  'guild-house',
  'other',
] as const;

export type LocationBuildingPrimarySubtypeId = (typeof LOCATION_BUILDING_PRIMARY_SUBTYPE_IDS)[number];

export const LOCATION_BUILDING_FUNCTION_IDS = [
  'lodging',
  'food-drink',
  'trade',
  'craft',
  'worship',
  'administration',
  'storage',
  'security',
  'guild-activity',
  'entertainment',
  'residential',
  'manufacturing',
  'healing',
  'education',
  'hospitality-service',
  'other',
] as const;

export type LocationBuildingFunctionId = (typeof LOCATION_BUILDING_FUNCTION_IDS)[number];

/**
 * Identity / function — persisted under `buildingMeta`.
 * Does not include interior topology (stairs, etc.).
 */
export type LocationBuildingMeta = {
  primaryType?: LocationBuildingPrimaryTypeId;
  primarySubtype?: LocationBuildingPrimarySubtypeId;
  /** Mixed-use or secondary roles (e.g. tavern + inn). */
  functions?: LocationBuildingFunctionId[];

  isPublicStorefront?: boolean;
  hoursOfOperation?: LocationHoursOfOperation;

  ownerRefs?: LocationEntityRef[];
  staffRefs?: LocationEntityRef[];

  factionId?: string;
  notes?: string;
};

/**
 * Interior topology for a building — persisted under `buildingStructure`.
 */
export type LocationBuildingStructure = {
  /**
   * Canonical **paired** vertical links between floor maps under this building.
   * Source of truth for stair pairing; see {@link LocationVerticalStairConnection}. **Traversal** is TODO.
   */
  verticalConnections?: LocationVerticalStairConnection[];
};

/**
 * @deprecated Legacy combined document — use {@link LocationBuildingMeta} + {@link LocationBuildingStructure}.
 * May still appear on persisted rows until migration completes.
 */
export type LocationBuildingProfile = LocationBuildingMeta & {
  /**
   * @deprecated Use `buildingStructure.verticalConnections`.
   */
  stairConnections?: LocationVerticalStairConnection[];
};
