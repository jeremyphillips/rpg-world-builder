import type { AlignmentOptionSetId } from './optionSets';
import type { AlignmentId } from '@/features/content/shared/domain/types';
import type { AlignmentVocabItem } from '@/features/content/shared/domain/types';
import { resolveAlignmentOptionIds } from './resolveOptionIds';
import { ALIGNMENT_BY_ID } from './optionSets';

export function resolveAlignmentOptions(
  optionSet: AlignmentOptionSetId | readonly AlignmentId[]
): readonly AlignmentVocabItem[] {
  return resolveAlignmentOptionIds(optionSet).map(id => ALIGNMENT_BY_ID[id]);
}
