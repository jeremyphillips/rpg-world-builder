/**
 * Generic repository interface for campaign content.
 *
 * Every content category (races, classes, equipment, …) gets a concrete
 * implementation of CampaignContentRepo that merges system entries from
 * the code-defined catalog with campaign-owned entries from the DB.
 */
import type { ContentSummary, ContentItem } from '../types/content.types';

export type ContentType =
  | 'races'
  | 'classes'
  | 'equipment'
  | 'spells'
  | 'monsters'
  | 'locations';

export type ListOptions = {
  search?: string;
};

/**
 * Combined repository that merges system + campaign entries for a content
 * category. All read methods return unified domain objects with `source`
 * set to `'system'` or `'campaign'`.
 *
 * Write methods only operate on campaign-owned entries.
 */
export interface CampaignContentRepo<
  TEntry extends ContentItem,
  TSummary extends ContentSummary,
  TInput = Partial<TEntry>,
> {
  /** System + campaign summaries, combined and sorted by name. */
  listSummaries(
    campaignId: string,
    systemId: string,
    opts?: ListOptions,
  ): Promise<TSummary[]>;

  /** Lookup by id across both system and campaign entries. */
  getEntry(
    campaignId: string,
    systemId: string,
    id: string,
  ): Promise<TEntry | null>;

  /** Create a campaign-owned entry. */
  createEntry(
    campaignId: string,
    input: TInput,
  ): Promise<TEntry>;

  /** Update a campaign-owned entry. Throws if the entry is system-owned. */
  updateEntry(
    campaignId: string,
    id: string,
    patch: TInput,
  ): Promise<TEntry>;

  /** Delete a campaign-owned entry. Returns false if not found. */
  deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean>;
}
