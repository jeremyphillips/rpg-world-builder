import { CampaignSkillProficiency } from '../../../../shared/models/CampaignSkillProficiency.model';
import type { AccessPolicy, AccessPolicyScope } from '../../../../../shared/domain/accessPolicy';
import { ABILITY_IDS } from '@/features/mechanics/domain/character';

const VALID_SCOPES: AccessPolicyScope[] = ['public', 'dm', 'restricted'];
const VALID_ABILITIES = ABILITY_IDS;

export type CampaignSkillProficiencyDoc = {
  _id: string;
  campaignId: string;
  skillProficiencyId: string;
  name: string;
  description: string;
  ability: string;
  suggestedClasses: string[];
  examples: string[];
  tags: string[];
  accessPolicy?: AccessPolicy;
  createdAt: string;
  updatedAt: string;
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

  if (typeof body.ability !== 'string' || !VALID_ABILITIES.includes(body.ability as (typeof VALID_ABILITIES)[number])) {
    errors.push({ path: 'ability', code: 'INVALID_VALUE', message: `ability must be one of: ${VALID_ABILITIES.join(', ')}` });
  }

  if (body.suggestedClasses !== undefined) {
    if (!Array.isArray(body.suggestedClasses)) {
      errors.push({ path: 'suggestedClasses', code: 'INVALID_TYPE', message: 'suggestedClasses must be an array' });
    } else if (body.suggestedClasses.some((x) => typeof x !== 'string')) {
      errors.push({ path: 'suggestedClasses', code: 'INVALID_TYPE', message: 'suggestedClasses must be an array of strings' });
    }
  }

  if (body.examples !== undefined) {
    if (!Array.isArray(body.examples)) {
      errors.push({ path: 'examples', code: 'INVALID_TYPE', message: 'examples must be an array' });
    } else if (body.examples.some((x) => typeof x !== 'string')) {
      errors.push({ path: 'examples', code: 'INVALID_TYPE', message: 'examples must be an array of strings' });
    }
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push({ path: 'tags', code: 'INVALID_TYPE', message: 'tags must be an array' });
    } else if (body.tags.some((x) => typeof x !== 'string')) {
      errors.push({ path: 'tags', code: 'INVALID_TYPE', message: 'tags must be an array of strings' });
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

function toDoc(doc: Record<string, unknown>): CampaignSkillProficiencyDoc {
  return {
    _id: String(doc._id),
    campaignId: doc.campaignId as string,
    skillProficiencyId: doc.skillProficiencyId as string,
    name: doc.name as string,
    description: (doc.description as string) ?? '',
    ability: doc.ability as string,
    suggestedClasses: Array.isArray(doc.suggestedClasses) ? (doc.suggestedClasses as string[]) : [],
    examples: Array.isArray(doc.examples) ? (doc.examples as string[]) : [],
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

function generateSkillProficiencyId(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function listByCampaign(campaignId: string): Promise<CampaignSkillProficiencyDoc[]> {
  const docs = await CampaignSkillProficiency.find({ campaignId }).sort({ name: 1 }).lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function getById(campaignId: string, skillProficiencyId: string): Promise<CampaignSkillProficiencyDoc | null> {
  const doc = await CampaignSkillProficiency.findOne({ campaignId, skillProficiencyId }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

export async function create(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ skillProficiency: CampaignSkillProficiencyDoc } | { errors: ValidationError[] }> {
  const errors = validateInput(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const skillProficiencyId = (body.skillProficiencyId as string | undefined)?.trim() || generateSkillProficiencyId(name);
  const description = ((body.description as string) ?? '').trim();
  const ability = body.ability as string;
  const suggestedClasses = Array.isArray(body.suggestedClasses) ? (body.suggestedClasses as string[]) : [];
  const examples = Array.isArray(body.examples) ? (body.examples as string[]) : [];
  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const existing = await CampaignSkillProficiency.findOne({ campaignId, skillProficiencyId }).lean();
  if (existing) {
    return {
      errors: [{ path: 'skillProficiencyId', code: 'DUPLICATE', message: `A skill proficiency with id "${skillProficiencyId}" already exists in this campaign` }],
    };
  }

  const doc = await CampaignSkillProficiency.create({
    campaignId,
    skillProficiencyId,
    name,
    description,
    ability,
    suggestedClasses,
    examples,
    tags,
    accessPolicy,
  });
  return { skillProficiency: toDoc(doc.toObject()) };
}

export async function update(
  campaignId: string,
  skillProficiencyId: string,
  body: Record<string, unknown>,
): Promise<{ skillProficiency: CampaignSkillProficiencyDoc } | { errors: ValidationError[] } | null> {
  const errors = validateInput({ ...body, skillProficiencyId });
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const description = ((body.description as string) ?? '').trim();
  const ability = body.ability as string;
  const suggestedClasses = Array.isArray(body.suggestedClasses) ? (body.suggestedClasses as string[]) : undefined;
  const examples = Array.isArray(body.examples) ? (body.examples as string[]) : undefined;
  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : undefined;
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const $set: Record<string, unknown> = { name, description, ability };
  if (suggestedClasses !== undefined) $set.suggestedClasses = suggestedClasses;
  if (examples !== undefined) $set.examples = examples;
  if (tags !== undefined) $set.tags = tags;
  if (accessPolicy !== undefined) $set.accessPolicy = accessPolicy;

  const doc = await CampaignSkillProficiency.findOneAndUpdate(
    { campaignId, skillProficiencyId },
    { $set },
    { new: true, lean: true },
  );

  return doc ? { skillProficiency: toDoc(doc as Record<string, unknown>) } : null;
}

export async function remove(campaignId: string, skillProficiencyId: string): Promise<boolean> {
  const result = await CampaignSkillProficiency.deleteOne({ campaignId, skillProficiencyId });
  return result.deletedCount > 0;
}
