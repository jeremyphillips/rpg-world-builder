import { ALIGNMENT_OPTION_SETS, type AlignmentOptionSetId } from './alignmentOptionSets';
import type { AlignmentId } from '@/features/content/shared/domain/types';

export function resolveAlignmentOptionIds(
  optionSet: AlignmentOptionSetId | readonly AlignmentId[]
): readonly AlignmentId[] {
  return Array.isArray(optionSet) ? 
    optionSet : 
    ALIGNMENT_OPTION_SETS[optionSet as AlignmentOptionSetId];
}