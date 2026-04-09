/**
 * Normalize persisted building location fields from legacy `buildingProfile` and/or
 * `buildingMeta` + `buildingStructure` (target shape).
 */
import type { LocationBuildingMeta, LocationBuildingProfile, LocationBuildingStructure } from './locationBuilding.types';
import type { LocationVerticalStairConnection } from './locationBuildingStairConnection.types';

function isNonEmptyObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0;
}

/** Identity fields only — excludes stairConnections from legacy profile. */
export function buildingMetaFromLegacyProfile(
  profile: LocationBuildingProfile | undefined,
): LocationBuildingMeta | undefined {
  if (!profile) return undefined;
  const rest: Record<string, unknown> = { ...profile };
  delete rest.stairConnections;
  if (!isNonEmptyObject(rest)) return undefined;
  return rest as LocationBuildingMeta;
}

export type NormalizedBuildingFields = {
  buildingMeta: LocationBuildingMeta | undefined;
  buildingStructure: LocationBuildingStructure | undefined;
};

/**
 * Merge persisted document fragments into canonical `buildingMeta` / `buildingStructure`.
 * Still reads legacy `buildingProfile` from DB if present (unmigrated rows).
 */
export function normalizeBuildingFieldsFromPersistedDoc(raw: {
  buildingMeta?: unknown;
  buildingStructure?: unknown;
  buildingProfile?: unknown;
}): NormalizedBuildingFields {
  const legacy = raw.buildingProfile as LocationBuildingProfile | undefined;
  const metaNew = raw.buildingMeta as LocationBuildingMeta | undefined;
  const structNew = raw.buildingStructure as LocationBuildingStructure | undefined;

  const buildingMeta = metaNew ?? buildingMetaFromLegacyProfile(legacy);

  const verticalConnections: LocationVerticalStairConnection[] | undefined =
    structNew?.verticalConnections !== undefined
      ? structNew.verticalConnections
      : legacy?.stairConnections;

  const buildingStructure: LocationBuildingStructure | undefined =
    verticalConnections !== undefined
      ? { ...structNew, verticalConnections }
      : structNew && isNonEmptyObject(structNew)
        ? structNew
        : undefined;

  return { buildingMeta, buildingStructure };
}

/** Resolve vertical stair links from persisted building fields. */
export function getBuildingVerticalConnectionsFromLocationFields(fields: {
  buildingStructure?: LocationBuildingStructure | null;
  buildingProfile?: LocationBuildingProfile | null;
}): LocationVerticalStairConnection[] | undefined {
  const fromStructure = fields.buildingStructure?.verticalConnections;
  if (fromStructure && fromStructure.length > 0) return fromStructure;
  const fromLegacy = fields.buildingProfile?.stairConnections;
  if (fromLegacy && fromLegacy.length > 0) return fromLegacy;
  return undefined;
}

/** Map API write body to `buildingMeta` + `buildingStructure` (no legacy `buildingProfile`). */
export function parseBuildingWritePayload(body: Record<string, unknown>): {
  buildingMeta?: LocationBuildingMeta;
  buildingStructure?: LocationBuildingStructure;
} {
  const meta = body.buildingMeta as LocationBuildingMeta | undefined;
  const structure = body.buildingStructure as LocationBuildingStructure | undefined;
  const out: {
    buildingMeta?: LocationBuildingMeta;
    buildingStructure?: LocationBuildingStructure;
  } = {};
  if (meta && typeof meta === 'object') out.buildingMeta = meta;
  if (structure && typeof structure === 'object') out.buildingStructure = structure;
  return out;
}
