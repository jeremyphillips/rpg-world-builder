import type {
  ALIGNMENT_LIST_NINE_POINT,
  ALIGNMENT_LIST_FIVE_POINT,
  ALIGNMENT_LIST_THREE_POINT,
} from '../vocab/alignment.vocab';

export type AlignmentVocabItem = {
  id: AlignmentId;
  name: string;
  description: string;
}

// Helper types
type ItemOf<T extends readonly unknown[]> = T[number];
type IdOf<T extends readonly { id: string }[]> = T[number]['id'];

export type AlignmentNinePoint = ItemOf<typeof ALIGNMENT_LIST_NINE_POINT>;
export type AlignmentFivePoint = ItemOf<typeof ALIGNMENT_LIST_FIVE_POINT>;
export type AlignmentThreePoint = ItemOf<typeof ALIGNMENT_LIST_THREE_POINT>;

export type AlignmentListItem =
  | AlignmentNinePoint
  | AlignmentFivePoint
  | AlignmentThreePoint;

export type AlignmentList = readonly AlignmentListItem[];

export type AlignmentNinePointId = IdOf<typeof ALIGNMENT_LIST_NINE_POINT>;
export type AlignmentFivePointId = IdOf<typeof ALIGNMENT_LIST_FIVE_POINT>;
export type AlignmentThreePointId = IdOf<typeof ALIGNMENT_LIST_THREE_POINT>;

export type AlignmentId =
  | AlignmentNinePointId
  | AlignmentFivePointId
  | AlignmentThreePointId;