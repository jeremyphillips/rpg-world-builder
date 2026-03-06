import { CampaignSpell } from '../models/CampaignSpell.model';
import type { AccessPolicy, AccessPolicyScope } from '../../shared/domain/accessPolicy';
import { MAGIC_SCHOOL_OPTIONS } from '../../src/features/content/shared/domain/vocab/magicSchools.vocab';

const VALID_SCOPES: AccessPolicyScope[] = ['public', 'dm', 'restricted'];
const VALID_SCHOOLS = MAGIC_SCHOOL_OPTIONS.map((o) => o.value);

export type CampaignSpellDoc = {
  _id: string;
  campaignId: string;
  spellId: string;
  name: string;
  description: string;
  imageKey: string;
  school: string;
  level: number;
  classes: string[];
  ritual: boolean;
  concentration: boolean;
  effects: unknown[];
  accessPolicy?: AccessPolicy;
  createdAt: string;
  updatedAt: string;
};

export type CampaignSpellInput = {
  spellId?: string;
  name: string;
  description?: string;
  imageKey?: string;
  school: string;
  level: number;
  classes?: string[];
  ritual?: boolean;
  concentration?: boolean;
  effects?: unknown[];
  accessPolicy?: AccessPolicy;
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
    errors.push({
      path: 'name',
      code: 'OUT_OF_RANGE',
      message: 'name must be 100 characters or fewer',
    });
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push({
      path: 'description',
      code: 'INVALID_TYPE',
      message: 'description must be a string',
    });
  }

  if (typeof body.school !== 'string' || !VALID_SCHOOLS.includes(body.school)) {
    errors.push({
      path: 'school',
      code: 'INVALID_VALUE',
      message: `school must be one of: ${VALID_SCHOOLS.join(', ')}`,
    });
  }

  const level = Number(body.level);
  if (!Number.isInteger(level) || level < 0 || level > 9) {
    errors.push({
      path: 'level',
      code: 'INVALID_VALUE',
      message: 'level must be an integer 0–9 (0 = cantrip)',
    });
  }

  if (body.classes !== undefined) {
    if (!Array.isArray(body.classes)) {
      errors.push({
        path: 'classes',
        code: 'INVALID_TYPE',
        message: 'classes must be an array',
      });
    } else if (body.classes.some((x) => typeof x !== 'string')) {
      errors.push({
        path: 'classes',
        code: 'INVALID_TYPE',
        message: 'classes must be an array of strings',
      });
    }
  }

  if (body.effects !== undefined) {
    if (!Array.isArray(body.effects)) {
      errors.push({
        path: 'effects',
        code: 'INVALID_TYPE',
        message: 'effects must be an array',
      });
    }
  }

  if (body.accessPolicy !== undefined && body.accessPolicy !== null) {
    const ap = body.accessPolicy as Record<string, unknown>;
    if (typeof ap !== 'object') {
      errors.push({
        path: 'accessPolicy',
        code: 'INVALID_TYPE',
        message: 'accessPolicy must be an object',
      });
    } else if (!VALID_SCOPES.includes(ap.scope as AccessPolicyScope)) {
      errors.push({
        path: 'accessPolicy.scope',
        code: 'INVALID_VALUE',
        message: `scope must be one of: ${VALID_SCOPES.join(', ')}`,
      });
    } else if (
      ap.allowCharacterIds !== undefined &&
      !Array.isArray(ap.allowCharacterIds)
    ) {
      errors.push({
        path: 'accessPolicy.allowCharacterIds',
        code: 'INVALID_TYPE',
        message: 'allowCharacterIds must be an array',
      });
    }
  }

  return errors;
}

function toDoc(doc: Record<string, unknown>): CampaignSpellDoc {
  return {
    _id: String(doc._id),
    campaignId: doc.campaignId as string,
    spellId: doc.spellId as string,
    name: doc.name as string,
    description: (doc.description as string) ?? '',
    imageKey: (doc.imageKey as string) ?? '',
    school: doc.school as string,
    level: doc.level as number,
    classes: Array.isArray(doc.classes) ? (doc.classes as string[]) : [],
    ritual: Boolean(doc.ritual),
    concentration: Boolean(doc.concentration),
    effects: Array.isArray(doc.effects) ? doc.effects : [],
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

function generateSpellId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function listByCampaign(
  campaignId: string,
): Promise<CampaignSpellDoc[]> {
  const docs = await CampaignSpell.find({ campaignId })
    .sort({ name: 1 })
    .lean();
  return docs.map((d) => toDoc(d as Record<string, unknown>));
}

export async function getById(
  campaignId: string,
  spellId: string,
): Promise<CampaignSpellDoc | null> {
  const doc = await CampaignSpell.findOne({
    campaignId,
    spellId,
  }).lean();
  return doc ? toDoc(doc as Record<string, unknown>) : null;
}

export async function create(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<
  { spell: CampaignSpellDoc } | { errors: ValidationError[] }
> {
  const errors = validateInput(body);
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const spellId =
    (body.spellId as string | undefined)?.trim() || generateSpellId(name);
  const description = ((body.description as string) ?? '').trim();
  const imageKey = ((body.imageKey as string) ?? '').trim();
  const school = body.school as string;
  const level = Number(body.level);
  const classes = Array.isArray(body.classes) ? (body.classes as string[]) : [];
  const ritual = Boolean(body.ritual);
  const concentration = Boolean(body.concentration);
  const effects = Array.isArray(body.effects) ? body.effects : [];
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const existing = await CampaignSpell.findOne({
    campaignId,
    spellId,
  }).lean();
  if (existing) {
    return {
      errors: [
        {
          path: 'spellId',
          code: 'DUPLICATE',
          message: `A spell with id "${spellId}" already exists in this campaign`,
        },
      ],
    };
  }

  const doc = await CampaignSpell.create({
    campaignId,
    spellId,
    name,
    description,
    imageKey,
    school,
    level,
    classes,
    ritual,
    concentration,
    effects,
    accessPolicy,
  });
  return { spell: toDoc(doc.toObject()) };
}

export async function update(
  campaignId: string,
  spellId: string,
  body: Record<string, unknown>,
): Promise<
  | { spell: CampaignSpellDoc }
  | { errors: ValidationError[] }
  | null
> {
  const errors = validateInput({ ...body, spellId });
  if (errors.length > 0) return { errors };

  const name = (body.name as string).trim();
  const description = ((body.description as string) ?? '').trim();
  const imageKey = ((body.imageKey as string) ?? '').trim();
  const school = body.school as string;
  const level = Number(body.level);
  const classes = Array.isArray(body.classes) ? (body.classes as string[]) : undefined;
  const ritual = body.ritual as boolean | undefined;
  const concentration = body.concentration as boolean | undefined;
  const effects = Array.isArray(body.effects) ? body.effects : undefined;
  const accessPolicy = body.accessPolicy as AccessPolicy | undefined;

  const $set: Record<string, unknown> = {
    name,
    description,
    imageKey,
    school,
    level,
  };
  if (classes !== undefined) $set.classes = classes;
  if (ritual !== undefined) $set.ritual = ritual;
  if (concentration !== undefined) $set.concentration = concentration;
  if (effects !== undefined) $set.effects = effects;
  if (accessPolicy !== undefined) $set.accessPolicy = accessPolicy;

  const doc = await CampaignSpell.findOneAndUpdate(
    { campaignId, spellId },
    { $set },
    { new: true, lean: true },
  );

  return doc ? { spell: toDoc(doc as Record<string, unknown>) } : null;
}

export async function remove(
  campaignId: string,
  spellId: string,
): Promise<boolean> {
  const result = await CampaignSpell.deleteOne({
    campaignId,
    spellId,
  });
  return result.deletedCount > 0;
}
