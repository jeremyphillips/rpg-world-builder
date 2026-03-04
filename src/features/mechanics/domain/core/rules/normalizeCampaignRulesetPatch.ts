/**
 * Normalize a CampaignRulesetPatch before persistence.
 *
 * - Strips `undefined` values and empty objects recursively.
 * - Cleans multiclass requirement expressions (trims abilities,
 *   removes invalid entries, prunes empty groups).
 * - Removes empty map containers so they don't create noise in the DB.
 * - Returns a new object; never mutates the input.
 */
import type { CampaignRulesetPatch } from './ruleset.types';
import type {
  ClassEntryRequirement,
  AbilityRequirementGroup,
  ClassId,
} from '@/shared/types/ruleset';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Recursively strip `undefined` values and prune objects that become empty
 * after stripping.  Arrays are kept as-is at this stage (domain-specific
 * cleanup handles them separately).
 */
function stripUndefinedDeep(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  let hasKeys = false;

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    if (isPlainObject(value)) {
      const cleaned = stripUndefinedDeep(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
        hasKeys = true;
      }
    } else if (Array.isArray(value)) {
      const filtered = value.filter(v => v !== undefined);
      if (filtered.length > 0) {
        result[key] = filtered;
        hasKeys = true;
      }
    } else {
      result[key] = value;
      hasKeys = true;
    }
  }

  return hasKeys ? result : undefined;
}

// ---------------------------------------------------------------------------
// Requirement expression normalization
// ---------------------------------------------------------------------------

function normalizeRequirementGroup(
  group: Record<string, unknown>,
): AbilityRequirementGroup | undefined {
  const rawAll = group.all;
  if (!Array.isArray(rawAll)) return undefined;

  const cleaned = rawAll
    .filter((item): item is Record<string, unknown> => isPlainObject(item))
    .map(item => ({
      ability: typeof item.ability === 'string' ? item.ability.trim() : '',
      min: typeof item.min === 'number' ? item.min : Number(item.min),
    }))
    .filter(item => item.ability.length > 0 && Number.isFinite(item.min));

  if (cleaned.length === 0) return undefined;
  return { all: cleaned };
}

function normalizeEntryRequirement(
  req: Record<string, unknown>,
): ClassEntryRequirement | undefined {
  const rawAnyOf = req.anyOf;
  if (!Array.isArray(rawAnyOf)) return undefined;

  const groups = rawAnyOf
    .filter((g): g is Record<string, unknown> => isPlainObject(g))
    .map(normalizeRequirementGroup)
    .filter((g): g is AbilityRequirementGroup => g !== undefined);

  if (groups.length === 0) return undefined;
  return { anyOf: groups };
}

function normalizeEntryRequirementsMap(
  map: Record<string, unknown>,
): Record<ClassId, ClassEntryRequirement> | undefined {
  const result: Record<ClassId, ClassEntryRequirement> = {};
  let hasKeys = false;

  for (const [classId, raw] of Object.entries(map)) {
    if (!isPlainObject(raw)) continue;
    const normalized = normalizeEntryRequirement(raw);
    if (normalized) {
      result[classId] = normalized;
      hasKeys = true;
    }
  }

  return hasKeys ? result : undefined;
}

// ---------------------------------------------------------------------------
// Multiclassing block normalization
// ---------------------------------------------------------------------------

function normalizeMulticlassingDefault(
  raw: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  let hasKeys = false;

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;

    if (key === 'entryRequirementsByTargetClass' && isPlainObject(value)) {
      const normalized = normalizeEntryRequirementsMap(value);
      if (normalized) {
        result[key] = normalized;
        hasKeys = true;
      }
      continue;
    }

    if (key === 'defaultEntryRequirement' && isPlainObject(value)) {
      const normalized = normalizeEntryRequirement(value);
      if (normalized) {
        result[key] = normalized;
        hasKeys = true;
      }
      continue;
    }

    result[key] = value;
    hasKeys = true;
  }

  return hasKeys ? result : undefined;
}

// ---------------------------------------------------------------------------
// Content normalization
// ---------------------------------------------------------------------------

const VALID_CONTENT_POLICIES = new Set(['all_except', 'only']);

function normalizeContentRule(
  raw: Record<string, unknown>,
): { policy: string; ids: string[] } | undefined {
  const policy = raw.policy;
  if (typeof policy !== 'string' || !VALID_CONTENT_POLICIES.has(policy)) return undefined;

  const ids = Array.isArray(raw.ids)
    ? [...new Set(
        (raw.ids as unknown[])
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      )]
    : [];

  if (policy === 'all_except' && ids.length === 0) return undefined;

  return { policy, ids };
}

function normalizeContent(
  content: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  let hasKeys = false;

  for (const [key, value] of Object.entries(content)) {
    if (value === undefined || !isPlainObject(value)) continue;
    const normalized = normalizeContentRule(value);
    if (normalized) {
      result[key] = normalized;
      hasKeys = true;
    }
  }

  return hasKeys ? result : undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function normalizeCampaignRulesetPatch(
  patch: CampaignRulesetPatch,
): CampaignRulesetPatch {
  const { _id, campaignId, systemId, meta, content, mechanics } = patch;

  const normalizedMeta = meta && isPlainObject(meta)
    ? stripUndefinedDeep(meta as Record<string, unknown>)
    : undefined;

  const normalizedContent = content && isPlainObject(content)
    ? normalizeContent(content as Record<string, unknown>)
    : undefined;

  let normalizedMechanics: Record<string, unknown> | undefined;
  if (mechanics && isPlainObject(mechanics)) {
    const mech = mechanics as Record<string, unknown>;
    const prog = mech.progression;

    if (isPlainObject(prog)) {
      const mc = (prog as Record<string, unknown>).multiclassing;

      if (isPlainObject(mc)) {
        const mcObj = mc as Record<string, unknown>;
        const mcDefault = mcObj.default;

        const normalizedDefault = isPlainObject(mcDefault)
          ? normalizeMulticlassingDefault(mcDefault as Record<string, unknown>)
          : undefined;

        const normalizedMc = stripUndefinedDeep({
          ...mcObj,
          default: normalizedDefault,
        });

        const normalizedProg = stripUndefinedDeep({
          ...(prog as Record<string, unknown>),
          multiclassing: normalizedMc,
        });

        normalizedMechanics = stripUndefinedDeep({
          ...mech,
          progression: normalizedProg,
        });
      } else {
        normalizedMechanics = stripUndefinedDeep(mech);
      }
    } else {
      normalizedMechanics = stripUndefinedDeep(mech);
    }
  }

  const result: Record<string, unknown> = { _id, campaignId, systemId };

  if (normalizedMeta) result.meta = normalizedMeta;
  if (normalizedContent) result.content = normalizedContent;
  if (normalizedMechanics) result.mechanics = normalizedMechanics;

  return result as CampaignRulesetPatch;
}
