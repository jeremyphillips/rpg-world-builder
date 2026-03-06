import type { SkillProficiencySummary } from '@/features/content/shared/domain/types';

/** Skill proficiency list row includes allowedInCampaign from controller. */
export type SkillProficiencyListRow = SkillProficiencySummary & { allowedInCampaign?: boolean };
