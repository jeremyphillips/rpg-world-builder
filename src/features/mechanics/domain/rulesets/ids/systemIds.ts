import type { SystemRulesetId } from '../types/ruleset.types';

export const SYSTEM_RULESET_IDS = ['SRD_CC_v5_2_1'] as const;

export const DEFAULT_SYSTEM_RULESET_ID: SystemRulesetId = 'SRD_CC_v5_2_1';

export function isSystemRulesetId(value: string): value is SystemRulesetId {
  return (SYSTEM_RULESET_IDS as readonly string[]).includes(value);
}

export function assertSystemRulesetId(value: string): asserts value is SystemRulesetId {
  if (!isSystemRulesetId(value)) {
    throw new Error(`[ruleset] Invalid system ruleset id: ${value}`);
  }
}
