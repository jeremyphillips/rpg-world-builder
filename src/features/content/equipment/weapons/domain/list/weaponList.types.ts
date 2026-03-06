import type { WeaponSummary } from '@/features/content/domain/types';

/** Weapon list row includes allowedInCampaign from controller. */
export type WeaponListRow = WeaponSummary & { allowedInCampaign?: boolean };
