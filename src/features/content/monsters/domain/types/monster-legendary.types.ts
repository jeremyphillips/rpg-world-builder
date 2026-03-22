import type { DiceOrFlat } from '@/features/mechanics/domain/dice';
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';
import type { ContentResolutionMeta } from '@/features/mechanics/domain/resolution/content-resolution.types';
import type { OffTurnTiming, TurnHookKind } from '@/features/mechanics/domain/triggers/turn-hooks.types';
import type { MonsterAction } from './monster-actions.types';

export type MonsterLegendaryActionReference = {
  kind: 'reference';
  name: string;
  /** Action points; default 1 when omitted in UIs. */
  cost?: number;
  /** Matches `MonsterSpecialAction.id` / `MonsterNaturalAttackAction.id`, or `weaponRef` for `kind: 'weapon'`. */
  actionId: string;
  notes?: string;
  heal?: DiceOrFlat;
  additionalEffects?: Effect[];
  resolution?: ContentResolutionMeta;
};

export type MonsterLegendaryActionInline = {
  kind: 'inline';
  name: string;
  cost?: number;
  action: MonsterAction;
  resolution?: ContentResolutionMeta;
};

export type MonsterLegendaryAction = MonsterLegendaryActionReference | MonsterLegendaryActionInline;

export type MonsterLegendaryActions = {
  uses: number;
  usesInLair?: number;
  /** When legendary actions may be taken (e.g. immediately after another creature’s turn). */
  timing?: OffTurnTiming;
  /** When expended uses refresh (e.g. start of this creature’s turn). */
  refresh?: TurnHookKind;
  actions: MonsterLegendaryAction[];
  resolution?: ContentResolutionMeta;
};
