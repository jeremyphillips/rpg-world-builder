/**
 * Authoring template for an area of effect (`size` in feet unless a caller documents otherwise).
 */
export type AreaOfEffectTemplate = {
  kind: 'cone' | 'sphere' | 'line' | 'square' | 'cylinder' | 'cube';
  size: number;
};
