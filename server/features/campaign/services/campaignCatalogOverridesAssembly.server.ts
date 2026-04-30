/**
 * Builds Partial<CampaignCatalog> from campaign DB content (server-side).
 * Used by GET /api/campaigns/:id/catalog-overrides and resolveCampaignCatalogForCampaign.
 */
import type { CampaignCatalog } from '@/features/mechanics/domain/rulesets/system/catalog';
import type { Ruleset } from '@/shared/types/ruleset';
import { buildCampaignCatalog } from '@/features/mechanics/domain/rulesets/campaign/buildCatalog';
import { systemCatalog } from '@/features/mechanics/domain/rulesets/system/catalog';
import type { Race } from '@/features/content/races/domain/types';
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { SkillProficiency } from '@/features/content/skillProficiencies/domain/types';
import type { Visibility } from '@/shared/types/visibility';
import { normalizeAuthoredCreatureProficienciesForRead } from '@/shared/domain/proficiency/authoredCreatureProficiencies';
import * as racesService from '../../content/races/services/races.service';
import * as classesService from '../../content/classes/services/classes.service';
import * as equipmentService from '../../content/equipment/services/equipment.service';
import * as monstersService from '../../content/monsters/services/monsters.service';
import * as skillProficienciesService from '../../content/skillProficiencies/services/skillProficiencies.service';
import {
  campaignSpellDocToSpell,
  listRawSpellDocsByCampaign,
  sanitizeSpellClasses,
} from '../../content/spells/services/campaignSpellDocs.server';

function keyById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const item of items) map[item.id] = item;
  return map;
}

function campaignRaceDocToRace(doc: racesService.CampaignRaceDoc): Race {
  return {
    id: doc.raceId,
    name: doc.name,
    description: doc.description,
    imageKey: doc.imageKey || null,
    source: 'campaign',
    campaignId: doc.campaignId,
    accessPolicy: doc.accessPolicy,
  };
}

const DEFAULT_REQUIREMENTS = { allowedRaces: 'all' as const, allowedAlignments: 'any' as const };
const DEFAULT_PROFICIENCIES = {
  skills: { type: 'choice' as const, choose: 2, level: 1 },
  weapons: { type: 'fixed' as const, level: 1, categories: ['simple', 'martial'] },
  armor: { type: 'fixed' as const, level: 1, categories: ['light', 'medium'] },
};
const DEFAULT_PROGRESSION = {
  hitDie: 8,
  attackProgression: 'good' as const,
  savingThrows: ['str', 'dex'],
  spellcasting: 'none' as const,
  asiLevels: [4, 8, 12, 16, 19],
  features: [] as { id: string; level: number; name: string }[],
};
const DEFAULT_GENERATION = { primaryAbilities: ['str', 'dex'] as const };

function campaignClassDocToCharacterClass(
  dto: classesService.CampaignClassDoc,
): CharacterClass & { source: 'campaign'; campaignId: string; accessPolicy?: Visibility } {
  const d = dto.data ?? {};
  return {
    id: dto.classId,
    name: dto.name,
    description: dto.description,
    imageKey: dto.imageKey || null,
    source: 'campaign',
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
    generation: (d.generation as CharacterClass['generation']) ?? DEFAULT_GENERATION,
    proficiencies: (d.proficiencies as CharacterClass['proficiencies']) ?? DEFAULT_PROFICIENCIES,
    progression: (d.progression as CharacterClass['progression']) ?? DEFAULT_PROGRESSION,
    definitions: d.definitions as CharacterClass['definitions'],
    requirements: (d.requirements as CharacterClass['requirements']) ?? DEFAULT_REQUIREMENTS,
  };
}

function equipmentDocToCatalogShape(
  doc: equipmentService.CampaignEquipmentDoc,
): Record<string, unknown> & { id: string } {
  return {
    id: doc.itemId,
    name: doc.name,
    description: doc.description,
    imageKey: doc.imageKey,
    source: 'campaign',
    campaignId: doc.campaignId,
    accessPolicy: doc.accessPolicy,
    ...(doc.data ?? {}),
  } as Record<string, unknown> & { id: string };
}

function campaignMonsterDocToMonster(doc: monstersService.CampaignMonsterDoc) {
  const data = { ...(doc.data ?? {}) };
  const mechanics = data.mechanics;
  if (mechanics && typeof mechanics === 'object' && !Array.isArray(mechanics)) {
    const m = mechanics as Record<string, unknown>;
    if (m.proficiencies !== undefined) {
      const normalized = normalizeAuthoredCreatureProficienciesForRead(m.proficiencies);
      data.mechanics = { ...m, proficiencies: normalized ?? m.proficiencies };
    }
  }
  return {
    id: doc.monsterId,
    name: doc.name,
    ...data,
    source: 'campaign',
    campaignId: doc.campaignId,
    accessPolicy: doc.accessPolicy,
  };
}

function campaignSkillDocToSkill(doc: skillProficienciesService.CampaignSkillProficiencyDoc): SkillProficiency {
  return {
    id: doc.skillProficiencyId,
    name: doc.name,
    description: doc.description,
    imageKey: doc.imageKey || null,
    ability: doc.ability as SkillProficiency['ability'],
    suggestedClasses: doc.suggestedClasses ?? [],
    examples: doc.examples ?? [],
    tags: doc.tags ?? [],
    source: 'campaign',
    campaignId: doc.campaignId,
    accessPolicy: doc.accessPolicy,
  } as SkillProficiency;
}

/**
 * Loads all campaign-owned catalog rows and returns the merge payload for buildCampaignCatalog.
 */
export async function assembleCampaignCatalogOverrides(
  campaignId: string,
  ruleset: Ruleset,
): Promise<Partial<CampaignCatalog>> {
  const [
    raceDocs,
    classDocs,
    weaponDocs,
    armorDocs,
    gearDocs,
    magicItemDocs,
    monsterDocs,
    skillDocs,
    spellDocs,
  ] = await Promise.all([
    racesService.listByCampaign(campaignId).catch(() => [] as racesService.CampaignRaceDoc[]),
    classesService.listByCampaign(campaignId).catch(() => [] as classesService.CampaignClassDoc[]),
    equipmentService.listByCampaign(campaignId, 'weapon').catch(() => [] as equipmentService.CampaignEquipmentDoc[]),
    equipmentService.listByCampaign(campaignId, 'armor').catch(() => [] as equipmentService.CampaignEquipmentDoc[]),
    equipmentService.listByCampaign(campaignId, 'gear').catch(() => [] as equipmentService.CampaignEquipmentDoc[]),
    equipmentService.listByCampaign(campaignId, 'magicItem').catch(() => [] as equipmentService.CampaignEquipmentDoc[]),
    monstersService.listByCampaign(campaignId).catch(() => [] as monstersService.CampaignMonsterDoc[]),
    skillProficienciesService.listByCampaign(campaignId).catch(() => [] as skillProficienciesService.CampaignSkillProficiencyDoc[]),
    listRawSpellDocsByCampaign(campaignId).catch(() => []),
  ]);

  const races = raceDocs.map(campaignRaceDocToRace);
  const classes = classDocs.map(campaignClassDocToCharacterClass);
  const weapons = weaponDocs.map(equipmentDocToCatalogShape);
  const armor = armorDocs.map(equipmentDocToCatalogShape);
  const gear = gearDocs.map(equipmentDocToCatalogShape);
  const magicItems = magicItemDocs.map(equipmentDocToCatalogShape);
  const monsters = monsterDocs.map(campaignMonsterDocToMonster);
  const skillProficiencies = skillDocs.map(campaignSkillDocToSkill);

  const partialWithoutSpells: Partial<CampaignCatalog> = {};
  if (races.length > 0) partialWithoutSpells.racesById = keyById(races);
  if (classes.length > 0) {
    partialWithoutSpells.classesById = keyById(classes) as CampaignCatalog['classesById'];
  }
  if (weapons.length > 0) {
    partialWithoutSpells.weaponsById = keyById(weapons) as unknown as CampaignCatalog['weaponsById'];
  }
  if (armor.length > 0) {
    partialWithoutSpells.armorById = keyById(armor) as unknown as CampaignCatalog['armorById'];
  }
  if (gear.length > 0) {
    partialWithoutSpells.gearById = keyById(gear) as unknown as CampaignCatalog['gearById'];
  }
  if (magicItems.length > 0) {
    partialWithoutSpells.magicItemsById = keyById(magicItems) as unknown as CampaignCatalog['magicItemsById'];
  }
  if (monsters.length > 0) {
    partialWithoutSpells.monstersById = keyById(monsters) as CampaignCatalog['monstersById'];
  }
  if (skillProficiencies.length > 0) {
    partialWithoutSpells.skillProficienciesById = keyById(skillProficiencies);
  }

  const tempCatalog = buildCampaignCatalog(systemCatalog, partialWithoutSpells, ruleset);
  const allowedClasses = tempCatalog.classesById as Record<string, unknown>;

  const spells = spellDocs.map((doc) => ({
    ...campaignSpellDocToSpell(doc),
    classes: sanitizeSpellClasses(doc.classes, allowedClasses),
  }));

  const result: Partial<CampaignCatalog> = { ...partialWithoutSpells };
  if (spells.length > 0) {
    result.spellsById = keyById(spells);
  }

  return result;
}
