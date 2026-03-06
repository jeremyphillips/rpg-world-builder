import type { GearSummary } from '@/features/content/shared/domain/types';

/** Gear list row includes allowedInCampaign from controller. */
export type GearListRow = GearSummary & { allowedInCampaign?: boolean };
