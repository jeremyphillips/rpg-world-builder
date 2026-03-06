import type { AlignmentId } from '@/features/content/shared/domain/types';
import {
  ALIGNMENT_LIST_NINE_POINT,
  ALIGNMENT_LIST_FIVE_POINT,
  ALIGNMENT_LIST_THREE_POINT,
} from '@/features/content/shared/domain/vocab/alignment.vocab';

export const ALIGNMENT_OPTION_SETS: Record<string, readonly AlignmentId[]> = {
  nine_point: ALIGNMENT_LIST_NINE_POINT.map(a => a.id),
  five_point: ALIGNMENT_LIST_FIVE_POINT.map(a => a.id),
  three_point: ALIGNMENT_LIST_THREE_POINT.map(a => a.id),
} as const;

export const ALIGNMENT_ITEMS = [
  ...ALIGNMENT_LIST_NINE_POINT,
  ...ALIGNMENT_LIST_FIVE_POINT,
  ...ALIGNMENT_LIST_THREE_POINT,
] as const;

export const ALIGNMENT_BY_ID = Object.fromEntries(
  ALIGNMENT_ITEMS.map(a => [a.id, a])
) as Record<AlignmentId, (typeof ALIGNMENT_ITEMS)[number]>;

export type AlignmentOptionSetId = keyof typeof ALIGNMENT_OPTION_SETS;