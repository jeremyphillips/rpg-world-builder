/**
 * Re-exports shared area-of-effect shape catalog (canonical `kind` ids + PHB-style `rulesText`).
 * Template `{ kind, size }` remains in [`area.types`](./area.types.ts).
 */
export type { AreaOfEffectDefinition, AreaOfEffectKind } from '@/features/content/shared/domain/vocab/areaOfEffect.vocab';
export {
  AREA_OF_EFFECT_DEFINITIONS,
  AREA_OF_EFFECT_DEFINITION_BY_ID,
  AREA_OF_EFFECT_KINDS,
  getAreaOfEffectById,
  getAreaOfEffectRulesText,
  getAreaOfEffectRulesTextForKey,
} from '@/features/content/shared/domain/vocab/areaOfEffect.vocab';
