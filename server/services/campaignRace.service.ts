import { CampaignRace } from '../models/CampaignRace.model';
import type { AccessPolicy, AccessPolicyScope } from '../../shared/domain/accessPolicy';

const VALID_SCOPES: AccessPolicyScope[] = ['public', 'dm', 'restricted'];

export type CampaignRaceDoc = {
  _id: string;
  campaignId: string;
  raceId: string;
  name: string;
  description: string;
  accessPolicy?: AccessPolicy;
  createdAt: string;
  updatedAt: string;
};

export type CampaignRaceInput = {
  raceId?: string;
  name: string;
  description?: string;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

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

  if (body.raceId !== undefined) {
    if (typeof body.raceId !== 'string' || body.raceId.trim().length === 0) {
      errors.push({ path: 'raceId', code: 'INVALID_TYPE', message: 'raceId must be a non-empty string' });
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

function toDoc(doc: Record<string, unknown>): CampaignRaceDoc {
  return {
    _id: String(doc._id),
    campaignId: doc.campaignId as string,
    raceId: doc.raceId as string,
    name: doc.name as string,
    description: (doc.description as string) ?? '',
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

export async function listByCampaign(campaignId: string): Promise<CampaignRaceDoc[]> {
  const docs = await CampaignRace.find({ campaignId }).sort({ name: 1 }).lean();
  return docs.map(d => toDoc(d as Record<string, unknown>));
}

export async function getById(campaignId: string, raceId: string): Promise<CampaignRaceDoc | null> {
  const doc = await CampaignRace.findOne({ campaignId, raceId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

function generateRaceId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function create(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ race: CampaignRaceDoc } | { errors: ValidationError[] }> {
  const errors = validateInput(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const raceId = (body.raceId as string | undefined)?.trim() || generateRaceId(name);
  const description = ((body.description as string) ?? '').trim();
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const existing = await CampaignRace.findOne({ campaignId, raceId }).lean();
  if (existing) {
    return { errors: [{ path: 'raceId', code: 'DUPLICATE', message: `A race with id "${raceId}" already exists in this campaign` }] };
  }

  const doc = await CampaignRace.create({ campaignId, raceId, name, description, accessPolicy });
  return { race: toDoc(doc.toObject()) };
}

export async function update(
  campaignId: string,
  raceId: string,
  body: Record<string, unknown>,
): Promise<{ race: CampaignRaceDoc } | { errors: ValidationError[] } | null> {
  const errors = validateInput({ ...body, raceId });
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const description = ((body.description as string) ?? '').trim();
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const $set: Record<string, unknown> = { name, description };
  if (accessPolicy !== undefined) $set.accessPolicy = accessPolicy;

  const doc = await CampaignRace.findOneAndUpdate(
    { campaignId, raceId },
    { $set },
    { new: true, lean: true },
  );

  return doc ? { race: toDoc(doc as Record<string, unknown>) } : null;
}

export async function remove(campaignId: string, raceId: string): Promise<boolean> {
  const result = await CampaignRace.deleteOne({ campaignId, raceId });
  return result.deletedCount > 0;
}
