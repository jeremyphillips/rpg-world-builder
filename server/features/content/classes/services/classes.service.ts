import { CampaignClass } from '../../../../shared/models/CampaignClass.model';
import type { AccessPolicy, AccessPolicyScope } from '../../../../../shared/domain/accessPolicy';

const VALID_SCOPES: AccessPolicyScope[] = ['public', 'dm', 'restricted'];

const DATA_KEYS = ['generation', 'proficiencies', 'progression', 'definitions', 'requirements'] as const;

export type CampaignClassDoc = {
  _id: string;
  campaignId: string;
  classId: string;
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

function normalizeImageKey(body: Record<string, unknown>): string {
  if (body.imageKey === undefined || body.imageKey === null) return '';
  return String(body.imageKey).trim();
}

function validateInput(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ path: 'name', code: 'REQUIRED', message: 'name is required' });
  } else if (body.name.trim().length > 100) {
    errors.push({ path: 'name', code: 'OUT_OF_RANGE', message: 'name must be 100 characters or fewer' });
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push({ path: 'description', code: 'INVALID_TYPE', message: 'description must be a string' });
  }

  if (body.imageKey !== undefined && body.imageKey !== null && typeof body.imageKey !== 'string') {
    errors.push({ path: 'imageKey', code: 'INVALID_TYPE', message: 'imageKey must be a string' });
  }

  if (body.classId !== undefined) {
    if (typeof body.classId !== 'string' || body.classId.trim().length === 0) {
      errors.push({ path: 'classId', code: 'INVALID_TYPE', message: 'classId must be a non-empty string' });
    }
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

function toDoc(doc: Record<string, unknown>): CampaignClassDoc {
  return {
    _id: String(doc._id),
    campaignId: doc.campaignId as string,
    classId: doc.classId as string,
    name: doc.name as string,
    description: (doc.description as string) ?? '',
    imageKey:
      doc.imageKey === undefined || doc.imageKey === null ? '' : String(doc.imageKey).trim(),
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    data: (doc.data as Record<string, unknown>) ?? {},
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

function extractData(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of DATA_KEYS) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }
  return data;
}

function generateClassId(name: string): string {
  return `custom-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

export async function listByCampaign(campaignId: string): Promise<CampaignClassDoc[]> {
  const docs = await CampaignClass.find({ campaignId }).sort({ name: 1 }).lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function getById(
  campaignId: string,
  classId: string,
): Promise<CampaignClassDoc | null> {
  const doc = await CampaignClass.findOne({ campaignId, classId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

export async function create(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ class: CampaignClassDoc } | { errors: ValidationError[] }> {
  const errors = validateInput(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const classId = (body.classId as string | undefined)?.trim() || generateClassId(name);
  const description = ((body.description as string) ?? '').trim();
  const imageKey = normalizeImageKey(body);
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;
  const data = extractData(body);

  const existing = await CampaignClass.findOne({ campaignId, classId }).lean();
  if (existing) {
    return {
      errors: [{ path: 'classId', code: 'DUPLICATE', message: `A class with id "${classId}" already exists in this campaign` }],
    };
  }

  const doc = await CampaignClass.create({
    campaignId,
    classId,
    name,
    description,
    imageKey,
    accessPolicy,
    data,
  });
  return { class: toDoc(doc.toObject()) };
}

export async function update(
  campaignId: string,
  classId: string,
  body: Record<string, unknown>,
): Promise<{ class: CampaignClassDoc } | { errors: ValidationError[] } | null> {
  const errors = validateInput({ ...body, classId });
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const description = ((body.description as string) ?? '').trim();
  const imageKey = normalizeImageKey(body);
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;
  const data = extractData(body);

  const $set: Record<string, unknown> = { name, description, imageKey, data };
  if (accessPolicy !== undefined) $set.accessPolicy = accessPolicy;

  const doc = await CampaignClass.findOneAndUpdate(
    { campaignId, classId },
    { $set },
    { new: true, lean: true },
  );

  return doc ? { class: toDoc(doc as Record<string, unknown>) } : null;
}

export async function remove(campaignId: string, classId: string): Promise<boolean> {
  const result = await CampaignClass.deleteOne({ campaignId, classId });
  return result.deletedCount > 0;
}
