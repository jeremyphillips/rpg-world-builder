/**
 * Loads campaign-owned content for all catalog categories.
 *
 * Fetches in parallel and builds Partial<CampaignCatalog> for merge with
 * system catalog in buildCampaignCatalog.
 */
import type { CampaignCatalog } from './systemCatalog';
import { listCampaignRaces } from '@/features/content/races/domain/repo/raceRepo';
import { listCampaignClasses } from '@/features/content/classes/domain/repo/classRepo';
import { listCampaignSpells } from '@/features/content/spells/domain/repo/spellRepo';
import {
  campaignWeaponRepo,
  campaignArmorRepo,
  campaignGearRepo,
  campaignMagicItemRepo,
  type CampaignEquipmentEntry,
} from '@/features/content/equipment/shared/domain/campaignEquipmentApi';
import { enchantmentRepo } from '@/features/content/shared/domain/repo/enchantmentRepo';
import type { EnchantmentTemplate } from '@/features/content/shared/domain/types';

function keyById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const item of items) map[item.id] = item;
  return map;
}

/** Transform campaign equipment entry to catalog-compatible shape (id + spread data). */
function equipmentEntryToCatalogShape(
  entry: CampaignEquipmentEntry,
): Record<string, unknown> & { id: string } {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    imageKey: entry.imageKey,
    source: 'campaign',
    campaignId: entry.campaignId,
    accessPolicy: entry.accessPolicy,
    ...(entry.data ?? {}),
  } as Record<string, unknown> & { id: string };
}

/** Transform campaign enchantment entry to catalog-compatible shape. */
function enchantmentEntryToCatalogShape(
  entry: { id: string; name: string; description?: string; campaignId: string; data?: Partial<EnchantmentTemplate> },
): Record<string, unknown> & { id: string } {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    source: 'campaign',
    campaignId: entry.campaignId,
    ...(entry.data ?? {}),
  } as Record<string, unknown> & { id: string };
}

/**
 * Loads campaign content overrides for all catalog categories.
 * Returns Partial<CampaignCatalog> suitable for buildCampaignCatalog.
 */
export async function loadCampaignCatalogOverrides(
  campaignId: string,
): Promise<Partial<CampaignCatalog>> {
  const [
    races,
    classes,
    weapons,
    armor,
    gear,
    magicItems,
    enhancements,
    spells,
  ] = await Promise.all([
    listCampaignRaces(campaignId).catch(() => []),
    listCampaignClasses(campaignId).catch(() => []),
    campaignWeaponRepo.list(campaignId).catch(() => []),
    campaignArmorRepo.list(campaignId).catch(() => []),
    campaignGearRepo.list(campaignId).catch(() => []),
    campaignMagicItemRepo.list(campaignId).catch(() => []),
    enchantmentRepo.listCampaign(campaignId).catch(() => []),
    listCampaignSpells(campaignId).catch(() => []),
  ]);

  const result: Partial<CampaignCatalog> = {};

  if (races.length > 0) {
    result.racesById = keyById(races);
  }
  if (classes.length > 0) {
    result.classesById = keyById(classes) as CampaignCatalog['classesById'];
  }
  if (weapons.length > 0) {
    result.weaponsById = keyById(
      weapons.map(equipmentEntryToCatalogShape),
    ) as CampaignCatalog['weaponsById'];
  }
  if (armor.length > 0) {
    result.armorById = keyById(
      armor.map(equipmentEntryToCatalogShape),
    ) as CampaignCatalog['armorById'];
  }
  if (gear.length > 0) {
    result.gearById = keyById(
      gear.map(equipmentEntryToCatalogShape),
    ) as CampaignCatalog['gearById'];
  }
  if (magicItems.length > 0) {
    result.magicItemsById = keyById(
      magicItems.map(equipmentEntryToCatalogShape),
    ) as CampaignCatalog['magicItemsById'];
  }
  if (enhancements.length > 0) {
    result.enhancementsById = keyById(
      enhancements.map(enchantmentEntryToCatalogShape),
    ) as CampaignCatalog['enhancementsById'];
  }
  if (spells.length > 0) {
    result.spellsById = keyById(spells);
  }
  // No campaign monsters support yet; omit monstersById

  return result;
}
