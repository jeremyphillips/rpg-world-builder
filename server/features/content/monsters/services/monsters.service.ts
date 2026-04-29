import { CampaignMonster } from '../../../../shared/models/CampaignMonster.model';
import type { AccessPolicy, AccessPolicyScope } from '../../../../../shared/domain/accessPolicy';

const VALID_SCOPES: AccessPolicyScope[] = ['public', 'dm', 'restricted'];

export type CampaignMonsterDoc = {
  _id: string;
  campaignId: string;
  monsterId: string;
  name: string;
  data: Record<string, unknown>;
  accessPolicy?: AccessPolicy;
  createdAt: string;
  updatedAt: string;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

/** Top-level / reserved keys — never persisted inside `data` (mirrors create “rest → data”). */
const RESERVED_MONSTER_KEYS = new Set(['name', 'monsterId', 'id', 'accessPolicy', 'data']);

function validateInput(
  body: Record<string, unknown>,
  options?: { isUpdate?: boolean },
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isUpdate = options?.isUpdate === true;

  if (!isUpdate) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push({ path: 'name', code: 'REQUIRED', message: 'name is required' });
    } else if (body.name.trim().length > 200) {
      errors.push({ path: 'name', code: 'OUT_OF_RANGE', message: 'name must be 200 characters or fewer' });
    }
  } else {
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        errors.push({ path: 'name', code: 'REQUIRED', message: 'name cannot be empty' });
      } else if (body.name.trim().length > 200) {
        errors.push({ path: 'name', code: 'OUT_OF_RANGE', message: 'name must be 200 characters or fewer' });
      }
    }
  }

  if (body.monsterId !== undefined) {
    if (typeof body.monsterId !== 'string' || body.monsterId.trim().length === 0) {
      errors.push({ path: 'monsterId', code: 'INVALID_TYPE', message: 'monsterId must be a non-empty string' });
    }
  }

  if (body.imageKey !== undefined && body.imageKey !== null && typeof body.imageKey !== 'string') {
    errors.push({ path: 'imageKey', code: 'INVALID_TYPE', message: 'imageKey must be a string' });
  }

  if (body.accessPolicy !== undefined && body.accessPolicy !== null) {
    const ap = body.accessPolicy as Record<string, unknown>;
    if (typeof ap !== 'object') {
      errors.push({ path: 'accessPolicy', code: 'INVALID_TYPE', message: 'accessPolicy must be an object' });
    } else if (!VALID_SCOPES.includes(ap.scope as AccessPolicyScope)) {
      errors.push({ path: 'accessPolicy.scope', code: 'INVALID_VALUE', message: `scope must be one of: ${VALID_SCOPES.join(', ')}` });
    } else if (ap.allowCharacterIds !== undefined && !Array.isArray(ap.allowCharacterIds)) {
      errors.push({ path: 'accessPolicy.allowCharacterIds', code: 'INVALID_TYPE', message: 'allowCharacterIds must be an array' });
    }
  }

  return errors;
}

function toDoc(doc: Record<string, unknown>): CampaignMonsterDoc {
  return {
    _id: String(doc._id),
    campaignId: doc.campaignId as string,
    monsterId: doc.monsterId as string,
    name: doc.name as string,
    data: (doc.data as Record<string, unknown>) ?? {},
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

export async function listByCampaign(campaignId: string): Promise<CampaignMonsterDoc[]> {
  const docs = await CampaignMonster.find({ campaignId }).sort({ name: 1 }).lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function getById(campaignId: string, monsterId: string): Promise<CampaignMonsterDoc | null> {
  const doc = await CampaignMonster.findOne({ campaignId, monsterId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

function generateMonsterId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function create(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ monster: CampaignMonsterDoc } | { errors: ValidationError[] }> {
  const errors = validateInput(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const monsterId = (body.monsterId as string | undefined)?.trim() || (body.id as string | undefined)?.trim() || generateMonsterId(name);
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const { name: _n, monsterId: _m, id: _i, accessPolicy: _a, data: nestedData, ...flatRest } = body;
  const data =
    nestedData !== undefined && typeof nestedData === 'object' && nestedData !== null && !Array.isArray(nestedData)
      ? Object.keys(flatRest).length > 0
        ? { ...(nestedData as Record<string, unknown>), ...flatRest }
        : { ...(nestedData as Record<string, unknown>) }
      : Object.keys(flatRest).length > 0
        ? flatRest
        : {};

  const existing = await CampaignMonster.findOne({ campaignId, monsterId }).lean();
  if (existing) {
    return { errors: [{ path: 'monsterId', code: 'DUPLICATE', message: `A monster with id "${monsterId}" already exists in this campaign` }] };
  }

  const doc = await CampaignMonster.create({ campaignId, monsterId, name, data, accessPolicy });
  return { monster: toDoc(doc.toObject()) };
}

export async function update(
  campaignId: string,
  monsterId: string,
  body: Record<string, unknown>,
): Promise<{ monster: CampaignMonsterDoc } | { errors: ValidationError[] } | null> {
  const errors = validateInput({ ...body, monsterId }, { isUpdate: true });
  if (errors.length > 0) return { errors };

  const existing = await CampaignMonster.findOne({ campaignId, monsterId }).lean();
  if (!existing) return null;

  /**
   * PATCH contract:
   * - Top-level fields (except name, monsterId, id, accessPolicy, `data`) are **shallow-merged**
   *   into the existing `data` document (same keys as create’s “rest → data”).
   * - If the body includes a plain object `data`, it **replaces** the entire stored `data` object
   *   (escape hatch for callers that send nested payloads only). Flat keys in the same body are
   *   ignored when `data` is present, except reserved top-level fields below.
   */
  const existingData = ((existing as Record<string, unknown>).data as Record<string, unknown>) ?? {};

  let nextData: Record<string, unknown>;
  if (body.data !== undefined && body.data !== null && typeof body.data === 'object' && !Array.isArray(body.data)) {
    nextData = { ...(body.data as Record<string, unknown>) };
  } else {
    nextData = { ...existingData };
    for (const [key, value] of Object.entries(body)) {
      if (RESERVED_MONSTER_KEYS.has(key)) continue;
      nextData[key] = value;
    }
  }

  const $set: Record<string, unknown> = { data: nextData };
  if (body.name !== undefined && typeof body.name === 'string') {
    $set.name = body.name.trim();
  }
  if (body.accessPolicy !== undefined) {
    $set.accessPolicy = body.accessPolicy;
  }

  const doc = await CampaignMonster.findOneAndUpdate(
    { campaignId, monsterId },
    { $set },
    { new: true, lean: true },
  );

  return doc ? { monster: toDoc(doc as Record<string, unknown>) } : null;
}

export async function remove(campaignId: string, monsterId: string): Promise<boolean> {
  const result = await CampaignMonster.deleteOne({ campaignId, monsterId });
  return result.deletedCount > 0;
}
