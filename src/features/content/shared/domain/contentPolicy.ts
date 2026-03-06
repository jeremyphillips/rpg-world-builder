import type { ContentPolicy, ContentRule } from '@/shared/types/ruleset'
import type { ContentSummary } from './types';

export function getAllowedSet(rule: ContentRule | undefined, allIds: string[]): Set<string> {
  if (!rule) return new Set(allIds);
  if (rule.policy === 'all_except') {
    const denied = new Set(rule.ids);
    return new Set(allIds.filter(id => !denied.has(id)));
  }
  return new Set(rule.ids);
}

export function buildItemsWithAllowed<T extends ContentSummary>(
  summaries: T[],
  rule: ContentRule | undefined,
): (T & { allowedInCampaign: boolean })[] {
  const allIds = summaries.map(s => s.id);
  const allowedSet = getAllowedSet(rule, allIds);
  return summaries.map(s => ({
    ...s,
    allowedInCampaign: allowedSet.has(s.id),
  }));
}

export function toggleAllowedIds(params: {
  policy: ContentPolicy;
  currentIds: string[];
  id: string;
  allowed: boolean;
}): string[] {
  const { policy, currentIds, id, allowed } = params;

  if (policy === 'all_except') {
    return allowed
      ? currentIds.filter(i => i !== id)
      : [...currentIds, id];
  }

  return allowed
    ? [...currentIds, id]
    : currentIds.filter(i => i !== id);
}
