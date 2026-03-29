import { CampaignLocation } from '../../../../shared/models/CampaignLocation.model';
import { CampaignLocationMap } from '../../../../shared/models/CampaignLocationMap.model';
import { cellIdExistsOnMap } from '../../../../../shared/domain/locations';
import {
  LOCATION_TRANSITION_KIND_IDS,
  type LocationTransitionKindId,
} from '../../../../../shared/domain/locations';

export type TransitionValidationError = {
  path: string;
  code: string;
  message: string;
};

function isLocationTransitionKindId(value: string): value is LocationTransitionKindId {
  return (LOCATION_TRANSITION_KIND_IDS as readonly string[]).includes(value);
}

export function validateTransitionKind(kind: unknown): TransitionValidationError[] {
  if (typeof kind !== 'string' || !isLocationTransitionKindId(kind)) {
    return [
      {
        path: 'kind',
        code: 'INVALID',
        message: `kind must be one of: ${LOCATION_TRANSITION_KIND_IDS.join(', ')}`,
      },
    ];
  }
  return [];
}

export async function validateSourceMap(
  campaignId: string,
  fromMapId: string,
): Promise<{ map: Record<string, unknown> } | { errors: TransitionValidationError[] }> {
  const m = await CampaignLocationMap.findOne({ campaignId, mapId: fromMapId }).lean();
  if (!m) {
    return { errors: [{ path: 'from.mapId', code: 'NOT_FOUND', message: 'Source map not found' }] };
  }
  const row = m as Record<string, unknown>;
  if (row.campaignId !== campaignId) {
    return { errors: [{ path: 'from.mapId', code: 'NOT_FOUND', message: 'Source map not found' }] };
  }
  return { map: row };
}

export function validateSourceCell(
  mapRow: Record<string, unknown>,
  fromCellId: string,
): TransitionValidationError[] {
  const cells = mapRow.cells;
  if (!Array.isArray(cells) || cells.length === 0) {
    return [
      {
        path: 'from.cellId',
        code: 'NO_SOURCE_CELLS',
        message: 'Map has no authored cells; add cells before creating transitions',
      },
    ];
  }
  if (!cellIdExistsOnMap(cells, fromCellId)) {
    return [
      {
        path: 'from.cellId',
        code: 'INVALID_SOURCE_CELL',
        message: 'from.cellId is not present on the source map cells',
      },
    ];
  }
  return [];
}

export async function validateTargetLocation(
  campaignId: string,
  locationId: string,
): Promise<TransitionValidationError[]> {
  const loc = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  if (!loc) {
    return [{ path: 'to.locationId', code: 'NOT_FOUND', message: 'Target location not found' }];
  }
  const row = loc as Record<string, unknown>;
  if (row.campaignId !== campaignId) {
    return [{ path: 'to.locationId', code: 'NOT_FOUND', message: 'Target location not found' }];
  }
  return [];
}

export async function validateTargetMapAndCells(
  campaignId: string,
  toLocationId: string,
  toMapId: string | undefined,
  toTargetCellId: string | undefined,
  toSpawnCellId: string | undefined,
): Promise<TransitionValidationError[]> {
  const errors: TransitionValidationError[] = [];
  if ((toTargetCellId || toSpawnCellId) && !toMapId) {
    errors.push({
      path: 'to.mapId',
      code: 'REQUIRED',
      message: 'to.mapId is required when targetCellId or spawnCellId is set',
    });
    return errors;
  }
  if (!toMapId) return errors;

  const tm = await CampaignLocationMap.findOne({ campaignId, mapId: toMapId }).lean();
  if (!tm) {
    errors.push({ path: 'to.mapId', code: 'NOT_FOUND', message: 'Target map not found' });
    return errors;
  }
  const tr = tm as Record<string, unknown>;
  if (tr.campaignId !== campaignId) {
    errors.push({ path: 'to.mapId', code: 'NOT_FOUND', message: 'Target map not found' });
    return errors;
  }
  if (tr.locationId !== toLocationId) {
    errors.push({
      path: 'to.mapId',
      code: 'INVALID_TARGET_MAP',
      message: 'Target map does not belong to to.locationId',
    });
    return errors;
  }

  const cells = tr.cells;
  if (toTargetCellId) {
    if (!Array.isArray(cells) || cells.length === 0) {
      errors.push({
        path: 'to.targetCellId',
        code: 'NO_TARGET_CELLS',
        message: 'Target map has no authored cells; cannot validate targetCellId',
      });
    } else if (!cellIdExistsOnMap(cells, toTargetCellId)) {
      errors.push({
        path: 'to.targetCellId',
        code: 'INVALID_TARGET_CELL',
        message: 'targetCellId is not present on the target map cells',
      });
    }
  }
  if (toSpawnCellId) {
    if (!Array.isArray(cells) || cells.length === 0) {
      errors.push({
        path: 'to.spawnCellId',
        code: 'NO_TARGET_CELLS',
        message: 'Target map has no authored cells; cannot validate spawnCellId',
      });
    } else if (!cellIdExistsOnMap(cells, toSpawnCellId)) {
      errors.push({
        path: 'to.spawnCellId',
        code: 'INVALID_SPAWN_CELL',
        message: 'spawnCellId is not present on the target map cells',
      });
    }
  }
  return errors;
}

export async function validateLocationTransitionInput(
  campaignId: string,
  routeFromMapId: string,
  input: {
    fromCellId: string;
    kind: string;
    toLocationId: string;
    toMapId?: string;
    toTargetCellId?: string;
    toSpawnCellId?: string;
  },
): Promise<TransitionValidationError[]> {
  const errors: TransitionValidationError[] = [];
  errors.push(...validateTransitionKind(input.kind));

  const src = await validateSourceMap(campaignId, routeFromMapId);
  if ('errors' in src) return [...errors, ...src.errors];

  errors.push(...validateSourceCell(src.map, input.fromCellId));
  errors.push(...(await validateTargetLocation(campaignId, input.toLocationId)));
  errors.push(
    ...(await validateTargetMapAndCells(
      campaignId,
      input.toLocationId,
      input.toMapId,
      input.toTargetCellId,
      input.toSpawnCellId,
    )),
  );
  return errors;
}
