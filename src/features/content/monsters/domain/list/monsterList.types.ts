import type { MonsterSummary } from '@/features/content/monsters/domain/types';

/** Monster list row includes allowedInCampaign from controller. */
export type MonsterListRow = MonsterSummary & { allowedInCampaign?: boolean };
