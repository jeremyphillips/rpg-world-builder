export {
  EXTRAPLANAR_CREATURE_TYPE_IDS,
  EXTRAPLANAR_CREATURE_TYPES,
  FORBIDDANCE_CREATURE_TYPE_CASTER_OPTIONS,
  type ExtraplanarCreatureTypeId,
} from './extraplanar-creature-types'

/**
 * System monster catalog — code-defined monster entries per system ruleset.
 *
 * These are the "factory defaults" for monsters. Campaign-owned custom monsters
 * are stored in the DB and merged at runtime by buildCampaignCatalog.
 *
 * Data is split under `./data/monsters-*.ts` by first letter of `id` (a–c, d–f, …).
 * Add new entries to the shard matching the id, then `MONSTERS_CORE_DATA` in `./data/monsters.ts`.
 */
import type { Monster, MonsterFields } from '@/features/content/monsters/domain/types'
import type { SystemRulesetId } from '../../types/ruleset.types'
import { DEFAULT_SYSTEM_RULESET_ID } from '../../ids/systemIds'
import { MONSTERS_CORE_DATA } from './data/monsters'

/** Build a Monster from the system catalog data (no DB fields). */
function toSystemMonster(systemId: SystemRulesetId, raw: MonsterFields): Monster {
  return {
    ...raw,
    source: 'system',
    imageKey: null,
    accessPolicy: undefined,
    patched: false,
    systemId,
  }
}

const MONSTERS_RAW: readonly MonsterFields[] = [...MONSTERS_CORE_DATA]

const SYSTEM_MONSTERS_SRD_CC_V5_2_1: readonly Monster[] = MONSTERS_RAW.map((m) =>
  toSystemMonster(DEFAULT_SYSTEM_RULESET_ID, m),
)

export const SYSTEM_MONSTERS_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Monster[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_MONSTERS_SRD_CC_V5_2_1,
}

export function getSystemMonsters(systemId: SystemRulesetId): readonly Monster[] {
  return SYSTEM_MONSTERS_BY_SYSTEM_ID[systemId] ?? []
}

export function getSystemMonster(systemId: SystemRulesetId, monsterId: string): Monster | undefined {
  return getSystemMonsters(systemId).find((m) => m.id === monsterId)
}

export type { MonsterCatalogEntry } from './types'
