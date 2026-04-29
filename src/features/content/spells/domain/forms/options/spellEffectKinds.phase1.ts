/**
 * Spell form Phase 1: narrower than global `authorable` in effectKinds.vocab (hides `spawn` here).
 */
import type { EffectKind } from '@/features/content/shared/domain/vocab/effectKinds.vocab';
import { EFFECT_KIND_DEFINITIONS } from '@/features/content/shared/domain/vocab/effectKinds.vocab';

/** Fully supported + stubbed kinds visible in the spell effect-kind picker (excludes spawn). */
export const SPELL_EFFECT_PHASE1_KIND_IDS = [
  'damage',
  'condition',
  'move',
  'note',
  'resource',
  'grant',
  'immunity',
  'save',
  'check',
  'state',
] as const satisfies readonly EffectKind[];

export type SpellEffectPhase1Kind = (typeof SPELL_EFFECT_PHASE1_KIND_IDS)[number];

const PHASE1_ID_SET = new Set<string>(SPELL_EFFECT_PHASE1_KIND_IDS);

export function isSpellEffectPhase1Kind(id: string): id is SpellEffectPhase1Kind {
  return PHASE1_ID_SET.has(id);
}

export function getSpellEffectKindPhase1SelectOptions(): { value: string; label: string }[] {
  return EFFECT_KIND_DEFINITIONS.filter((d) => PHASE1_ID_SET.has(d.id)).map((d) => ({
    value: d.id,
    label: d.name,
  }));
}
