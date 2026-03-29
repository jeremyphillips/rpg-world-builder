import type {
  LocationMapCell,
  LocationMapCellAuthoringEntry,
  LocationMapKindId,
} from '../../../../../shared/domain/locations';
import {
  canLinkLocationScaleFromHostScale,
  canPlaceObjectKindOnHostScale,
  isCellUnitAllowedForScale,
  mapKindForLocationScale,
} from '../../../../../shared/domain/locations';
import { CampaignLocationMap } from '../../../../shared/models/CampaignLocationMap.model';
import { CampaignLocation } from '../../../../shared/models/CampaignLocation.model';
import { type MapValidationError, validateLocationMapInput } from './locationValidation';
import { countTransitionsReferencingMap } from './locationTransitions.queries';

export type LocationMapDoc = {
  id: string;
  campaignId: string;
  locationId: string;
  name: string;
  kind: LocationMapKindId;
  grid: { width: number; height: number; cellUnit: string | number };
  layout?: { excludedCellIds?: string[] };
  isDefault?: boolean;
  cells?: LocationMapCell[];
  cellEntries?: LocationMapCellAuthoringEntry[];
  createdAt: string;
  updatedAt: string;
};

type ValidationError = MapValidationError;

function validateGridCellUnitForLocationScale(
  locationScale: string,
  cellUnit: unknown,
): ValidationError | null {
  const u = String(cellUnit ?? '').trim();
  if (!u) {
    return { path: 'grid.cellUnit', code: 'INVALID', message: 'grid.cellUnit is required' };
  }
  if (!isCellUnitAllowedForScale(u, locationScale)) {
    return {
      path: 'grid.cellUnit',
      code: 'INVALID',
      message: `Cell unit "${u}" is not allowed for location scale "${locationScale}"`,
    };
  }
  return null;
}

function toDoc(doc: Record<string, unknown>): LocationMapDoc {
  return {
    id: doc.mapId as string,
    campaignId: doc.campaignId as string,
    locationId: doc.locationId as string,
    name: doc.name as string,
    kind: doc.kind as LocationMapDoc['kind'],
    grid: doc.grid as LocationMapDoc['grid'],
    layout: doc.layout as LocationMapDoc['layout'],
    isDefault: doc.isDefault as boolean | undefined,
    cells: doc.cells as LocationMapDoc['cells'],
    cellEntries: doc.cellEntries as LocationMapDoc['cellEntries'],
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

async function validateCellAuthoringPolicy(
  campaignId: string,
  hostLocationId: string,
  hostScale: string,
  cellEntries: LocationMapCellAuthoringEntry[] | undefined,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  if (!cellEntries || cellEntries.length === 0) return errors;

  const linkedIds = new Set<string>();
  for (const e of cellEntries) {
    const lid = e.linkedLocationId?.trim();
    if (lid) linkedIds.add(lid);
  }

  const byId = new Map<string, Record<string, unknown>>();
  if (linkedIds.size > 0) {
    const docs = await CampaignLocation.find({
      campaignId,
      locationId: { $in: [...linkedIds] },
    }).lean();
    for (const d of docs) {
      const row = d as Record<string, unknown>;
      byId.set(String(row.locationId), row);
    }
  }

  for (let i = 0; i < cellEntries.length; i++) {
    const e = cellEntries[i];
    const lid = e.linkedLocationId?.trim();
    if (lid) {
      if (lid === hostLocationId) {
        errors.push({
          path: `cellEntries[${i}].linkedLocationId`,
          code: 'INVALID',
          message: 'A cell cannot link to the map’s own location',
        });
      } else {
        const target = byId.get(lid);
        if (!target) {
          errors.push({
            path: `cellEntries[${i}].linkedLocationId`,
            code: 'NOT_FOUND',
            message: `Linked location "${lid}" was not found in this campaign`,
          });
        } else {
          const targetScale = String(target.scale);
          if (!canLinkLocationScaleFromHostScale(hostScale, targetScale)) {
            errors.push({
              path: `cellEntries[${i}].linkedLocationId`,
              code: 'INVALID',
              message: 'Linked location scale is not allowed for this map',
            });
          }
        }
      }
    }
    const objs = e.objects ?? [];
    for (let j = 0; j < objs.length; j++) {
      const k = objs[j].kind;
      if (!canPlaceObjectKindOnHostScale(hostScale, k)) {
        errors.push({
          path: `cellEntries[${i}].objects[${j}].kind`,
          code: 'INVALID',
          message: `Object kind "${k}" is not allowed for this location scale`,
        });
      }
    }
  }

  return errors;
}

function generateMapId(name: string): string {
  return `${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
}

export async function validateLocationForMap(
  campaignId: string,
  locationId: string,
): Promise<{ ok: true; scale: string } | { errors: ValidationError[] }> {
  const loc = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  if (!loc) {
    return { errors: [{ path: 'locationId', code: 'NOT_FOUND', message: 'Location not found' }] };
  }
  const row = loc as Record<string, unknown>;
  if (row.campaignId !== campaignId) {
    return { errors: [{ path: 'locationId', code: 'NOT_FOUND', message: 'Location not found' }] };
  }
  return { ok: true, scale: String(row.scale) };
}

/** Ensures at most one default map per location when setting `isDefault`. */
export async function normalizeDefaultMapForLocation(
  campaignId: string,
  locationId: string,
  defaultMapId: string,
): Promise<void> {
  await CampaignLocationMap.updateMany(
    { campaignId, locationId, mapId: { $ne: defaultMapId } },
    { $set: { isDefault: false } },
  );
  await CampaignLocationMap.updateOne({ campaignId, mapId: defaultMapId }, { $set: { isDefault: true } });
}

export async function listMapsForLocation(campaignId: string, locationId: string): Promise<LocationMapDoc[]> {
  const docs = await CampaignLocationMap.find({ campaignId, locationId }).sort({ name: 1 }).lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function countMapsForLocation(campaignId: string, locationId: string): Promise<number> {
  return CampaignLocationMap.countDocuments({ campaignId, locationId });
}

export async function getLocationMapById(campaignId: string, mapId: string): Promise<LocationMapDoc | null> {
  const doc = await CampaignLocationMap.findOne({ campaignId, mapId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

export async function getLocationMapByIdOrThrow(
  campaignId: string,
  mapId: string,
): Promise<{ map: LocationMapDoc } | { errors: ValidationError[] }> {
  const doc = await CampaignLocationMap.findOne({ campaignId, mapId }).lean();
  if (!doc) {
    return { errors: [{ path: 'mapId', code: 'NOT_FOUND', message: 'Location map not found' }] };
  }
  const row = doc as Record<string, unknown>;
  if (row.campaignId !== campaignId) {
    return { errors: [{ path: 'mapId', code: 'NOT_FOUND', message: 'Location map not found' }] };
  }
  return { map: toDoc(row) };
}

export async function createLocationMap(
  campaignId: string,
  locationId: string,
  body: Record<string, unknown>,
): Promise<{ map: LocationMapDoc } | { errors: ValidationError[] }> {
  const locCheck = await validateLocationForMap(campaignId, locationId);
  if ('errors' in locCheck) return locCheck;
  const { scale: locationScale } = locCheck;

  if (!body.grid || typeof body.grid !== 'object') {
    return { errors: [{ path: 'grid', code: 'REQUIRED', message: 'grid is required' }] };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const kind = typeof body.kind === 'string' ? body.kind : '';
  const grid = body.grid as Record<string, unknown>;

  const expectedKind = mapKindForLocationScale(locationScale);
  if (kind !== expectedKind) {
    return {
      errors: [
        {
          path: 'kind',
          code: 'INVALID',
          message: `Map kind must be "${expectedKind}" for this location scale`,
        },
      ],
    };
  }

  const validationPayload = {
    name,
    kind,
    grid: {
      width: grid.width as number,
      height: grid.height as number,
      cellUnit: grid.cellUnit,
    },
    cells: body.cells,
    layout: body.layout,
    cellEntries: body.cellEntries,
  };
  const vErr = validateLocationMapInput(validationPayload);
  if (vErr.length > 0) return { errors: vErr };

  const unitPol = validateGridCellUnitForLocationScale(locationScale, grid.cellUnit);
  if (unitPol) return { errors: [unitPol] };

  const cellEntriesPayload = Array.isArray(body.cellEntries)
    ? (body.cellEntries as LocationMapCellAuthoringEntry[])
    : undefined;
  const policyErr = await validateCellAuthoringPolicy(
    campaignId,
    locationId,
    locationScale,
    cellEntriesPayload,
  );
  if (policyErr.length > 0) return { errors: policyErr };

  const mapId =
    (body.mapId as string | undefined)?.trim() ||
    (body.id as string | undefined)?.trim() ||
    generateMapId(name);

  const existing = await CampaignLocationMap.findOne({ campaignId, mapId }).lean();
  if (existing) {
    return {
      errors: [
        {
          path: 'mapId',
          code: 'DUPLICATE',
          message: `A map with id "${mapId}" already exists in this campaign`,
        },
      ],
    };
  }

  const priorCount = await countMapsForLocation(campaignId, locationId);
  let isDefault = body.isDefault === true;
  if (priorCount === 0) {
    isDefault = true;
  }

  await CampaignLocationMap.create({
    campaignId,
    locationId,
    mapId,
    name,
    kind: body.kind as LocationMapDoc['kind'],
    grid: body.grid as LocationMapDoc['grid'],
    ...(body.layout !== undefined && body.layout !== null
      ? { layout: body.layout as LocationMapDoc['layout'] }
      : {}),
    isDefault,
    cells: (body.cells as LocationMapDoc['cells']) ?? [],
    ...(Array.isArray(body.cellEntries) ? { cellEntries: body.cellEntries } : {}),
  });

  if (isDefault) {
    await normalizeDefaultMapForLocation(campaignId, locationId, mapId);
  }

  const fresh = await CampaignLocationMap.findOne({ campaignId, mapId }).lean();
  if (!fresh) {
    return { errors: [{ path: 'mapId', code: 'INTERNAL', message: 'Failed to load map after create' }] };
  }
  return { map: toDoc(fresh as Record<string, unknown>) };
}

function mergeMapPayload(
  existing: Record<string, unknown>,
  body: Record<string, unknown>,
): {
  name: string;
  kind: string;
  grid: { width: number; height: number; cellUnit: unknown };
  cells?: unknown;
  layout?: unknown;
  cellEntries?: unknown;
} {
  const eg = existing.grid as Record<string, unknown>;
  let grid: { width: number; height: number; cellUnit: unknown };
  if (body.grid && typeof body.grid === 'object') {
    const bg = body.grid as Record<string, unknown>;
    grid = {
      width: (bg.width !== undefined ? bg.width : eg.width) as number,
      height: (bg.height !== undefined ? bg.height : eg.height) as number,
      cellUnit: bg.cellUnit !== undefined ? bg.cellUnit : eg.cellUnit,
    };
  } else {
    grid = {
      width: eg.width as number,
      height: eg.height as number,
      cellUnit: eg.cellUnit,
    };
  }
  let layout: unknown;
  if (body.layout !== undefined) {
    layout = body.layout;
  } else if (existing.layout !== undefined) {
    layout = existing.layout;
  }
  let cellEntries: unknown;
  if (body.cellEntries !== undefined) {
    cellEntries = body.cellEntries;
  } else if (existing.cellEntries !== undefined) {
    cellEntries = existing.cellEntries;
  }
  return {
    name: body.name !== undefined ? String(body.name).trim() : (existing.name as string),
    kind: body.kind !== undefined ? String(body.kind) : (existing.kind as string),
    grid,
    cells: body.cells !== undefined ? body.cells : existing.cells,
    layout,
    cellEntries,
  };
}

export async function updateLocationMap(
  campaignId: string,
  mapId: string,
  body: Record<string, unknown>,
): Promise<{ map: LocationMapDoc } | { errors: ValidationError[] } | null> {
  if ('locationId' in body) {
    return {
      errors: [
        {
          path: 'locationId',
          code: 'IMMUTABLE',
          message: 'locationId cannot be changed; create a new map or delete this one',
        },
      ],
    };
  }

  const existing = await CampaignLocationMap.findOne({ campaignId, mapId }).lean();
  if (!existing) return null;

  const existingRow = existing as Record<string, unknown>;
  const merged = mergeMapPayload(existingRow, body);

  const locationId = existingRow.locationId as string;
  const locCheck = await validateLocationForMap(campaignId, locationId);
  if ('errors' in locCheck) return { errors: locCheck.errors };
  const { scale: locationScale } = locCheck;
  const expectedKind = mapKindForLocationScale(locationScale);
  if (merged.kind !== expectedKind) {
    return {
      errors: [
        {
          path: 'kind',
          code: 'INVALID',
          message: `Map kind must be "${expectedKind}" for this location scale`,
        },
      ],
    };
  }

  const vErr = validateLocationMapInput(merged);
  if (vErr.length > 0) return { errors: vErr };

  const unitPol = validateGridCellUnitForLocationScale(locationScale, merged.grid.cellUnit);
  if (unitPol) return { errors: [unitPol] };

  const mergedCellEntries = Array.isArray(merged.cellEntries)
    ? (merged.cellEntries as LocationMapCellAuthoringEntry[])
    : undefined;
  const policyErr = await validateCellAuthoringPolicy(
    campaignId,
    locationId,
    locationScale,
    mergedCellEntries,
  );
  if (policyErr.length > 0) return { errors: policyErr };

  const $set: Record<string, unknown> = {};
  if (body.name !== undefined) $set.name = merged.name;
  if (body.kind !== undefined) $set.kind = merged.kind;
  if (body.grid !== undefined) $set.grid = merged.grid;
  if (body.cells !== undefined) $set.cells = body.cells ?? [];
  if (body.layout !== undefined) $set.layout = body.layout;
  if (body.cellEntries !== undefined) $set.cellEntries = body.cellEntries ?? [];
  if (body.isDefault !== undefined) $set.isDefault = body.isDefault;

  if (Object.keys($set).length === 0) {
    return { map: toDoc(existingRow) };
  }

  const doc = await CampaignLocationMap.findOneAndUpdate({ campaignId, mapId }, { $set }, { new: true, lean: true });
  if (!doc) return null;

  const row = doc as Record<string, unknown>;
  if (body.isDefault === true) {
    await normalizeDefaultMapForLocation(campaignId, locationId, mapId);
    const again = await CampaignLocationMap.findOne({ campaignId, mapId }).lean();
    return { map: toDoc((again ?? doc) as Record<string, unknown>) };
  }

  return { map: toDoc(row) };
}

export async function deleteLocationMap(
  campaignId: string,
  mapId: string,
): Promise<{ ok: true } | { errors: ValidationError[] }> {
  const existing = await CampaignLocationMap.findOne({ campaignId, mapId }).lean();
  if (!existing) {
    return { errors: [{ path: 'mapId', code: 'NOT_FOUND', message: 'Location map not found' }] };
  }

  const refCount = await countTransitionsReferencingMap(campaignId, mapId);
  if (refCount > 0) {
    return {
      errors: [
        {
          path: 'mapId',
          code: 'REFERENCED_BY_TRANSITIONS',
          message: 'Cannot delete map while transitions reference it',
        },
      ],
    };
  }

  const result = await CampaignLocationMap.deleteOne({ campaignId, mapId });
  if (result.deletedCount === 0) {
    return { errors: [{ path: 'mapId', code: 'NOT_FOUND', message: 'Location map not found' }] };
  }
  return { ok: true };
}
