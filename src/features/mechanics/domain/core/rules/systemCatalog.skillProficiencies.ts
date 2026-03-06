/**
 * System skill proficiency catalog — code-defined skill entries per system ruleset.
 *
 * These are the "factory defaults" for skill proficiencies (SRD_CC_v5_2_1).
 */
import type { SkillProficiency, SkillProficiencyFields } from '@/features/content/shared/domain/types'
import type { SystemRulesetId } from './ruleset.types'
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds'
import { SKILL_PROFICIENCIES_RAW } from './skillProficiencies.data'

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function toSystemSkillProficiency(
  systemId: SystemRulesetId,
  raw: SkillProficiencyFields & { id: string; name: string },
): SkillProficiency {
  return {
    ...raw,
    source: 'system',
    systemId,
    patched: false,
  };
}

// ---------------------------------------------------------------------------
// 5e v1 system skill proficiencies (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const SYSTEM_SKILL_PROFICIENCIES_SRD_CC_V5_2_1: readonly SkillProficiency[] =
  SKILL_PROFICIENCIES_RAW.map((r) =>
    toSystemSkillProficiency(DEFAULT_SYSTEM_RULESET_ID, r as unknown as SkillProficiencyFields & { id: string; name: string }),
  );

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_SKILL_PROFICIENCIES_BY_SYSTEM_ID: Record<SystemRulesetId, readonly SkillProficiency[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_SKILL_PROFICIENCIES_SRD_CC_V5_2_1,
}

export function getSystemSkillProficiencies(systemId: SystemRulesetId): readonly SkillProficiency[] {
  return SYSTEM_SKILL_PROFICIENCIES_BY_SYSTEM_ID[systemId] ?? []
}

export function getSystemSkillProficiency(systemId: SystemRulesetId, id: string): SkillProficiency | undefined {
  return getSystemSkillProficiencies(systemId).find((s) => s.id === id)
}
