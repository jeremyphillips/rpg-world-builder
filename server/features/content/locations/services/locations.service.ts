import { CampaignLocation } from '../../../../shared/models/CampaignLocation.model';
import type { AccessPolicy } from '../../../../../shared/domain/accessPolicy';
import type { LocationConnection } from '../../../../../shared/domain/locations';
import {
  isCategoryAllowedForScale,
  isValidLocationScaleId,
  normalizeCategoryForScale,
} from '../../../../../shared/domain/locations';
import {
  buildAncestorIdsFromParentRow,
  type HierarchyValidationError,
  type LocationScaleId,
  validateLocationScaleNesting,
} from './locationValidation';
import { countMapsForLocation } from './locationMaps.service';
import { countTransitionsReferencingLocation } from './locationTransitions.queries';

export type LocationDoc = {
  id: string;
  campaignId: string;
  name: string;
  scale: LocationScaleId;
  category?: string;
  description?: string;
  imageKey?: string;
  accessPolicy?: AccessPolicy;
  parentId?: string;
  ancestorIds: string[];
  sortOrder?: number;
  label?: { short?: string; number?: string };
  aliases?: string[];
  tags?: string[];
  connections?: LocationConnection[];
  createdAt: string;
  updatedAt: string;
};

type ValidationError = HierarchyValidationError;

function toDoc(doc: Record<string, unknown>): LocationDoc {
  return {
    id: doc.locationId as string,
    campaignId: doc.campaignId as string,
    name: doc.name as string,
    scale: doc.scale as LocationScaleId,
    category: doc.category as string | undefined,
    description: doc.description as string | undefined,
    imageKey: doc.imageKey as string | undefined,
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    parentId: doc.parentId as string | undefined,
    ancestorIds: (doc.ancestorIds as string[]) ?? [],
    sortOrder: doc.sortOrder as number | undefined,
    label: doc.label as LocationDoc['label'],
    aliases: doc.aliases as string[] | undefined,
    tags: doc.tags as string[] | undefined,
    connections: doc.connections as LocationDoc['connections'],
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

function generateLocationId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripClientHierarchyFields(body: Record<string, unknown>): void {
  delete body.ancestorIds;
}

/** Resolve parent for create: omit key = no parent; null/'' = root. */
function resolveParentIdForCreate(body: Record<string, unknown>): string | undefined {
  if (!('parentId' in body)) return undefined;
  const v = body.parentId;
  if (v === null || v === '') return undefined;
  if (typeof v === 'string') {
    const t = v.trim();
    return t === '' ? undefined : t;
  }
  return undefined;
}

/** All strict descendants (by parentId chain), BFS. Does not include `rootLocationId`. */
export async function listDescendantLocationIds(
  campaignId: string,
  rootLocationId: string,
): Promise<string[]> {
  const out: string[] = [];
  const queue = [rootLocationId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const children = await CampaignLocation.find({ campaignId, parentId: id }).lean();
    for (const raw of children) {
      const cid = (raw as Record<string, unknown>).locationId as string;
      out.push(cid);
      queue.push(cid);
    }
  }
  return out;
}

/**
 * ancestorIds for a node whose parent is `parentId` (omit or null = root).
 * Derived only from stored parent linkage — never from client input.
 */
export async function buildAncestorIdsForParent(
  campaignId: string,
  parentId: string | null | undefined,
): Promise<string[]> {
  if (!parentId) return [];
  const parent = await CampaignLocation.findOne({ campaignId, locationId: parentId }).lean();
  if (!parent) return [];
  const row = parent as Record<string, unknown>;
  return buildAncestorIdsFromParentRow({
    locationId: row.locationId as string,
    ancestorIds: (row.ancestorIds as string[]) ?? [],
  });
}

export async function getLocationByIdOrThrow(
  campaignId: string,
  locationId: string,
): Promise<{ location: LocationDoc } | { errors: ValidationError[] }> {
  const doc = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  if (!doc) {
    return { errors: [{ path: 'locationId', code: 'NOT_FOUND', message: 'Location not found' }] };
  }
  return { location: toDoc(doc as Record<string, unknown>) };
}

export async function getParentLocationOrThrow(
  campaignId: string,
  parentId: string,
): Promise<{ parent: Record<string, unknown> } | { errors: ValidationError[] }> {
  const parent = await CampaignLocation.findOne({ campaignId, locationId: parentId }).lean();
  if (!parent) {
    return { errors: [{ path: 'parentId', code: 'NOT_FOUND', message: 'Parent location not found' }] };
  }
  const row = parent as Record<string, unknown>;
  if (row.campaignId !== campaignId) {
    return {
      errors: [{ path: 'parentId', code: 'NOT_FOUND', message: 'Parent location not found' }],
    };
  }
  return { parent: row };
}

/**
 * Validates parent assignment: exists in campaign, self, cycle, scale nesting.
 */
export async function validateParentAssignment(
  campaignId: string,
  childLocationId: string,
  childScale: string,
  newParentId: string | null | undefined,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (newParentId === undefined || newParentId === null || newParentId === '') {
    return errors;
  }

  if (newParentId === childLocationId) {
    errors.push({ path: 'parentId', code: 'SELF_PARENT', message: 'A location cannot be its own parent' });
    return errors;
  }

  const parentResult = await getParentLocationOrThrow(campaignId, newParentId);
  if ('errors' in parentResult) {
    return parentResult.errors;
  }

  const parent = parentResult.parent;
  const parentScale = parent.scale as string;

  const descendants = await listDescendantLocationIds(campaignId, childLocationId);
  if (descendants.includes(newParentId)) {
    errors.push({
      path: 'parentId',
      code: 'CYCLE',
      message: 'Cannot set parent: would create a cycle',
    });
  }

  const scaleErr = validateLocationScaleNesting(parentScale, childScale);
  if (scaleErr) errors.push(scaleErr);

  return errors;
}

/**
 * After a node’s `ancestorIds` is updated, recompute every descendant’s `ancestorIds`.
 */
export async function reparentLocationSubtree(campaignId: string, rootLocationId: string): Promise<void> {
  const children = await CampaignLocation.find({ campaignId, parentId: rootLocationId }).lean();
  for (const raw of children) {
    const child = raw as Record<string, unknown>;
    const childLocationId = child.locationId as string;
    const nextAncestors = await buildAncestorIdsForParent(campaignId, rootLocationId);
    await CampaignLocation.updateOne(
      { campaignId, locationId: childLocationId },
      { $set: { ancestorIds: nextAncestors } },
    );
    await reparentLocationSubtree(campaignId, childLocationId);
  }
}

export async function assertLocationCanDelete(
  campaignId: string,
  locationId: string,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const childCount = await CampaignLocation.countDocuments({ campaignId, parentId: locationId });
  if (childCount > 0) {
    errors.push({
      path: 'locationId',
      code: 'HAS_CHILDREN',
      message: 'Cannot delete location while it has child locations',
    });
  }

  const mapCount = await countMapsForLocation(campaignId, locationId);
  if (mapCount > 0) {
    errors.push({
      path: 'locationId',
      code: 'HAS_MAPS',
      message: 'Cannot delete location while it has maps',
    });
  }

  const transitionCount = await countTransitionsReferencingLocation(campaignId, locationId);
  if (transitionCount > 0) {
    errors.push({
      path: 'locationId',
      code: 'HAS_TRANSITIONS',
      message: 'Cannot delete location while transitions target it',
    });
  }

  return errors;
}

function validateCreate(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ path: 'name', code: 'REQUIRED', message: 'name is required' });
  }
  if (typeof body.scale !== 'string' || body.scale.trim().length === 0) {
    errors.push({ path: 'scale', code: 'REQUIRED', message: 'scale is required' });
  }
  return errors;
}

function validateUpdate(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    errors.push({ path: 'name', code: 'INVALID', message: 'name must be a non-empty string' });
  }
  if (body.scale !== undefined && (typeof body.scale !== 'string' || body.scale.trim().length === 0)) {
    errors.push({ path: 'scale', code: 'INVALID', message: 'scale must be a non-empty string' });
  }
  return errors;
}

/** Validates category string against centralized scale policy. */
function validateCategoryForLocation(scale: string, category: unknown): ValidationError | null {
  if (category === undefined || category === null) return null;
  if (typeof category !== 'string') {
    return { path: 'category', code: 'INVALID', message: 'category must be a string' };
  }
  const t = category.trim();
  if (t === '') return null;
  if (t === 'world') {
    return { path: 'category', code: 'INVALID', message: 'category cannot be "world"' };
  }
  if (!isCategoryAllowedForScale(t, scale)) {
    return {
      path: 'category',
      code: 'INVALID',
      message: `category "${t}" is not allowed for scale "${scale}"`,
    };
  }
  return null;
}

export async function listLocationsByCampaign(campaignId: string): Promise<LocationDoc[]> {
  const docs = await CampaignLocation.find({ campaignId }).sort({ sortOrder: 1, name: 1 }).lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function listChildLocations(campaignId: string, parentId: string): Promise<LocationDoc[]> {
  const docs = await CampaignLocation.find({ campaignId, parentId }).sort({ sortOrder: 1, name: 1 }).lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function getLocationById(campaignId: string, locationId: string): Promise<LocationDoc | null> {
  const doc = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

export async function createLocation(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ location: LocationDoc } | { errors: ValidationError[] }> {
  stripClientHierarchyFields(body);

  const errors = validateCreate(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const scale = (body.scale as string).trim();
  const locationId =
    (body.locationId as string | undefined)?.trim() ||
    (body.id as string | undefined)?.trim() ||
    generateLocationId(name);

  if (!isValidLocationScaleId(scale)) {
    return { errors: [{ path: 'scale', code: 'INVALID', message: 'Invalid scale' }] };
  }

  const worldCount = await CampaignLocation.countDocuments({ campaignId, scale: 'world' });
  if (scale === 'world' && worldCount > 0) {
    return {
      errors: [
        {
          path: 'scale',
          code: 'WORLD_EXISTS',
          message: 'A world location already exists for this campaign',
        },
      ],
    };
  }

  const catErr = validateCategoryForLocation(scale, body.category);
  if (catErr) return { errors: [catErr] };

  const resolvedParentId = resolveParentIdForCreate(body);

  if (scale === 'world' && resolvedParentId) {
    return {
      errors: [{ path: 'parentId', code: 'INVALID', message: 'World locations cannot have a parent' }],
    };
  }

  const assignErrors = await validateParentAssignment(campaignId, locationId, scale, resolvedParentId ?? null);
  if (assignErrors.length > 0) return { errors: assignErrors };

  const existing = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  if (existing) {
    return {
      errors: [
        {
          path: 'locationId',
          code: 'DUPLICATE',
          message: `A location with id "${locationId}" already exists in this campaign`,
        },
      ],
    };
  }

  const ancestorIds = await buildAncestorIdsForParent(campaignId, resolvedParentId);

  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const normalizedCategory =
    scale === 'world'
      ? undefined
      : (() => {
          const c = normalizeCategoryForScale(String(body.category ?? ''), scale);
          return c === '' ? undefined : c;
        })();

  const doc = await CampaignLocation.create({
    campaignId,
    locationId,
    name,
    scale,
    category: normalizedCategory,
    description: body.description as string | undefined,
    imageKey: body.imageKey as string | undefined,
    accessPolicy,
    parentId: resolvedParentId,
    ancestorIds,
    sortOrder: body.sortOrder as number | undefined,
    label: body.label as Record<string, unknown> | undefined,
    aliases: body.aliases as string[] | undefined,
    tags: body.tags as string[] | undefined,
    connections: body.connections as unknown[] | undefined,
  });

  return { location: toDoc(doc.toObject() as Record<string, unknown>) };
}

export async function updateLocation(
  campaignId: string,
  locationId: string,
  body: Record<string, unknown>,
): Promise<{ location: LocationDoc } | { errors: ValidationError[] } | null> {
  stripClientHierarchyFields(body);

  const errors = validateUpdate(body);
  if (errors.length > 0) return { errors };

  const existing = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  if (!existing) return null;

  const existingRow = existing as Record<string, unknown>;

  if (body.scale !== undefined) {
    const next = (body.scale as string).trim();
    if (next !== (existingRow.scale as string)) {
      return {
        errors: [
          {
            path: 'scale',
            code: 'IMMUTABLE',
            message: 'scale cannot be changed after creation',
          },
        ],
      };
    }
  }

  const existingScale = existingRow.scale as string;

  if (body.category !== undefined) {
    const cErr = validateCategoryForLocation(existingScale, body.category);
    if (cErr) return { errors: [cErr] };
  }

  if (existingScale === 'world') {
    if (body.parentId !== undefined && body.parentId !== null && String(body.parentId).trim() !== '') {
      return {
        errors: [{ path: 'parentId', code: 'INVALID', message: 'World locations cannot have a parent' }],
      };
    }
  }

  const existingParentId = existingRow.parentId as string | undefined;

  const parentIdInBody = 'parentId' in body;

  let nextParentId: string | undefined;
  if (!parentIdInBody) {
    nextParentId = existingParentId;
  } else {
    const v = body.parentId;
    if (v === null || v === '') nextParentId = undefined;
    else if (typeof v === 'string') {
      const t = v.trim();
      nextParentId = t === '' ? undefined : t;
    } else {
      nextParentId = existingParentId;
    }
  }

  const nextScale =
    body.scale !== undefined ? (body.scale as string).trim() : (existingRow.scale as string);

  const scaleChanged =
    body.scale !== undefined && (body.scale as string).trim() !== (existingRow.scale as string);

  const parentChanged = parentIdInBody && nextParentId !== existingParentId;

  const parentOrScaleChanged = parentIdInBody || scaleChanged;

  if (parentOrScaleChanged) {
    const assignErrors = await validateParentAssignment(campaignId, locationId, nextScale, nextParentId ?? null);
    if (assignErrors.length > 0) return { errors: assignErrors };
  }

  const $set: Record<string, unknown> = {};

  if (body.name !== undefined) $set.name = (body.name as string).trim();
  if (body.scale !== undefined) $set.scale = (body.scale as string).trim();
  if (body.category !== undefined) {
    const c = normalizeCategoryForScale(String(body.category ?? ''), nextScale);
    $set.category = c === '' ? undefined : c;
  }
  if (body.description !== undefined) $set.description = body.description;
  if (body.imageKey !== undefined) $set.imageKey = body.imageKey;
  if (body.accessPolicy !== undefined) $set.accessPolicy = body.accessPolicy;
  if (body.sortOrder !== undefined) $set.sortOrder = body.sortOrder;
  if (body.label !== undefined) $set.label = body.label;
  if (body.aliases !== undefined) $set.aliases = body.aliases;
  if (body.tags !== undefined) $set.tags = body.tags;
  if (body.connections !== undefined) $set.connections = body.connections;

  if (parentChanged) {
    if (nextParentId === undefined) {
      $set.parentId = undefined;
      $set.ancestorIds = [];
    } else {
      $set.parentId = nextParentId;
      $set.ancestorIds = await buildAncestorIdsForParent(campaignId, nextParentId);
    }
  }


  const doc = await CampaignLocation.findOneAndUpdate({ campaignId, locationId }, { $set }, { new: true, lean: true });

  if (!doc) return null;

  if (parentChanged) {
    await reparentLocationSubtree(campaignId, locationId);
  }

  const fresh = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  return { location: toDoc((fresh ?? doc) as Record<string, unknown>) };
}

export async function deleteLocation(
  campaignId: string,
  locationId: string,
): Promise<{ ok: true } | { errors: ValidationError[] }> {
  const existing = await CampaignLocation.findOne({ campaignId, locationId }).lean();
  if (!existing) {
    return { errors: [{ path: 'locationId', code: 'NOT_FOUND', message: 'Location not found' }] };
  }

  const blockers = await assertLocationCanDelete(campaignId, locationId);
  if (blockers.length > 0) return { errors: blockers };

  const result = await CampaignLocation.deleteOne({ campaignId, locationId });
  if (result.deletedCount === 0) {
    return { errors: [{ path: 'locationId', code: 'NOT_FOUND', message: 'Location not found' }] };
  }
  return { ok: true };
}
