/**
 * Shared form types for Magic Item Create/Edit routes.
 */
import type { ContentFormValues } from '@/features/content/domain/types';
import type { MagicItemSlot, MagicItemRarity } from '@/features/content/domain/vocab';

export type MagicItemFormValues = ContentFormValues & {
  slot: MagicItemSlot | '';
  rarity: MagicItemRarity | '';
  requiresAttunement: boolean;
  /** JSON string for effects array; maps to MagicItemInput.effects */
  effects: string;
};
