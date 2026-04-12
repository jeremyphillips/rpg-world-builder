import type { Effect } from '@/features/mechanics/domain/effects/effects.types';
import type { AreaOfEffectTemplate } from '@/features/mechanics/domain/effects/area.types';
import type { SpellRange } from '@/features/content/spells/domain/types/spell.types';
import { formatSpellRange } from './spellRangeFormat';

export { formatSpellRange } from './spellRangeFormat';

function isTargetingWithArea(e: Effect): e is Effect & { kind: 'targeting'; area: AreaOfEffectTemplate } {
  return e.kind === 'targeting' && 'area' in e && e.area != null;
}

/**
 * Human-readable Range/Area line for spell detail (e.g. `150 ft. (20 ft, sphere)` for Fireball).
 * Uses `spell.range` plus the first targeting effect that declares an `area`.
 */
export function formatSpellRangeAreaDisplay(spell: { range: SpellRange; effects: Effect[] }): string {
  const rangePart = formatSpellRange(spell.range);
  const targeting = spell.effects.find(isTargetingWithArea);
  if (targeting?.area) {
    const a = targeting.area;
    return `${rangePart} (${a.size} ft, ${a.kind})`;
  }
  return rangePart || '—';
}
