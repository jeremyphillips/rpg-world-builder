import { CampaignSpell } from '../../../../shared/models/CampaignSpell.model';
import { resolveCampaignCatalogForCampaign } from '../../../campaign/services/resolveCampaignCatalog.server';
import { validateSpellInputBody, type SpellValidationError } from './campaignSpell.validate';
import {
  type CampaignSpellDoc,
  sanitizeSpellClasses,
  toApiSpellDoc,
} from './campaignSpellDocs.server';

export type { CampaignSpellDoc } from './campaignSpellDocs.server';

function generateSpellId(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function listByCampaign(campaignId: string): Promise<CampaignSpellDoc[]> {
  const docs = await CampaignSpell.find({ campaignId }).sort({ name: 1 }).lean();
  const { catalog } = await resolveCampaignCatalogForCampaign(campaignId);
  const allowedClasses = catalog.classesById as Record<string, unknown>;
  return docs.map((d) => {
    const row = toApiSpellDoc(d as Record<string, unknown>);
    return {
      ...row,
      classes: sanitizeSpellClasses(row.classes, allowedClasses),
    };
  });
}

export async function getById(campaignId: string, spellId: string): Promise<CampaignSpellDoc | null> {
  const doc = await CampaignSpell.findOne({ campaignId, spellId }).lean();
  if (!doc) return null;
  const { catalog } = await resolveCampaignCatalogForCampaign(campaignId);
  const row = toApiSpellDoc(doc as Record<string, unknown>);
  return {
    ...row,
    classes: sanitizeSpellClasses(row.classes, catalog.classesById as Record<string, unknown>),
  };
}

function spellBodyToPersistence(
  body: Record<string, unknown>,
  options: { classesSanitized: string[] },
): Record<string, unknown> {
  const imageKey =
    body.imageKey === undefined || body.imageKey === null
      ? ''
      : String(body.imageKey).trim();
  const out: Record<string, unknown> = {
    name: (body.name as string).trim(),
    description: body.description,
    imageKey,
    school: body.school,
    level: Number(body.level),
    classes: options.classesSanitized,
    castingTime: body.castingTime,
    range: body.range,
    duration: body.duration,
    components: body.components,
    effectGroups: Array.isArray(body.effectGroups) ? body.effectGroups : [],
    accessPolicy: body.accessPolicy,
  };
  if (body.scaling !== undefined) out.scaling = body.scaling;
  if (body.resolution !== undefined) out.resolution = body.resolution;
  if (body.deliveryMethod !== undefined) out.deliveryMethod = body.deliveryMethod;
  return out;
}

export async function create(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<{ spell: CampaignSpellDoc } | { errors: SpellValidationError[] }> {
  const errors = validateSpellInputBody(body);
  if (errors.length > 0) return { errors };

  const { catalog } = await resolveCampaignCatalogForCampaign(campaignId);
  const allowedClasses = catalog.classesById as Record<string, unknown>;

  const name = (body.name as string).trim();
  const spellId = (body.spellId as string | undefined)?.trim() || generateSpellId(name);
  const classes = sanitizeSpellClasses(
    Array.isArray(body.classes) ? (body.classes as string[]) : [],
    allowedClasses,
  );

  const existing = await CampaignSpell.findOne({ campaignId, spellId }).lean();
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

  const persistence = spellBodyToPersistence(body, { classesSanitized: classes });

  const doc = await CampaignSpell.create({
    campaignId,
    spellId,
    ...persistence,
  });
  const spell = toApiSpellDoc(doc.toObject() as Record<string, unknown>);
  return { spell: { ...spell, classes: sanitizeSpellClasses(spell.classes, allowedClasses) } };
}

export async function update(
  campaignId: string,
  spellId: string,
  body: Record<string, unknown>,
): Promise<{ spell: CampaignSpellDoc } | { errors: SpellValidationError[] } | null> {
  const errors = validateSpellInputBody({ ...body, spellId });
  if (errors.length > 0) return { errors };

  const { catalog } = await resolveCampaignCatalogForCampaign(campaignId);
  const allowedClasses = catalog.classesById as Record<string, unknown>;

  const classes = sanitizeSpellClasses(
    Array.isArray(body.classes) ? (body.classes as string[]) : [],
    allowedClasses,
  );

  const persistence = spellBodyToPersistence(body, { classesSanitized: classes });

  const doc = await CampaignSpell.findOneAndUpdate(
    { campaignId, spellId },
    {
      $set: persistence,
      $unset: { ritual: '', concentration: '' },
    },
    { new: true, lean: true },
  );

  if (!doc) return null;
  const spell = toApiSpellDoc(doc as Record<string, unknown>);
  return {
    spell: { ...spell, classes: sanitizeSpellClasses(spell.classes, allowedClasses) },
  };
}

export async function remove(campaignId: string, spellId: string): Promise<boolean> {
  const result = await CampaignSpell.deleteOne({ campaignId, spellId });
  return result.deletedCount > 0;
}
