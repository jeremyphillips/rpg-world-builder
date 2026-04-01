import { CampaignRulesetPatch } from '../../../shared/models/CampaignRulesetPatch.model';
import { DEFAULT_SYSTEM_RULESET_ID, SYSTEM_RULESET_IDS } from '@/features/mechanics/domain/rulesets';
import { ABILITY_KEYS, type AbilityKey } from '@/features/mechanics/domain/character';

// ---------------------------------------------------------------------------
// Canonical ability IDs (shared with client via convention)
// ---------------------------------------------------------------------------

const VALID_ABILITY_KEYS = new Set(ABILITY_KEYS);

const VALID_SYSTEM_IDS = new Set(SYSTEM_RULESET_IDS);

// ---------------------------------------------------------------------------
// Normalization (server-side, mirrors client normalizeCampaignRulesetPatch)
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function stripUndefinedDeep(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  let hasKeys = false;

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (isPlainObject(value)) {
      const cleaned = stripUndefinedDeep(value);
      if (cleaned !== undefined) { result[key] = cleaned; hasKeys = true; }
    } else if (Array.isArray(value)) {
      const filtered = value.filter(v => v !== undefined);
      if (filtered.length > 0) { result[key] = filtered; hasKeys = true; }
    } else {
      result[key] = value;
      hasKeys = true;
    }
  }

  return hasKeys ? result : undefined;
}

function normalizePatchFields(body: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (body.meta && isPlainObject(body.meta)) {
    const cleaned = stripUndefinedDeep(body.meta);
    if (cleaned) result.meta = cleaned;
  }
  if (body.content && isPlainObject(body.content)) {
    const cleaned = stripUndefinedDeep(body.content);
    if (cleaned) result.content = cleaned;
  }
  if (body.mechanics && isPlainObject(body.mechanics)) {
    const cleaned = stripUndefinedDeep(body.mechanics);
    if (cleaned) result.mechanics = cleaned;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationError = {
  path: string;
  message: string;
  code: string;
};

function validateAbilityRequirement(
  item: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(item)) {
    errors.push({ path, code: 'INVALID_TYPE', message: 'Must be an object' });
    return;
  }
  const ability = item.ability;
  if (typeof ability !== 'string' || !VALID_ABILITY_KEYS.has(ability as AbilityKey)) {
    errors.push({
      path: `${path}.ability`,
      code: 'INVALID_ID',
      message: `Invalid ability. Valid: ${[...VALID_ABILITY_KEYS].join(', ')}`,
    });
  }
  const min = item.min;
  if (typeof min !== 'number' || !Number.isFinite(min) || min < 1 || min > 30) {
    errors.push({
      path: `${path}.min`,
      code: 'OUT_OF_RANGE',
      message: 'min must be 1–30',
    });
  }
}

function validateEntryRequirements(
  byTarget: unknown,
  basePath: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(byTarget)) return;

  for (const [classId, req] of Object.entries(byTarget)) {
    const rPath = `${basePath}.${classId}`;
    if (!isPlainObject(req)) {
      errors.push({ path: rPath, code: 'INVALID_TYPE', message: 'Must be an object with anyOf' });
      continue;
    }
    const anyOf = (req as Record<string, unknown>).anyOf;
    if (!Array.isArray(anyOf)) {
      errors.push({ path: `${rPath}.anyOf`, code: 'REQUIRED', message: 'anyOf is required' });
      continue;
    }
    if (anyOf.length === 0) {
      errors.push({ path: `${rPath}.anyOf`, code: 'EMPTY_EXPR', message: 'anyOf must not be empty' });
      continue;
    }
    for (let gi = 0; gi < anyOf.length; gi++) {
      const group = anyOf[gi];
      if (!isPlainObject(group) || !Array.isArray((group as Record<string, unknown>).all)) {
        errors.push({ path: `${rPath}.anyOf[${gi}]`, code: 'INVALID_TYPE', message: 'Group must have all[]' });
        continue;
      }
      const all = (group as Record<string, unknown>).all as unknown[];
      if (all.length === 0) {
        errors.push({ path: `${rPath}.anyOf[${gi}].all`, code: 'EMPTY_EXPR', message: 'all must not be empty' });
        continue;
      }
      for (let ai = 0; ai < all.length; ai++) {
        validateAbilityRequirement(all[ai], `${rPath}.anyOf[${gi}].all[${ai}]`, errors);
      }
    }
  }
}

const VALID_CONTENT_POLICIES = new Set(['all_except', 'only']);
const VALID_CONTENT_CATEGORIES = new Set([
  'classes',
  'races',
  'equipment',
  'spells',
  'monsters',
  'locations',
  'skillProficiencies',
]);

function validateContentRule(
  rule: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(rule)) {
    errors.push({ path, code: 'INVALID_TYPE', message: 'Content rule must be an object with policy and ids' });
    return;
  }
  if (!VALID_CONTENT_POLICIES.has(rule.policy as string)) {
    errors.push({ path: `${path}.policy`, code: 'INVALID_ID', message: `policy must be "all_except" or "only"` });
  }
  if (!Array.isArray(rule.ids)) {
    errors.push({ path: `${path}.ids`, code: 'INVALID_TYPE', message: 'ids must be an array' });
    return;
  }
  for (let i = 0; i < (rule.ids as unknown[]).length; i++) {
    const id = (rule.ids as unknown[])[i];
    if (typeof id !== 'string' || id.length === 0) {
      errors.push({ path: `${path}.ids[${i}]`, code: 'INVALID_TYPE', message: 'Each id must be a non-empty string' });
    }
  }
}

function validateContent(
  content: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(content)) return;

  for (const key of Object.keys(content)) {
    if (!VALID_CONTENT_CATEGORIES.has(key)) {
      errors.push({ path: `${path}.${key}`, code: 'INVALID_ID', message: `Unknown content category "${key}"` });
      continue;
    }
    if (content[key] !== undefined) {
      validateContentRule(content[key], `${path}.${key}`, errors);
    }
  }
}

function validatePatchBody(
  body: Record<string, unknown>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  const systemId = body.systemId;
  if (typeof systemId !== 'string' || !VALID_SYSTEM_IDS.has(systemId)) {
    errors.push({
      path: 'systemId',
      code: 'INVALID_ID',
      message: `Unknown systemId. Valid: ${[...VALID_SYSTEM_IDS].join(', ')}`,
    });
  }

  if (body.content !== undefined) {
    validateContent(body.content, 'content', errors);
  }

  const mc = (body.mechanics as Record<string, unknown>)
    ?.progression as Record<string, unknown> | undefined;
  const mcBlock = mc?.multiclassing as Record<string, unknown> | undefined;
  const mcDefault = mcBlock?.default as Record<string, unknown> | undefined;

  if (mcDefault) {
    const basePath = 'mechanics.progression.multiclassing.default';

    if (mcDefault.enabled !== undefined && typeof mcDefault.enabled !== 'boolean') {
      errors.push({ path: `${basePath}.enabled`, code: 'INVALID_TYPE', message: 'Must be boolean' });
    }
    if (mcDefault.minLevelToMulticlass !== undefined) {
      const v = mcDefault.minLevelToMulticlass;
      if (typeof v !== 'number' || v < 1 || v > 20) {
        errors.push({ path: `${basePath}.minLevelToMulticlass`, code: 'OUT_OF_RANGE', message: 'Must be 1–20' });
      }
    }
    if (mcDefault.maxClasses !== undefined) {
      const v = mcDefault.maxClasses;
      if (typeof v !== 'number' || v < 2 || v > 20) {
        errors.push({ path: `${basePath}.maxClasses`, code: 'OUT_OF_RANGE', message: 'Must be 2–20' });
      }
    }
    if (mcDefault.xpMode !== undefined && mcDefault.xpMode !== 'shared' && mcDefault.xpMode !== 'per_class') {
      errors.push({ path: `${basePath}.xpMode`, code: 'INVALID_ID', message: 'Must be "shared" or "per_class"' });
    }

    if (mcDefault.entryRequirementsByTargetClass !== undefined) {
      validateEntryRequirements(
        mcDefault.entryRequirementsByTargetClass,
        `${basePath}.entryRequirementsByTargetClass`,
        errors,
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getPatchByCampaignId(campaignId: string) {
  const doc = await CampaignRulesetPatch.findOne({ campaignId }).lean();
  if (!doc) return null;
  return {
    _id: String(doc._id),
    campaignId: doc.campaignId as string,
    systemId: doc.systemId as string,
    schemaVersion: (doc.schemaVersion as number) ?? 1,
    meta: doc.meta,
    content: doc.content,
    mechanics: doc.mechanics,
  };
}

export async function upsertPatch(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ patch: Record<string, unknown> } | { errors: ValidationError[] }> {
  const systemId = body.systemId ?? DEFAULT_SYSTEM_RULESET_ID;
  const toValidate = { ...body, systemId };

  const errors = validatePatchBody(toValidate as Record<string, unknown>);
  if (errors.length > 0) {
    return { errors };
  }

  const normalized = normalizePatchFields(body);

  const update = {
    campaignId,
    systemId,
    schemaVersion: 1,
    ...normalized,
  };

  const doc = await CampaignRulesetPatch.findOneAndUpdate(
    { campaignId },
    { $set: update },
    { upsert: true, new: true, lean: true },
  );

  return {
    patch: {
      _id: String(doc!._id),
      campaignId: doc!.campaignId,
      systemId: doc!.systemId,
      schemaVersion: doc!.schemaVersion,
      meta: doc!.meta,
      content: doc!.content,
      mechanics: doc!.mechanics,
    },
  };
}
