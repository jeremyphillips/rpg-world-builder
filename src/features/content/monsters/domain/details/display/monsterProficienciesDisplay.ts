import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterProficiencies } from '@/features/content/monsters/domain/types/monster.types';
import type { AbilityId } from '@/features/mechanics/domain/character';
import { abilityIdToAbbrev } from '@/features/mechanics/domain/character';
import { getSkillProficiencyCatalogDisplayName } from '@/features/mechanics/domain/rulesets/system/skillProficiencies';

import { humanizeKebabCase } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatSkillLine(prof: MonsterProficiencies | undefined): string | undefined {
  const skills = prof?.skills;
  if (!skills || Object.keys(skills).length === 0) return undefined;

  const parts = Object.entries(skills).map(([id, adj]) => {
    const name = getSkillProficiencyCatalogDisplayName(id) ?? id;
    if (adj.proficiencyLevel === 2) return `${name} (expertise)`;
    return name;
  });

  return parts.join(', ');
}

function formatSavingThrowsLine(monster: Monster): string | undefined {
  const st = monster.mechanics.savingThrows;
  if (!st || Object.keys(st).length === 0) return undefined;

  const parts = Object.entries(st).map(([abilityId, adj]) => {
    const abbr = abilityIdToAbbrev(abilityId as AbilityId);
    if (adj.proficiencyLevel === 2) return `${abbr} (expertise)`;
    if (adj.proficiencyLevel === 1) return `${abbr}`;
    return abbr;
  });

  return parts.join(', ');
}

function formatWeaponProficienciesLine(monster: Monster): string | undefined {
  const weapons = monster.mechanics.proficiencies?.weapons;
  if (!weapons || Object.keys(weapons).length === 0) return undefined;

  const pb = monster.mechanics.proficiencyBonus;
  return Object.keys(weapons)
    .map((id) => `${humanizeKebabCase(id)} (PB +${pb})`)
    .join(', ');
}

export type MonsterProficienciesSummaryParts = {
  /** Comma-separated skill labels (no "Skills:" prefix). */
  skills?: string;
  /** Comma-separated save abbreviations (no "Saves:" prefix). */
  saves?: string;
  /** Comma-separated weapon proficiency labels (no "Weapons:" prefix). */
  weapons?: string;
};

/**
 * Parsed lines for UI with structured labels (e.g. bold category names).
 */
export function getMonsterProficienciesSummaryParts(monster: Monster): MonsterProficienciesSummaryParts {
  const prof = monster.mechanics.proficiencies;

  const parts: MonsterProficienciesSummaryParts = {};

  const skills = formatSkillLine(prof);
  if (skills) parts.skills = skills;

  const saves = formatSavingThrowsLine(monster);
  if (saves) parts.saves = saves;

  const wpn = formatWeaponProficienciesLine(monster);
  if (wpn) parts.weapons = wpn;

  return parts;
}

/**
 * Plain-text summary (one line per category) for non-React consumers.
 */
export function formatMonsterProficienciesSummary(monster: Monster): string {
  const { skills, saves, weapons } = getMonsterProficienciesSummaryParts(monster);
  const lines: string[] = [];
  if (skills) lines.push(`Skills: ${skills}`);
  if (saves) lines.push(`Saves: ${saves}`);
  if (weapons) lines.push(`Weapons: ${weapons}`);
  return lines.length > 0 ? lines.join('\n') : '—';
}
