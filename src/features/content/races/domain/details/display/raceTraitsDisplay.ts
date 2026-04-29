import type { Race } from '@/features/content/races/domain/types';
import type { RaceTraitGrant } from '@/features/content/races/domain/types/race-traits.types';

/** e.g. `1/day` from {@link RaceTraitGrant} `uses`. */
export function formatRaceTraitUsesLine(uses: RaceTraitGrant['uses']): string | undefined {
  if (!uses) return undefined;
  return `${uses.count}/${uses.period}`;
}

/**
 * One racial trait: title (optional uses in parentheses), then description, then notes.
 * Suitable for `whiteSpace: 'pre-line'` blocks.
 */
export function formatRaceTraitEntry(trait: RaceTraitGrant): string {
  const uses = formatRaceTraitUsesLine(trait.uses);
  const title = uses ? `${trait.name} (${uses})` : trait.name;
  const lines = [title, trait.description.trim()];
  if (trait.notes?.trim()) {
    lines.push(trait.notes.trim());
  }
  return lines.filter(Boolean).join('\n\n');
}

/** All traits in a grants slice, separated by a blank line between entries. */
export function formatRaceTraitGrantsSection(traits: readonly RaceTraitGrant[] | undefined): string {
  if (!traits?.length) return '';
  return traits.map((t) => formatRaceTraitEntry(t)).join('\n\n');
}

function hasAnyBaseTraits(race: Race): boolean {
  return (race.grants?.traits?.length ?? 0) > 0;
}

function hasAnyDefinitionTraits(race: Race): boolean {
  return (
    race.definitionGroups?.some((g) =>
      g.options.some((o) => (o.grants?.traits?.length ?? 0) > 0),
    ) ?? false
  );
}

/**
 * Base racial traits only (`race.grants.traits`).
 */
export function formatRaceBaseTraits(race: Race): string {
  return formatRaceTraitGrantsSection(race.grants?.traits);
}

/**
 * Traits authored on lineage / ancestry / ancestor options (each option block labeled).
 */
export function formatRaceDefinitionOptionTraits(race: Race): string {
  const groups = race.definitionGroups;
  if (!groups?.length) return '';

  const sections: string[] = [];
  for (const g of groups) {
    for (const opt of g.options) {
      const traits = opt.grants?.traits;
      if (!traits?.length) continue;
      const header = `${g.name}: ${opt.name}`;
      const body = formatRaceTraitGrantsSection(traits);
      sections.push([header, body].join('\n\n'));
    }
  }
  return sections.join('\n\n—\n\n');
}

export function hasRaceBaseTraits(race: Race): boolean {
  return hasAnyBaseTraits(race);
}

export function hasRaceDefinitionTraits(race: Race): boolean {
  return hasAnyDefinitionTraits(race);
}
