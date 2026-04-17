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

function formatWeaponProficienciesLine(prof: MonsterProficiencies | undefined): string | undefined {
  const weapons = prof?.weapons;
  if (!weapons || Object.keys(weapons).length === 0) return undefined;

  return Object.keys(weapons)
    .map((id) => humanizeKebabCase(id))
    .join(', ');
}

/**
 * Readable summary of skills, saving throws, and weapon proficiencies from the stat block.
 */
export function formatMonsterProficienciesSummary(monster: Monster): string {
  const prof = monster.mechanics.proficiencies;
  const chunks: string[] = [];

  const skills = formatSkillLine(prof);
  if (skills) chunks.push(`Skills: ${skills}`);

  const saves = formatSavingThrowsLine(monster);
  if (saves) chunks.push(`Saves: ${saves}`);

  const wpn = formatWeaponProficienciesLine(prof);
  if (wpn) chunks.push(`Weapons: ${wpn}`);

  return chunks.length > 0 ? chunks.join(' · ') : '—';
}
