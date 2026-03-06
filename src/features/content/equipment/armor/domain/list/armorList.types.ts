import type { ArmorSummary } from '@/features/content/shared/domain/types';

/** Armor list row includes allowedInCampaign from controller. */
export type ArmorListRow = ArmorSummary & { allowedInCampaign?: boolean };
