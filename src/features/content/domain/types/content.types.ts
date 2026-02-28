/**
 * Generic content type interfaces.
 *
 * Every content category (races, classes, equipment, spells, monsters,
 * locations) shares these base shapes. Category-specific types extend them.
 */
import type { Visibility } from '@/data/types';

export type ContentId = string;

export type ContentSource = 'system' | 'campaign';

/** Minimal shape for dropdowns, lists, and option pickers. */
export interface ContentSummary {
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

/** Full content item with ownership metadata. */
export interface ContentItem extends ContentSummary {
  imageKey?: string;
  description?: string;
  systemId?: string;
  campaignId?: string;
  /** True when a campaign content patch has been applied to a system entry. */
  patched?: boolean;
}

/** Shape for creating or editing a campaign-owned content item. */
export interface ContentInput {
  id?: ContentId;
  name: string;
  description: string;
  accessPolicy?: Visibility;
}
