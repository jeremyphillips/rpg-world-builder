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
  /**
   * Deprecated merged view for API consumers that still read `buildingProfile`.
   * Populated when meta or vertical connections exist.
   */
  buildingProfile: LocationBuildingProfile | undefined;
};

/**
 * Merge persisted document fragments into canonical `buildingMeta` / `buildingStructure`
 * and a backward-compatible `buildingProfile` view.
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

  let buildingProfile: LocationBuildingProfile | undefined;
  if (buildingMeta || verticalConnections !== undefined) {
    buildingProfile = {
      ...buildingMeta,
      ...(verticalConnections !== undefined ? { stairConnections: verticalConnections } : {}),
    };
  }

  return { buildingMeta, buildingStructure, buildingProfile };
}

/** Resolve vertical stair links from a normalized or legacy location-like object. */
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

/**
 * Merge API write payload (new fields and/or legacy `buildingProfile`) into canonical
 * `buildingMeta` + `buildingStructure` for persistence. Does not write `buildingProfile`.
 */
export function parseBuildingWritePayload(body: Record<string, unknown>): {
  buildingMeta?: LocationBuildingMeta;
  buildingStructure?: LocationBuildingStructure;
} {
  const meta = body.buildingMeta as LocationBuildingMeta | undefined;
  const structure = body.buildingStructure as LocationBuildingStructure | undefined;
  const legacy = body.buildingProfile as LocationBuildingProfile | undefined;

  const buildingMeta = meta ?? buildingMetaFromLegacyProfile(legacy);

  const verticalConnections =
    structure?.verticalConnections !== undefined
      ? structure.verticalConnections
      : legacy?.stairConnections;
  const buildingStructure: LocationBuildingStructure | undefined =
    verticalConnections !== undefined
      ? { ...structure, verticalConnections }
      : structure && isNonEmptyObject(structure)
        ? structure
        : undefined;

  return { buildingMeta, buildingStructure };
}
