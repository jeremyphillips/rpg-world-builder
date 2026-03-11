/**
 * Shared form types for Gear Create/Edit routes.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';
import type { GearCategory } from '@/features/content/equipment/gear/domain/vocab';

export type GearFormValues = ContentFormValues & {
  category: GearCategory | '';
  capacity: string;
};
