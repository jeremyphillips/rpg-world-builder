/**
 * Race repository — merges system races + campaign custom races.
 *
 * System races come from the code-defined catalog (systemCatalog.races.ts).
 * Campaign races come from the DB via campaignRaceRepo.ts.
 *
 * All returned objects carry `source: 'system' | 'campaign'`.
 */
import type { CampaignContentRepo, ListOptions } from './contentRepo.types';
import type { Race, RaceSummary, RaceInput } from '../types/race.types';
import { getSystemRaces, getSystemRace } from '@/features/mechanics/domain/core/rules/systemCatalog.races';
import {
  listCampaignRaces,
  getCampaignRace,
  createCampaignRace,
  updateCampaignRace,
  deleteCampaignRace,
} from '../campaignRaceRepo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSummary(race: Race): RaceSummary {
  return {
    id: race.id,
    name: race.name,
    source: race.source,
    campaigns: race.campaigns,
    accessPolicy: race.accessPolicy,
  };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const raceRepo: CampaignContentRepo<Race, RaceSummary, RaceInput> = {

  async listSummaries(
    campaignId: string,
    systemId: string,
    opts?: ListOptions,
  ): Promise<RaceSummary[]> {
    const system = getSystemRaces(systemId);
    const campaign = await listCampaignRaces(campaignId);

    const campaignIds = new Set(campaign.map(r => r.id));
    const merged: Race[] = [
      ...system.filter(r => !campaignIds.has(r.id)),
      ...campaign,
    ];

    let results = merged.map(toSummary);

    if (opts?.search) {
      results = results.filter(r => matchesSearch(r.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: string,
    id: string,
  ): Promise<Race | null> {
    const campaignRace = await getCampaignRace(campaignId, id);
    if (campaignRace) return campaignRace;

    return getSystemRace(systemId, id) ?? null;
  },

  async createEntry(
    campaignId: string,
    _systemId: string,
    input: RaceInput,
  ): Promise<Race> {
    const result = await createCampaignRace(campaignId, input);
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return result.race;
  },

  async updateEntry(
    campaignId: string,
    _systemId: string,
    id: string,
    patch: RaceInput,
  ): Promise<Race> {
    const result = await updateCampaignRace(campaignId, id, patch);
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return result.race;
  },

  async deleteEntry(
    campaignId: string,
    _systemId: string,
    id: string,
  ): Promise<boolean> {
    return deleteCampaignRace(campaignId, id);
  },
};
