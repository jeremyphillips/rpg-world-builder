/**
 * Location create/edit form values — extends shared content form contract.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';

export type LocationFormValues = ContentFormValues & {
  scale: string;
  category: string;
  parentId: string;
  /** Grid geometry — 'square' or 'hex'. */
  gridGeometry: string;
  /** Preset key — fills columns/rows when set */
  gridPreset: string;
  gridColumns: string;
  gridRows: string;
  gridCellUnit: string;
  labelShort: string;
  labelNumber: string;
  sortOrder: string;
  aliases: string;
  tags: string;
};
