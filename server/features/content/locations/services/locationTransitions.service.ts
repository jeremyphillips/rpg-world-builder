import { CampaignLocationTransition } from '../../../../shared/models/CampaignLocationTransition.model';
import type { LocationTransitionKindId } from '../../../../../shared/domain/locations';
import { validateLocationTransitionInput, type TransitionValidationError } from './locationTransitionValidation';

export type LocationTransitionDoc = {
  id: string;
  campaignId: string;
  from: { mapId: string; cellId: string };
  to: {
    locationId: string;
    mapId?: string;
    targetCellId?: string;
    spawnCellId?: string;
  };
  kind: LocationTransitionKindId;
  label?: string;
  traversal?: {
    bidirectional?: boolean;
    locked?: boolean;
    dc?: number;
    keyItemId?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type ValidationError = TransitionValidationError;

function toDoc(doc: Record<string, unknown>): LocationTransitionDoc {
  return {
    id: doc.transitionId as string,
    campaignId: doc.campaignId as string,
    from: {
      mapId: doc.fromMapId as string,
      cellId: doc.fromCellId as string,
    },
    to: {
      locationId: doc.toLocationId as string,
      mapId: doc.toMapId as string | undefined,
      targetCellId: doc.toTargetCellId as string | undefined,
      spawnCellId: doc.toSpawnCellId as string | undefined,
    },
    kind: doc.kind as LocationTransitionDoc['kind'],
    label: doc.label as string | undefined,
    traversal: doc.traversal as LocationTransitionDoc['traversal'],
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

export { countTransitionsReferencingMap, countTransitionsReferencingLocation } from './locationTransitions.queries';

function getFromCellId(body: Record<string, unknown>): string | undefined {
  if (typeof body.fromCellId === 'string' && body.fromCellId.trim().length > 0) {
    return body.fromCellId.trim();
  }
  const from = body.from as Record<string, unknown> | undefined;
  if (from && typeof from.cellId === 'string' && from.cellId.trim().length > 0) {
    return from.cellId.trim();
  }
  return undefined;
}

function generateTransitionId(): string {
  return `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listTransitionsForMap(campaignId: string, mapId: string): Promise<LocationTransitionDoc[]> {
  const docs = await CampaignLocationTransition.find({ campaignId, fromMapId: mapId }).sort({ createdAt: 1 }).lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function getLocationTransitionById(
  campaignId: string,
  transitionId: string,
): Promise<LocationTransitionDoc | null> {
  const doc = await CampaignLocationTransition.findOne({ campaignId, transitionId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

export async function getLocationTransitionByIdOrThrow(
  campaignId: string,
  transitionId: string,
): Promise<{ transition: LocationTransitionDoc } | { errors: ValidationError[] }> {
  const doc = await CampaignLocationTransition.findOne({ campaignId, transitionId }).lean();
  if (!doc) {
    return { errors: [{ path: 'transitionId', code: 'NOT_FOUND', message: 'Transition not found' }] };
  }
  return { transition: toDoc(doc as Record<string, unknown>) };
}

export async function createLocationTransition(
  campaignId: string,
  fromMapId: string,
  body: Record<string, unknown>,
): Promise<{ transition: LocationTransitionDoc } | { errors: ValidationError[] }> {
  const fromCellId = getFromCellId(body);
  if (!fromCellId) {
    return { errors: [{ path: 'from.cellId', code: 'REQUIRED', message: 'from.cellId is required' }] };
  }
  if (!body.to || typeof body.to !== 'object') {
    return { errors: [{ path: 'to', code: 'REQUIRED', message: 'to is required' }] };
  }
  const to = body.to as Record<string, unknown>;
  if (typeof to.locationId !== 'string' || to.locationId.trim().length === 0) {
    return { errors: [{ path: 'to.locationId', code: 'REQUIRED', message: 'to.locationId is required' }] };
  }
  const from = body.from as Record<string, unknown> | undefined;
  if (from && from.mapId !== undefined && from.mapId !== fromMapId) {
    return { errors: [{ path: 'from.mapId', code: 'INVALID', message: 'from.mapId must match the route map id' }] };
  }

  const toLocationId = (to.locationId as string).trim();
  const toMapId = typeof to.mapId === 'string' ? to.mapId.trim() : undefined;
  const toTargetCellId = typeof to.targetCellId === 'string' ? to.targetCellId.trim() : undefined;
  const toSpawnCellId = typeof to.spawnCellId === 'string' ? to.spawnCellId.trim() : undefined;
  const kind = body.kind as string;

  const v = await validateLocationTransitionInput(campaignId, fromMapId, {
    fromCellId,
    kind,
    toLocationId,
    toMapId: toMapId || undefined,
    toTargetCellId: toTargetCellId || undefined,
    toSpawnCellId: toSpawnCellId || undefined,
  });
  if (v.length > 0) return { errors: v };

  const transitionId =
    (body.transitionId as string | undefined)?.trim() ||
    (body.id as string | undefined)?.trim() ||
    generateTransitionId();

  const existing = await CampaignLocationTransition.findOne({ campaignId, transitionId }).lean();
  if (existing) {
    return {
      errors: [
        {
          path: 'transitionId',
          code: 'DUPLICATE',
          message: `A transition with id "${transitionId}" already exists in this campaign`,
        },
      ],
    };
  }

  await CampaignLocationTransition.create({
    campaignId,
    transitionId,
    fromMapId,
    fromCellId,
    toLocationId,
    toMapId: toMapId || undefined,
    toTargetCellId: toTargetCellId || undefined,
    toSpawnCellId: toSpawnCellId || undefined,
    kind: body.kind as LocationTransitionDoc['kind'],
    label: body.label as string | undefined,
    traversal: body.traversal as Record<string, unknown> | undefined,
  });

  const fresh = await CampaignLocationTransition.findOne({ campaignId, transitionId }).lean();
  if (!fresh) {
    return { errors: [{ path: 'transitionId', code: 'INTERNAL', message: 'Failed to load transition after create' }] };
  }
  return { transition: toDoc(fresh as Record<string, unknown>) };
}

function mergeTransitionPayload(
  existing: Record<string, unknown>,
  body: Record<string, unknown>,
): {
  fromCellId: string;
  kind: string;
  toLocationId: string;
  toMapId?: string;
  toTargetCellId?: string;
  toSpawnCellId?: string;
} {
  const toExisting = existing.toLocationId as string;
  const toBody = body.to as Record<string, unknown> | undefined;
  const mergedTo = toBody ?? {};
  const toLoc =
    mergedTo.locationId !== undefined
      ? String(mergedTo.locationId).trim()
      : toExisting;

  let toMapId: string | undefined;
  if (mergedTo.mapId !== undefined) {
    if (mergedTo.mapId === null || mergedTo.mapId === '') {
      toMapId = undefined;
    } else if (typeof mergedTo.mapId === 'string') {
      const t = mergedTo.mapId.trim();
      toMapId = t === '' ? undefined : t;
    } else {
      toMapId = undefined;
    }
  } else {
    toMapId = existing.toMapId as string | undefined;
  }

  let toTargetCellId: string | undefined;
  if (mergedTo.targetCellId !== undefined) {
    toTargetCellId = typeof mergedTo.targetCellId === 'string' ? mergedTo.targetCellId.trim() : undefined;
  } else {
    toTargetCellId = existing.toTargetCellId as string | undefined;
  }

  let toSpawnCellId: string | undefined;
  if (mergedTo.spawnCellId !== undefined) {
    toSpawnCellId = typeof mergedTo.spawnCellId === 'string' ? mergedTo.spawnCellId.trim() : undefined;
  } else {
    toSpawnCellId = existing.toSpawnCellId as string | undefined;
  }

  const fromCellId =
    body.fromCellId !== undefined
      ? String(body.fromCellId).trim()
      : (existing.fromCellId as string);

  const kind = body.kind !== undefined ? String(body.kind) : (existing.kind as string);

  return {
    fromCellId,
    kind,
    toLocationId: toLoc,
    toMapId,
    toTargetCellId,
    toSpawnCellId,
  };
}

export async function updateLocationTransition(
  campaignId: string,
  routeMapId: string,
  transitionId: string,
  body: Record<string, unknown>,
): Promise<{ transition: LocationTransitionDoc } | { errors: ValidationError[] } | null> {
  if (body.fromMapId !== undefined && body.fromMapId !== routeMapId) {
    return {
      errors: [
        {
          path: 'fromMapId',
          code: 'IMMUTABLE',
          message: 'fromMapId cannot be changed via update; delete and recreate if needed',
        },
      ],
    };
  }

  const existing = await CampaignLocationTransition.findOne({ campaignId, transitionId }).lean();
  if (!existing) return null;

  const er = existing as Record<string, unknown>;
  if (er.fromMapId !== routeMapId) {
    return {
      errors: [
        {
          path: 'transitionId',
          code: 'INVALID',
          message: 'Transition does not belong to this map',
        },
      ],
    };
  }

  const merged = mergeTransitionPayload(er, body);

  const v = await validateLocationTransitionInput(campaignId, routeMapId, merged);
  if (v.length > 0) return { errors: v };

  const $set: Record<string, unknown> = {};
  if (body.fromCellId !== undefined) $set.fromCellId = merged.fromCellId;
  if (body.to !== undefined) {
    $set.toLocationId = merged.toLocationId;
    $set.toMapId = merged.toMapId;
    $set.toTargetCellId = merged.toTargetCellId;
    $set.toSpawnCellId = merged.toSpawnCellId;
  }
  if (body.kind !== undefined) $set.kind = merged.kind;
  if (body.label !== undefined) $set.label = body.label;
  if (body.traversal !== undefined) $set.traversal = body.traversal;

  if (Object.keys($set).length === 0) {
    return { transition: toDoc(er) };
  }

  const doc = await CampaignLocationTransition.findOneAndUpdate(
    { campaignId, transitionId },
    { $set },
    { new: true, lean: true },
  );
  return doc ? { transition: toDoc(doc as Record<string, unknown>) } : null;
}

export async function deleteLocationTransition(
  campaignId: string,
  transitionId: string,
): Promise<{ ok: true } | { errors: ValidationError[] }> {
  const existing = await CampaignLocationTransition.findOne({ campaignId, transitionId }).lean();
  if (!existing) {
    return { errors: [{ path: 'transitionId', code: 'NOT_FOUND', message: 'Transition not found' }] };
  }
  const result = await CampaignLocationTransition.deleteOne({ campaignId, transitionId });
  if (result.deletedCount === 0) {
    return { errors: [{ path: 'transitionId', code: 'NOT_FOUND', message: 'Transition not found' }] };
  }
  return { ok: true };
}
