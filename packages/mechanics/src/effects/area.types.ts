import type { AreaOfEffectKind } from '@/features/content/shared/domain/vocab/areaOfEffect.vocab';

/**
 * Authoring template for an area of effect (`size` in feet unless a caller documents otherwise).
 */
export type AreaOfEffectTemplate = {
  kind: AreaOfEffectKind;
  size: number;
};
