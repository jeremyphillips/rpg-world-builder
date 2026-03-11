// ---------------------------------------------------------------------------
// SYSTEM PATCHING + CAMPAIGN-OWNED ENTRIES
// ---------------------------------------------------------------------------
// Resolution order:
// 1) Campaign-owned entry (full override — campaign wins on id collision)
// 2) System entry + campaign patch (merged via applyContentPatch)
// 3) Raw system entry
//
// Edit route patches system content; add route creates campaign-owned content.

/**
 * Weapon repository — merges system weapons + campaign custom weapons.
 *
 * System weapons come from the code-defined catalog (systemCatalog.weapons.ts).
 * Campaign weapons come from the DB via campaignEquipmentRepo.
 */
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { Weapon, WeaponSummary, WeaponInput, WeaponFields } from '@/features/content/equipment/weapons/domain/types';
import { getSystemWeapons, getSystemWeapon } from '@/features/mechanics/domain/core/rules/systemCatalog.weapons';
import { campaignWeaponRepo, type CampaignEquipmentEntry } from '@/features/content/equipment/shared/domain/campaignEquipmentApi';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
import { moneyToCp } from '@/shared/money';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';

function toSummary(weapon: Weapon): WeaponSummary {
  const base = {
    id: weapon.id,
    name: weapon.name,
    imageKey: weapon.imageKey,
    accessPolicy: weapon.accessPolicy,
    patched: weapon.patched,
    category: weapon.category,
    costCp: moneyToCp(weapon.cost),
    damage: weapon.damage?.default ?? '',
    damageType: weapon.damageType ?? '',
    properties: weapon.properties ?? [],
  };
  return weapon.source === 'system'
    ? { ...base, source: 'system' as const, systemId: weapon.systemId }
    : { ...base, source: 'campaign' as const, campaignId: weapon.campaignId };
}

function campaignEntryToWeapon(e: CampaignEquipmentEntry): Weapon {
  const d = (e.data ?? {}) as Partial<WeaponFields>;
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    imageKey: e.imageKey,
    source: 'campaign',
    campaignId: e.campaignId,
    accessPolicy: e.accessPolicy,
    cost: d.cost ?? { coin: 'gp', value: 0 },
    weight: d.weight,
    category: d.category ?? 'simple',
    mode: d.mode ?? 'melee',
    range: d.range,
    properties: d.properties ?? [],
    damage: (d.damage ?? { default: '—' }) as Weapon['damage'],
    damageType: (d.damageType ?? '') as Weapon['damageType'],
  };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export const weaponRepo: CampaignContentRepo<Weapon, WeaponSummary, WeaponInput> = {

  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<WeaponSummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemWeapons(systemId)),
      campaignWeaponRepo.list(campaignId),
      getContentPatch(campaignId),
    ]);

    const weaponPatches = contentPatch?.patches?.weapons ?? {};
    const campaignIds = new Set(campaign.map(c => c.id));

    const patchedSystem: Weapon[] = system
      .filter(w => !campaignIds.has(w.id))
      .map((w): Weapon => {
        const patch = weaponPatches[w.id];
        if (!patch) return w;
        const merged = applyContentPatch<Weapon>(w, patch as Partial<Weapon>);
        return { ...merged, patched: true };
      });

    const merged: Weapon[] = [
      ...patchedSystem,
      ...campaign.map(campaignEntryToWeapon),
    ];

    let results = merged.map(toSummary);

    if (opts?.search) {
      results = results.filter(r => matchesSearch(r.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: SystemRulesetId,
    id: string,
  ): Promise<Weapon | null> {
    const campaignEntry = await campaignWeaponRepo.get(campaignId, id);
    if (campaignEntry) return campaignEntryToWeapon(campaignEntry);

    const systemWeapon = getSystemWeapon(systemId, id) ?? null;
    if (!systemWeapon) return null;

    const contentPatch = await getContentPatch(campaignId);
    const weaponPatch = contentPatch?.patches?.weapons?.[id];
    if (!weaponPatch) return systemWeapon;

    const merged = applyContentPatch<Weapon>(systemWeapon, weaponPatch as Partial<Weapon>);
    return { ...merged, patched: true };
  },

  async createEntry(
    campaignId: string,
    input: WeaponInput,
  ): Promise<Weapon> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignWeaponRepo.create(campaignId, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToWeapon(result.entry);
  },

  async updateEntry(
    campaignId: string,
    id: string,
    input: WeaponInput,
  ): Promise<Weapon> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignWeaponRepo.update(campaignId, id, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToWeapon(result.entry);
  },

  async deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean> {
    return campaignWeaponRepo.remove(campaignId, id);
  },
};
