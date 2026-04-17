import type { Race } from '@/features/content/races/domain/types';
import { contentDetailMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';

export type RaceDetailCtx = Record<string, never>;

export const RACE_DETAIL_SPECS: DetailSpec<Race, RaceDetailCtx>[] = [
  ...contentDetailMetaSpecs<Race, RaceDetailCtx>(),
];
