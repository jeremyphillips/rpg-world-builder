import type { SpellBase, SpellEffect, SpellEffectTargeting } from './types/spell.types';

/** All non-targeting spell effects from every group, in order. */
export function flattenSpellEffects(spell: Pick<SpellBase, 'effectGroups'>): SpellEffect[] {
  const groups = spell.effectGroups ?? [];
  const out: SpellEffect[] = [];
  for (const g of groups) {
    out.push(...(g.effects ?? []));
  }
  return out;
}

/** First group's targeting (matches prior “first targeting row in flat list” behavior). */
export function getPrimarySpellTargeting(
  spell: Pick<SpellBase, 'effectGroups'>,
): SpellEffectTargeting | undefined {
  return spell.effectGroups?.[0]?.targeting;
}

/** Targeting on any group that declares an area (for range/area display line). */
export function findSpellTargetingWithArea(
  spell: Pick<SpellBase, 'effectGroups'>,
): SpellEffectTargeting | undefined {
  for (const g of spell.effectGroups ?? []) {
    const t = g.targeting;
    if (t?.area != null) return t;
  }
  return undefined;
}
