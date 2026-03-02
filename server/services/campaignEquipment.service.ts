/**
 * Generic campaign-owned equipment service.
 *
 * Handles CRUD for all 4 equipment types (weapon, armor, gear, magicItem)
 * using a single collection with an `equipmentType` discriminator.
 */
import { CampaignEquipment } from '../models/CampaignEquipment.model';
import type { AccessPolicy, AccessPolicyScope } from '../../shared/domain/accessPolicy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EquipmentType = 'weapon' | 'armor' | 'gear' | 'magicItem';

export type CampaignEquipmentDoc = {
  _id: string;
  campaignId: string;
  equipmentType: EquipmentType;
  itemId: string;
  name: string;
  description: string;
  imageKey: string;
  accessPolicy?: AccessPolicy;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

const VALID_SCOPES: AccessPolicyScope[] = ['public', 'dm', 'restricted'];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateInput(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ path: 'name', code: 'REQUIRED', message: 'name is required' });
  } else if (body.name.trim().length > 200) {
    errors.push({ path: 'name', code: 'OUT_OF_RANGE', message: 'name must be 200 characters or fewer' });
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push({ path: 'description', code: 'INVALID_TYPE', message: 'description must be a string' });
  }

  if (body.imageKey !== undefined && typeof body.imageKey !== 'string') {
    errors.push({ path: 'imageKey', code: 'INVALID_TYPE', message: 'imageKey must be a string' });
  }

  if (body.accessPolicy !== undefined && body.accessPolicy !== null) {
    const ap = body.accessPolicy as Record<string, unknown>;
    if (typeof ap !== 'object') {
      errors.push({ path: 'accessPolicy', code: 'INVALID_TYPE', message: 'accessPolicy must be an object' });
    } else if (!VALID_SCOPES.includes(ap.scope as AccessPolicyScope)) {
      errors.push({ path: 'accessPolicy.scope', code: 'INVALID_VALUE', message: `scope must be one of: ${VALID_SCOPES.join(', ')}` });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDoc(doc: Record<string, unknown>): CampaignEquipmentDoc {
  return {
    _id: String(doc._id),
    campaignId: doc.campaignId as string,
    equipmentType: doc.equipmentType as EquipmentType,
    itemId: doc.itemId as string,
    name: doc.name as string,
    description: (doc.description as string) ?? '',
    imageKey: (doc.imageKey as string) ?? '',
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    data: (doc.data as Record<string, unknown>) ?? {},
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

function generateItemId(name: string): string {
  return `custom-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listByCampaign(
  campaignId: string,
  equipmentType: EquipmentType,
): Promise<CampaignEquipmentDoc[]> {
  const docs = await CampaignEquipment.find({ campaignId, equipmentType })
    .sort({ name: 1 })
    .lean();
  return docs.map(d => toDoc(d as Record<string, unknown>));
}

export async function getById(
  campaignId: string,
  equipmentType: EquipmentType,
  itemId: string,
): Promise<CampaignEquipmentDoc | null> {
  const doc = await CampaignEquipment.findOne({ campaignId, equipmentType, itemId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

export async function create(
  campaignId: string,
  equipmentType: EquipmentType,
  body: Record<string, unknown>,
): Promise<{ item: CampaignEquipmentDoc } | { errors: ValidationError[] }> {
  const errors = validateInput(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const itemId = (body.itemId as string | undefined)?.trim() || generateItemId(name);
  const description = ((body.description as string) ?? '').trim();
  const imageKey = ((body.imageKey as string) ?? '').trim();
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;
  const data = (body.data as Record<string, unknown>) ?? {};

  const existing = await CampaignEquipment.findOne({ campaignId, equipmentType, itemId }).lean();
  if (existing) {
    return {
      errors: [{
        path: 'itemId',
        code: 'DUPLICATE',
        message: `An item with id "${itemId}" already exists in this campaign`,
      }],
    };
  }

  const doc = await CampaignEquipment.create({
    campaignId,
    equipmentType,
    itemId,
    name,
    description,
    imageKey,
    accessPolicy,
    data,
  });

  return { item: toDoc(doc.toObject()) };
}

export async function update(
  campaignId: string,
  equipmentType: EquipmentType,
  itemId: string,
  body: Record<string, unknown>,
): Promise<{ item: CampaignEquipmentDoc } | { errors: ValidationError[] } | null> {
  const errors = validateInput(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const description = ((body.description as string) ?? '').trim();
  const imageKey = ((body.imageKey as string) ?? '').trim();
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;
  const data = (body.data as Record<string, unknown>) ?? {};

  const $set: Record<string, unknown> = { name, description, imageKey, data };
  if (accessPolicy !== undefined) $set.accessPolicy = accessPolicy;

  const doc = await CampaignEquipment.findOneAndUpdate(
    { campaignId, equipmentType, itemId },
    { $set },
    { new: true, lean: true },
  );

  return doc ? { item: toDoc(doc as Record<string, unknown>) } : null;
}

export async function remove(
  campaignId: string,
  equipmentType: EquipmentType,
  itemId: string,
): Promise<boolean> {
  const result = await CampaignEquipment.deleteOne({ campaignId, equipmentType, itemId });
  return result.deletedCount > 0;
}
