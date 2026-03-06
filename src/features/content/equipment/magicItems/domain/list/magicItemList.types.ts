import type { MagicItemSummary } from '@/features/content/shared/domain/types';

/** Magic item list row includes allowedInCampaign from controller. */
export type MagicItemListRow = MagicItemSummary & { allowedInCampaign?: boolean };
