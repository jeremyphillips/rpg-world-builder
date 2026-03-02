import { CampaignContentPatch } from '../models/CampaignContentPatch.model';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const VALID_CONTENT_TYPE_KEYS = new Set([
  'races',
  'equipment',
  'weapons',
  'armor',
  'gear',
  'magicItems',
  'spells',
  'monsters',
  'npcs',
  'locations',
  'classes',
]);

export type ValidationError = {
  path: string;
  message: string;
  code: string;
};

type ContentPatchMap = Record<string, Record<string, unknown>>;

export interface CampaignContentPatchDoc {
  campaignId: string;
  patches: ContentPatchMap;
  updatedAt?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validatePatchesPayload(
  patches: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isPlainObject(patches)) {
    errors.push({
      path: 'patches',
      code: 'INVALID_TYPE',
      message: 'patches must be a plain object',
    });
    return errors;
  }

  for (const [typeKey, entries] of Object.entries(patches)) {
    if (!VALID_CONTENT_TYPE_KEYS.has(typeKey)) {
      errors.push({
        path: `patches.${typeKey}`,
        code: 'INVALID_ID',
        message: `Unknown content type key "${typeKey}"`,
      });
      continue;
    }

    if (!isPlainObject(entries)) {
      errors.push({
        path: `patches.${typeKey}`,
        code: 'INVALID_TYPE',
        message: `patches.${typeKey} must be a plain object keyed by entry id`,
      });
      continue;
    }

    for (const [entryId, entryPatch] of Object.entries(entries as Record<string, unknown>)) {
      if (!isPlainObject(entryPatch)) {
        errors.push({
          path: `patches.${typeKey}.${entryId}`,
          code: 'INVALID_TYPE',
          message: 'Each entry patch must be a plain object',
        });
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getPatchByCampaignId(
  campaignId: string,
): Promise<CampaignContentPatchDoc | null> {
  const doc = await CampaignContentPatch.findOne({ campaignId }).lean();
  if (!doc) return null;
  return {
    campaignId: doc.campaignId as string,
    patches: (doc.patches as ContentPatchMap) ?? {},
    createdAt: (doc as Record<string, unknown>).createdAt as string | undefined,
    updatedAt: (doc as Record<string, unknown>).updatedAt as string | undefined,
  };
}

export async function upsertPatch(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ patch: CampaignContentPatchDoc } | { errors: ValidationError[] }> {
  const patches = body.patches ?? body;

  const errors = validatePatchesPayload(patches);
  if (errors.length > 0) {
    return { errors };
  }

  const doc = await CampaignContentPatch.findOneAndUpdate(
    { campaignId },
    { $set: { campaignId, patches } },
    { upsert: true, new: true, lean: true },
  );

  return {
    patch: {
      campaignId: doc!.campaignId as string,
      patches: (doc!.patches as ContentPatchMap) ?? {},
      createdAt: (doc as Record<string, unknown>)?.createdAt as string | undefined,
      updatedAt: (doc as Record<string, unknown>)?.updatedAt as string | undefined,
    },
  };
}
