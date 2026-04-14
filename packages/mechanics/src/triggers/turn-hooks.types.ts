import type { TriggerId } from '@/features/content/shared/domain/vocab/triggers.vocab';

/**
 * Start or end of a turn on the usual initiative timeline (repeat saves, regeneration, etc.).
 * Aligned with canonical trigger ids in shared vocab.
 */
export type TurnHookKind = Extract<TriggerId, 'turn-start' | 'turn-end'>;

/** Regeneration-style trigger: this creature’s turn boundary. */
export type TurnHookSelfTrigger = {
  kind: TurnHookKind;
  subject: 'self';
};

/**
 * Timing relative to other combatants’ turns (e.g. legendary actions, some reactions).
 * Not the same as {@link TurnHookKind} on the acting creature.
 */
export type OffTurnTiming = 'end-of-other-creatures-turn';
