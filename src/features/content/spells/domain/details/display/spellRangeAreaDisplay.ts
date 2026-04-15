import type { AreaOfEffectTemplate } from '@/features/mechanics/domain/effects/area.types';
import type {
  SpellEffectGroup,
  SpellEffectTargeting,
  SpellRange,
} from '@/features/content/spells/domain/types/spell.types';
import { findSpellTargetingWithArea } from '@/features/content/spells/domain/spellEffectGroups';
import { formatSpellRange } from './spellRangeDisplay';

export { formatSpellRange } from './spellRangeDisplay';

function targetingHasArea(t: SpellEffectTargeting): t is SpellEffectTargeting & { area: AreaOfEffectTemplate } {
  return t.area != null;
}

/**
 * Human-readable Range/Area line for spell detail (e.g. `150 ft. (20 ft, sphere)` for Fireball).
 * Uses `spell.range` plus the first effect-group targeting that declares an `area`.
 */
export function formatSpellRangeAreaDisplay(spell: { range: SpellRange; effectGroups: SpellEffectGroup[] }): string {
  const rangePart = formatSpellRange(spell.range);
  const targeting = findSpellTargetingWithArea(spell);
  if (targeting && targetingHasArea(targeting)) {
    const a = targeting.area;
    return `${rangePart} (${a.size} ft, ${a.kind})`;
  }
  return rangePart || '—';
}
