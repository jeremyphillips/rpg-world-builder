/**
 * Validate a CampaignRulesetPatch against its system ruleset.
 *
 * Returns structured errors with JSON-pointer-style paths so callers can
 * map issues back to specific fields (UI form errors, API responses, etc.).
 */
import type { CampaignRulesetPatch, SystemRuleset } from '../../types/ruleset.types';
import { ABILITY_KEYS, type AbilityKey } from '@/features/mechanics/domain/character';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationError = {
  path: string;
  message: string;
  code: string;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_ABILITY_KEYS = new Set(ABILITY_KEYS);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function err(path: string, code: string, message: string): ValidationError {
  return { path, code, message };
}

// ---------------------------------------------------------------------------
// Identity validators
// ---------------------------------------------------------------------------

function validateIdentity(
  patch: CampaignRulesetPatch,
  errors: ValidationError[],
): void {
  if (typeof patch._id !== 'string' || patch._id.length === 0) {
    errors.push(err('_id', 'REQUIRED', '_id is required'));
  }
  if (typeof patch.campaignId !== 'string' || patch.campaignId.length === 0) {
    errors.push(err('campaignId', 'REQUIRED', 'campaignId is required'));
  }
  if (typeof patch.systemId !== 'string' || patch.systemId.length === 0) {
    errors.push(err('systemId', 'REQUIRED', 'systemId is required'));
  }
}

// ---------------------------------------------------------------------------
// Meta validators
// ---------------------------------------------------------------------------

function validateMeta(
  meta: Record<string, unknown>,
  path: string,
  errors: ValidationError[],
): void {
  if (meta.name !== undefined && typeof meta.name !== 'string') {
    errors.push(err(`${path}.name`, 'INVALID_TYPE', 'meta.name must be a string'));
  }
  if (meta.version !== undefined) {
    if (typeof meta.version !== 'number' || !Number.isFinite(meta.version) || meta.version < 1) {
      errors.push(err(`${path}.version`, 'OUT_OF_RANGE', 'meta.version must be a positive integer'));
    }
  }
}

// ---------------------------------------------------------------------------
// Requirement expression validators
// ---------------------------------------------------------------------------

function validateRequirementItem(
  item: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(item)) {
    errors.push(err(path, 'INVALID_TYPE', 'Requirement item must be an object'));
    return;
  }

  const ability = item.ability;
  if (typeof ability !== 'string' || ability.length === 0) {
    errors.push(err(`${path}.ability`, 'REQUIRED', 'ability is required'));
  } else if (!VALID_ABILITY_KEYS.has(ability as AbilityKey)) {
    errors.push(err(
      `${path}.ability`,
      'INVALID_ID',
      `Unknown ability "${ability}". Valid: ${[...VALID_ABILITY_KEYS].join(', ')}`,
    ));
  }

  const min = item.min; 
  if (min === undefined || min === null) {
    errors.push(err(`${path}.min`, 'REQUIRED', 'min is required'));
  } else if (typeof min !== 'number' || !Number.isFinite(min)) {
    errors.push(err(`${path}.min`, 'INVALID_TYPE', 'min must be a finite number'));
  } else if (min < 1 || min > 30) {
    errors.push(err(`${path}.min`, 'OUT_OF_RANGE', `min must be between 1 and 30 (got ${min})`));
  }
}

function validateRequirementGroup(
  group: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(group)) {
    errors.push(err(path, 'INVALID_TYPE', 'Requirement group must be an object with "all" array'));
    return;
  }

  const all = group.all;
  if (!Array.isArray(all)) {
    errors.push(err(`${path}.all`, 'REQUIRED', '"all" must be an array'));
    return;
  }

  if (all.length === 0) {
    errors.push(err(`${path}.all`, 'EMPTY_EXPR', '"all" array must not be empty'));
    return;
  }

  for (let i = 0; i < all.length; i++) {
    validateRequirementItem(all[i], `${path}.all[${i}]`, errors);
  }
}

function validateEntryRequirement(
  req: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(req)) {
    errors.push(err(path, 'INVALID_TYPE', 'Entry requirement must be an object with "anyOf" array'));
    return;
  }

  const anyOf = req.anyOf;
  if (!Array.isArray(anyOf)) {
    errors.push(err(`${path}.anyOf`, 'REQUIRED', '"anyOf" must be an array'));
    return;
  }

  if (anyOf.length === 0) {
    errors.push(err(`${path}.anyOf`, 'EMPTY_EXPR', '"anyOf" array must not be empty — requirement would be impossible to satisfy'));
    return;
  }

  for (let i = 0; i < anyOf.length; i++) {
    validateRequirementGroup(anyOf[i], `${path}.anyOf[${i}]`, errors);
  }
}

// ---------------------------------------------------------------------------
// Multiclassing validators
// ---------------------------------------------------------------------------

function validateMulticlassingDefault(
  mcDefault: Record<string, unknown>,
  path: string,
  system: SystemRuleset,
  lookup: RulesetValidationLookup,
  errors: ValidationError[],
): void {
  if (mcDefault.enabled !== undefined && typeof mcDefault.enabled !== 'boolean') {
    errors.push(err(`${path}.enabled`, 'INVALID_TYPE', 'enabled must be a boolean'));
  }

  if (mcDefault.minLevelToMulticlass !== undefined) {
    const val = mcDefault.minLevelToMulticlass;
    if (typeof val !== 'number' || !Number.isFinite(val) || val < 1 || val > 20) {
      errors.push(err(`${path}.minLevelToMulticlass`, 'OUT_OF_RANGE', 'minLevelToMulticlass must be 1–20'));
    }
  }

  if (mcDefault.maxClasses !== undefined) {
    const val = mcDefault.maxClasses;
    if (typeof val !== 'number' || !Number.isFinite(val) || val < 2 || val > 20) {
      errors.push(err(`${path}.maxClasses`, 'OUT_OF_RANGE', 'maxClasses must be 2–20'));
    }
  }

  if (mcDefault.xpMode !== undefined) {
    if (mcDefault.xpMode !== 'shared' && mcDefault.xpMode !== 'per_class') {
      errors.push(err(`${path}.xpMode`, 'INVALID_ID', 'xpMode must be "shared" or "per_class"'));
    }
  }

  if (mcDefault.defaultEntryRequirement !== undefined) {
    validateEntryRequirement(
      mcDefault.defaultEntryRequirement,
      `${path}.defaultEntryRequirement`,
      errors,
    );
  }

  const byTarget = mcDefault.entryRequirementsByTargetClass;
  if (byTarget !== undefined) {
    if (!isPlainObject(byTarget)) {
      errors.push(err(
        `${path}.entryRequirementsByTargetClass`,
        'INVALID_TYPE',
        'entryRequirementsByTargetClass must be an object',
      ));
    } else {
      const classesRule = system.content.classes;
      const allowsAllClasses = !classesRule
        || (classesRule.policy === 'all_except' && classesRule.ids.length === 0);

      for (const [classId, req] of Object.entries(byTarget)) {
        const reqPath = `${path}.entryRequirementsByTargetClass.${classId}`;

        if (classId.length === 0) {
          errors.push(err(reqPath, 'INVALID_ID', 'Class ID must not be empty'));
          continue;
        }

        if (!allowsAllClasses && lookup.isValidClassId && !lookup.isValidClassId(classId)) {
          errors.push(err(reqPath, 'INVALID_ID', `Unknown class ID "${classId}" — not found in system ruleset content`));
        }

        validateEntryRequirement(req, reqPath, errors);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Content validators
// ---------------------------------------------------------------------------

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

export type RulesetValidationLookup = {
  isValidClassId?: (id: string) => boolean;
  isValidRaceId?: (id: string) => boolean;
};

function getIdValidator(
  category: string,
  lookup: RulesetValidationLookup,
): ((id: string) => boolean) | undefined {
  if (category === 'classes') return lookup.isValidClassId;
  if (category === 'races') return lookup.isValidRaceId;
  return undefined;
}

function validateContentRule(
  rule: unknown,
  path: string,
  category: string,
  lookup: RulesetValidationLookup,
  errors: ValidationError[],
): void {
  if (!isPlainObject(rule)) {
    errors.push(err(path, 'INVALID_TYPE', 'Content rule must be an object with policy and ids'));
    return;
  }

  if (!VALID_CONTENT_POLICIES.has(rule.policy as string)) {
    errors.push(err(
      `${path}.policy`,
      'INVALID_ID',
      `policy must be "all_except" or "only" (got "${rule.policy}")`,
    ));
  }

  if (!Array.isArray(rule.ids)) {
    errors.push(err(`${path}.ids`, 'INVALID_TYPE', 'ids must be an array'));
    return;
  }

  const validator = getIdValidator(category, lookup);
  for (let i = 0; i < (rule.ids as unknown[]).length; i++) {
    const id = (rule.ids as unknown[])[i];
    if (typeof id !== 'string' || id.length === 0) {
      errors.push(err(`${path}.ids[${i}]`, 'INVALID_TYPE', 'Each id must be a non-empty string'));
    } else if (validator && !validator(id)) {
      errors.push(err(`${path}.ids[${i}]`, 'INVALID_ID', `Unknown ${category} id "${id}"`));
    }
  }
}

function validateContent(
  content: Record<string, unknown>,
  path: string,
  lookup: RulesetValidationLookup,
  errors: ValidationError[],
): void {
  for (const key of Object.keys(content)) {
    if (!VALID_CONTENT_CATEGORIES.has(key)) {
      errors.push(err(`${path}.${key}`, 'INVALID_ID', `Unknown content category "${key}"`));
      continue;
    }
    if (content[key] !== undefined) {
      validateContentRule(content[key], `${path}.${key}`, key, lookup, errors);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function validateCampaignRulesetPatch(
  patch: CampaignRulesetPatch,
  system: SystemRuleset,
  lookup: RulesetValidationLookup = {},
): ValidationResult {
  const errors: ValidationError[] = [];

  validateIdentity(patch, errors);

  if (patch.meta && isPlainObject(patch.meta)) {
    validateMeta(patch.meta as Record<string, unknown>, 'meta', errors);
  }

  if (patch.content && isPlainObject(patch.content)) {
    validateContent(patch.content as Record<string, unknown>, 'content', lookup, errors);
  }

  const mechanics = patch.mechanics;
  if (mechanics && isPlainObject(mechanics)) {
    const prog = (mechanics as Record<string, unknown>).progression;
    if (prog && isPlainObject(prog)) {
      const mc = (prog as Record<string, unknown>).multiclassing;
      if (mc && isPlainObject(mc)) {
        const mcDefault = (mc as Record<string, unknown>).default;
        if (mcDefault && isPlainObject(mcDefault)) {
          validateMulticlassingDefault(
            mcDefault as Record<string, unknown>,
            'mechanics.progression.multiclassing.default',
            system,
            lookup,
            errors,
          );
        }
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
