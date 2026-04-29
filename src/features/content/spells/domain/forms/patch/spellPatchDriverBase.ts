import type { Spell, SpellEffectGroup } from '@/features/content/spells/domain/types';
import { spellEffectGroupsDomainToForm } from '../assembly/spellEffectRow.assembly';

/**
 * Patch driver `getValue` uses dot-path reads on the merged base + patch object. `Spell.effectGroups`
 * is stored in **domain** shape (`damage` on damage effects), while the spell form UI uses **draft**
 * fields (`damageFormat`, `damageDiceCount`, …) from `spellEffectGroupsDomainToForm`. Without this
 * normalization, system spell patch edit cannot resolve those paths (campaign RHF uses
 * `spellToFormValues`, which applies the same transform via `format`).
 */
export function buildSpellPatchDriverBase(spell: Spell): Record<string, unknown> {
  const raw = spell as unknown as Record<string, unknown>;
  return {
    ...raw,
    effectGroups: spellEffectGroupsDomainToForm(spell.effectGroups) as unknown,
  };
}

/** True when a persisted patch still stores domain-shaped damage rows (no draft keys). */
function effectGroupsPatchLooksDomainShaped(eg: unknown): boolean {
  if (!Array.isArray(eg) || eg.length === 0) return false;
  for (const g of eg) {
    const effects = (g as { effects?: unknown })?.effects;
    if (!Array.isArray(effects)) continue;
    for (const e of effects) {
      if (!e || typeof e !== 'object') continue;
      const row = e as Record<string, unknown>;
      if (row.kind === 'damage' && 'damage' in row && !('damageFormat' in row)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Normalize `initialPatch.effectGroups` so it matches the form row shape used in the patch driver
 * base. Leaves form-shaped or unrecognized structures unchanged.
 */
export function normalizeSpellPatchInitialPatch(
  initialPatch: Record<string, unknown>,
): Record<string, unknown> {
  const eg = initialPatch.effectGroups;
  if (eg === undefined) return initialPatch;
  if (!effectGroupsPatchLooksDomainShaped(eg)) return initialPatch;
  return {
    ...initialPatch,
    effectGroups: spellEffectGroupsDomainToForm(eg as SpellEffectGroup[]) as unknown,
  };
}
