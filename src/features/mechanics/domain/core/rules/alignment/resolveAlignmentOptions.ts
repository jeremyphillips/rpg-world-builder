import type { AlignmentOptionSetId } from './alignmentOptionSets';
import type { AlignmentId } from '@/features/content/shared/domain/types';
import type { AlignmentVocabItem } from '@/features/content/shared/domain/types';
import { resolveAlignmentOptionIds } from './resolveAlignmentOptionIds';
import { ALIGNMENT_BY_ID } from './alignmentOptionSets';

export function resolveAlignmentOptions(
  optionSet: AlignmentOptionSetId | readonly AlignmentId[]
): readonly AlignmentVocabItem[] {
  return resolveAlignmentOptionIds(optionSet).map(id => ALIGNMENT_BY_ID[id]);
}
