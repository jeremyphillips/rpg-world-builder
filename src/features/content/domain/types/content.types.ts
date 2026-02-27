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
  /** Who can see this entry. Missing = public. */
  accessPolicy?: Visibility;
}

/** Full content item with ownership metadata. */
export interface ContentItem extends ContentSummary {
  description: string;
  systemId?: string;
  campaignId?: string;
}

/** Shape for creating or editing a campaign-owned content item. */
export interface ContentInput {
  id?: ContentId;
  name: string;
  description: string;
  accessPolicy?: Visibility;
}
