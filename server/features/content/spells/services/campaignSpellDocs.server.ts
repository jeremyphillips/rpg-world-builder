import { CampaignSpell } from '../../../../shared/models/CampaignSpell.model';
import type { AccessPolicy } from '../../../../../shared/domain/accessPolicy';
import type {
  Spell,
  SpellCastingTime,
  SpellComponents,
  SpellDuration,
  SpellRange,
} from '../../../../../src/features/content/spells/domain/types/spell.types';
import { normalizeRawCampaignSpellToCanonical } from './campaignSpell.normalize';

export type CampaignSpellDoc = {
  _id: string;
  campaignId: string;
  spellId: string;
  name: string;
  description: { full: string; summary: string };
  imageKey: string;
  school: string;
  level: number;
  classes: string[];
  castingTime: SpellCastingTime;
  range: SpellRange;
  duration: SpellDuration;
  components: SpellComponents;
  effectGroups: unknown[];
  accessPolicy?: AccessPolicy;
  scaling?: unknown;
  resolution?: unknown;
  deliveryMethod?: string;
  createdAt: string;
  updatedAt: string;
};

export function toApiSpellDoc(doc: Record<string, unknown>): CampaignSpellDoc {
  const canonical = normalizeRawCampaignSpellToCanonical(doc);
  return {
    _id: String(doc._id),
    campaignId: String(doc.campaignId),
    spellId: String(doc.spellId),
    ...canonical,
    accessPolicy: doc.accessPolicy as AccessPolicy | undefined,
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

/** Keeps only class ids present in the campaign-allowed class catalog (buildCampaignCatalog). */
export function sanitizeSpellClasses(
  classIds: string[],
  classesById: Record<string, unknown>,
): string[] {
  return classIds.filter((id) => id in classesById);
}

/** DB rows for catalog assembly — no `resolveCampaignCatalogForCampaign` (avoids circular imports). */
export async function listRawSpellDocsByCampaign(campaignId: string): Promise<CampaignSpellDoc[]> {
  const docs = await CampaignSpell.find({ campaignId }).sort({ name: 1 }).lean();
  return docs.map((d) => toApiSpellDoc(d as Record<string, unknown>));
}

export function campaignSpellDocToSpell(d: CampaignSpellDoc): Spell {
  return {
    id: d.spellId,
    name: d.name,
    description: d.description,
    imageKey: d.imageKey || undefined,
    school: d.school as Spell['school'],
    level: d.level,
    classes: d.classes ?? [],
    castingTime: d.castingTime,
    range: d.range,
    duration: d.duration,
    components: d.components,
    scaling: d.scaling as Spell['scaling'],
    resolution: d.resolution as Spell['resolution'],
    deliveryMethod: d.deliveryMethod as Spell['deliveryMethod'],
    effectGroups: d.effectGroups as Spell['effectGroups'],
    source: 'campaign',
    campaignId: d.campaignId,
    accessPolicy: d.accessPolicy as Spell['accessPolicy'],
  };
}
