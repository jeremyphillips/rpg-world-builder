import { flattenSpellEffects } from '../spellEffectGroups';
import type { SpellBase, SpellResolutionStatus } from './spell.types';

export function getSpellResolutionStatus(spell: SpellBase): SpellResolutionStatus {
  const effects = flattenSpellEffects(spell);
  const hasStructured = effects.some((e) => e.kind !== 'note');
  if (!hasStructured) return 'stub';

  const hasUnderModeled = effects.some(
    (e) => e.kind === 'note' && e.category === 'under-modeled',
  );
  const hasCaveats = (spell.resolution?.caveats?.length ?? 0) > 0;
  if (hasUnderModeled || hasCaveats) return 'partial';

  return 'full';
}
