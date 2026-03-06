export type ContentTypeKey =
  | 'races'
  | 'equipment'
  | 'weapons'
  | 'armor'
  | 'gear'
  | 'magicItems'
  | 'spells'
  | 'monsters'
  | 'npcs'
  | 'locations'
  | 'classes'
  | 'skillProficiencies';

export type ContentPatchMap = Partial<Record<ContentTypeKey, Record<string, unknown>>>;

export interface CampaignContentPatch {
  campaignId: string;
  patches: ContentPatchMap;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * A partial overlay for a content entry.
 * `__delete__` is reserved for future hide/disable behavior.
 */
export type EntryPatch<T> = Partial<T> & { __delete__?: boolean };
