/**
 * System spell catalog — code-defined spell entries per system ruleset.
 *
 * These are the "factory defaults" for spells (SRD_CC_v5_2_1). Campaign-owned
 * custom spells would be stored in the DB and merged at runtime.
 *
 * Fully-authored spells include all SpellBase fields.
 * Stub entries use SpellEntry and are minimally typed until authoring reaches them.
 */
import type { Spell } from '@/features/content/spells/domain/types';
import type { SpellEntry } from './types';
import type { SystemRulesetId } from '../../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../../ids/systemIds';
import { SPELLS_LEVEL_0 } from './data/cantrips';
import { SPELLS_LEVEL_1 } from './data/level1';
import { SPELLS_LEVEL_2 } from './data/level2';
import { SPELLS_LEVEL_3 } from './data/level3';
import { SPELLS_LEVEL_4 } from './data/level4';
import { SPELLS_LEVEL_5 } from './data/level5';
import { SPELLS_LEVEL_6 } from './data/level6';
import { SPELLS_LEVEL_7 } from './data/level7';
import { SPELLS_LEVEL_8 } from './data/level8';
import { SPELLS_LEVEL_9 } from './data/level9';
import { LEGACY_SPELL_ID_MAP } from './shared';

const SPELLS_RAW: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_0,
  ...SPELLS_LEVEL_1,
  ...SPELLS_LEVEL_2,
  ...SPELLS_LEVEL_3,
  ...SPELLS_LEVEL_4,
  ...SPELLS_LEVEL_5,
  ...SPELLS_LEVEL_6,
  ...SPELLS_LEVEL_7,
  ...SPELLS_LEVEL_8,
  ...SPELLS_LEVEL_9,
];

function toSystemSpell(
  spell: SpellEntry,
  systemId: SystemRulesetId,
): Spell {
  return {
    ...spell,
    source: 'system',
    systemId,
    patched: false,
  } as Spell;
}

const SYSTEM_SPELLS_SRD_CC_V5_2_1: readonly Spell[] = SPELLS_RAW.map(
  (s) => toSystemSpell(s, DEFAULT_SYSTEM_RULESET_ID),
);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_SPELLS_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Spell[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_SPELLS_SRD_CC_V5_2_1,
};

export function getSystemSpells(systemId: SystemRulesetId): readonly Spell[] {
  return SYSTEM_SPELLS_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemSpell(systemId: SystemRulesetId, id: string): Spell | undefined {
  return getSystemSpells(systemId).find((s) => s.id === id);
}

export { LEGACY_SPELL_ID_MAP };
