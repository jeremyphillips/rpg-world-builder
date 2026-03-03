/**
 * Canonical Magic Item content types.
 *
 * Extends the generic ContentItem interfaces with magic-item-specific fields.
 * content-system metadata (source, accessPolicy, patched).
 *
 */
import type { Money } from '@/shared/money/types';
import type { Weight } from '@/shared/weight/types';
import type { Visibility } from '@/shared/types';
import type { ContentItem, ContentSummary, ContentInput } from './content.types';
import type { EquipmentBase } from './equipment.types';
import type { MagicItemSlot, MagicItemRarity } from '../vocab/magicItems.vocab';

export type { MagicItemSlot, MagicItemRarity };

export type MagicItemEffect =
  | { kind: 'bonus'; target: string; value: number }
  | { kind: 'modifier'; target: string; mode: 'add' | 'mul' | 'set'; value: unknown }
  | { kind: 'note'; text: string };

/**
 * Fields-only shape (system + campaign share this).
 * Content metadata (source/systemId/campaignId/patched/accessPolicy) lives in ContentItem.
 */
export interface MagicItemFields extends EquipmentBase {
  cost?: Money;
  weight?: Weight;

  slot: MagicItemSlot;

  // “derived”/composition
  baseItemId?: string;

  consumable?: boolean;

  rarity?: MagicItemRarity;
  requiresAttunement?: boolean;

  bonus?: number;
  charges?: number;

  effects?: MagicItemEffect[];
}

/** Canonical magic item content item */
export type MagicItem = ContentItem & MagicItemFields;

export type MagicItemSummary = ContentSummary & {
  slot: MagicItemSlot;
  costCp: number;
  rarity?: MagicItemRarity;
  requiresAttunement: boolean;
};

export type MagicItemInput = ContentInput & Partial<MagicItemFields>;