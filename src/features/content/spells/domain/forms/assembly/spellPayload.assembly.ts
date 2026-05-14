import type { SpellInput } from '@/features/content/spells/domain/types';
import type { SpellFormValues } from '../types/spellForm.types';
import {
  buildCastingTimeFromForm,
  buildComponentsFromForm,
  buildDescriptionFromForm,
  buildDurationFromForm,
  buildRangeFromForm,
  splitCastingTimeToForm,
  splitComponentsToForm,
  splitDescriptionToForm,
  splitDurationToForm,
  splitRangeToForm,
} from './spellComposite.assembly';

/** Form-only keys not part of SpellInput — strip before treating as partial input. */
export const SPELL_FORM_UI_ONLY_KEYS = new Set<string>([
  'descriptionFull',
  'descriptionSummary',
  'castingTimeUnit',
  'castingTimeValue',
  'castingTimeCanRitual',
  'castingTimeTrigger',
  'durationKind',
  'durationTimedValue',
  'durationTimedUnit',
  'durationTimedUpTo',
  'durationConcentration',
  'durationSpecialText',
  'durationUntilTriggeredText',
  'durationTurnBoundarySubject',
  'durationTurnBoundaryTurn',
  'durationTurnBoundaryBoundary',
  'rangeKind',
  'rangeDistanceValue',
  'rangeDistanceUnit',
  'rangeSpecialDescription',
  'componentIds',
  'materialDescription',
  'materialCostValue',
  'materialCostUnit',
  'materialConsumed',
]);

export function assembleSpellNestedFields(
  v: SpellFormValues,
): Pick<SpellInput, 'description' | 'castingTime' | 'duration' | 'range' | 'components'> {
  return {
    description: buildDescriptionFromForm(v),
    castingTime: buildCastingTimeFromForm(v),
    duration: buildDurationFromForm(v),
    range: buildRangeFromForm(v),
    components: buildComponentsFromForm(v),
  };
}

export function splitSpellNestedToForm(
  input: Pick<SpellInput, 'description' | 'castingTime' | 'duration' | 'range' | 'components'>,
): Partial<SpellFormValues> {
  return {
    ...splitDescriptionToForm(input.description),
    ...splitCastingTimeToForm(input.castingTime),
    ...splitDurationToForm(input.duration),
    ...splitRangeToForm(input.range),
    ...splitComponentsToForm(input.components),
  };
}
