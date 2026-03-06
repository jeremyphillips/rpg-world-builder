import type { MagicItemSummary } from '@/features/content/domain/types';

/** Magic item list row includes allowedInCampaign from controller. */
export type MagicItemListRow = MagicItemSummary & { allowedInCampaign?: boolean };
