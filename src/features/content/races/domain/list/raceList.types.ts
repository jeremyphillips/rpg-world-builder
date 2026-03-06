import type { RaceSummary } from '@/features/content/domain/types';

/** Race list row includes allowedInCampaign from controller. */
export type RaceListRow = RaceSummary & { allowedInCampaign?: boolean };
