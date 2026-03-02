/**
 * Generic content type interfaces.
 *
 * Every content category (races, classes, equipment, spells, monsters,
 * locations) shares these base shapes. Category-specific types extend them.
 */
import type { Visibility } from '@/shared/types';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';  

export type ContentSource = 'system' | 'campaign';

export type ContentId = string; // keep your existing alias

// /** Shape for creating or editing a campaign-owned content item. */
export interface ContentInput {
  id?: ContentId;
  name: string;
  description?: string;
  accessPolicy?: Visibility;
  imageKey?: string | null;
}

export interface ContentBase {
  id: ContentId;
  name: string;
  source: ContentSource;

  /** Storage key (or URL) for a thumbnail image. */
  imageKey?: string | null;

  /** Who can see this entry. Missing = public. */
  accessPolicy?: Visibility;

  /** True when a campaign content patch has been applied to a system entry. */
  patched?: boolean;
}

export type SystemContentMeta = {
  source: 'system';
  systemId: SystemRulesetId; // <-- use your real type
  campaignId?: never;
};

export type CampaignContentMeta = {
  source: 'campaign';
  campaignId: string;
  systemId?: never;
};

export type ContentMeta = SystemContentMeta | CampaignContentMeta;

/** Minimal shape for lists and option pickers. */
export type ContentSummary =
  | (ContentBase & SystemContentMeta)
  | (ContentBase & CampaignContentMeta);
  
export type ContentItem = ContentSummary;
