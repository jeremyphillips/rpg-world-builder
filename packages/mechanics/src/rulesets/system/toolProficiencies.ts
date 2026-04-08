/**
 * System tool proficiency grants from class definitions (factory defaults per ruleset).
 *
 * Campaign-owned custom classes merge at runtime; this module only reads {@link getSystemClass} entries.
 */
import type { SystemRulesetId } from '../types/ruleset.types';
import { getSystemClass } from './classes';

export type GrantedToolProficiencyId = string;

/**
 * Collects tool ids granted by **fixed** class tool proficiencies when the character's level in that class
 * meets the proficiency's `level` threshold (multiclass-safe).
 */
export function collectGrantedToolProficienciesFromClassLevels(
  classEntries: readonly { classId: string; level: number }[],
  systemId: SystemRulesetId,
): GrantedToolProficiencyId[] {
  const set = new Set<string>();
  for (const entry of classEntries) {
    if (!entry.classId) continue;
    const classDef = getSystemClass(systemId, entry.classId);
    const tools = classDef?.proficiencies?.tools;
    if (!tools || tools.type !== 'fixed' || !tools.items?.length) continue;
    if (entry.level < tools.level) continue;
    for (const id of tools.items) set.add(id);
  }
  return [...set];
}
