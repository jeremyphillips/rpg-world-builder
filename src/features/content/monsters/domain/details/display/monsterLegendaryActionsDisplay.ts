import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterLegendaryAction, MonsterLegendaryActions } from '@/features/content/monsters/domain/types/monster-legendary.types';
import type { MonsterAction } from '@/features/content/monsters/domain/types/monster-actions.types';

import {
  formatMonsterActionCallout,
  resolveMonsterActionTitle,
} from '@/features/content/monsters/domain/details/display/monsterActionsDisplay';

function formatUsesHeader(block: MonsterLegendaryActions): string {
  const base = `${block.uses}/Day`;
  if (block.usesInLair != null && block.usesInLair !== block.uses) {
    return `${base} (${block.usesInLair} in lair)`;
  }
  return base;
}

function formatTiming(block: MonsterLegendaryActions): string | undefined {
  const parts: string[] = [];
  if (block.timing === 'end-of-other-creatures-turn') {
    parts.push(`After another creature’s turn`);
  }
  if (block.refresh === 'turn-start') {
    parts.push(`Uses refresh at start of this creature’s turn`);
  } else if (block.refresh === 'turn-end') {
    parts.push(`Uses refresh at end of this creature’s turn`);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function resolveLegendaryInlineAction(monster: Monster, action: MonsterAction): string {
  return resolveMonsterActionTitle(monster, action);
}

function formatLegendaryEntryLine(monster: Monster, entry: MonsterLegendaryAction): string {
  const cost = entry.cost != null && entry.cost !== 1 ? ` (${entry.cost} actions)` : '';
  if (entry.kind === 'reference') {
    return `${entry.name}${cost}`;
  }
  const title = resolveLegendaryInlineAction(monster, entry.action);
  const callout = formatMonsterActionCallout(monster, entry.action);
  return callout ? `${title}${cost}: ${callout}` : `${title}${cost}`;
}

/**
 * Short header + timing summary for the legendary block (not individual actions).
 */
export function formatMonsterLegendaryHeaderSummary(block: MonsterLegendaryActions | undefined): string {
  if (!block) return '—';
  const head = formatUsesHeader(block);
  const timing = formatTiming(block);
  return timing ? `${head} · ${timing}` : head;
}

/**
 * Bullet-style lines for each legendary action (names + mechanical callouts when inline).
 */
export function formatMonsterLegendaryActionsLines(
  monster: Monster,
  block: MonsterLegendaryActions | undefined,
): string[] {
  if (!block?.actions?.length) return [];

  return block.actions.map((entry) => formatLegendaryEntryLine(monster, entry));
}
