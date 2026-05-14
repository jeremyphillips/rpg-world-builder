/**
 * Re-exports shared trigger catalog (canonical ids + PHB-style `rulesText`).
 * Alias inputs and `normalizeTriggerType` stay in [`trigger.types`](./trigger.types.ts).
 */
export type { TriggerDefinition, TriggerId } from '@/features/content/shared/domain/vocab/triggers.vocab';
export {
  TRIGGER_DEFINITIONS,
  TRIGGER_DEFINITION_BY_ID,
  TRIGGER_IDS,
  getTriggerById,
  getTriggerRulesText,
  getTriggerRulesTextForKey,
} from '@/features/content/shared/domain/vocab/triggers.vocab';
