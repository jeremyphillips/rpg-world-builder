import type { CombatStartupInput, CombatantInstance } from '@rpg-world-builder/mechanics'

import {
  buildCharacterCombatantForGameSession,
  buildMonsterCombatantForGameSession,
} from '@/features/game-session/combat/buildCharacterCombatantForGameSession'
import { resolveExpectedSessionCharacterIds } from '@/features/game-session/utils/resolveExpectedSessionCharacterIds'
import { resolveLaunchSessionCharacterIds } from '@/features/game-session/utils/resolveLaunchSessionCharacterIds'
import type { GameSession } from '@/features/game-session/domain/game-session.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'

import { getPartyCharacters } from '../../campaign/services/campaign.service'
import { getCharacterDetail } from '../../character/services/character.service'
import type { GameSessionApi } from './gameSession.service'
import { resolveCampaignRulesAndCatalogForGameSession } from './resolveCampaignRulesAndCatalog.server'
import { resolveEncounterSpaceForGameSessionStart } from './resolveGameSessionCombatSpace.server'

export type BuildCombatStartupFromGameSessionResult =
  | { ok: true; input: CombatStartupInput }
  | { ok: false; message: string }

export async function buildCombatStartupInputFromGameSession(
  session: GameSessionApi,
  campaignId: string,
  options: { presentUserIds: string[] },
): Promise<BuildCombatStartupFromGameSessionResult> {
  const { ruleset, catalog } = await resolveCampaignRulesAndCatalogForGameSession(campaignId)

  const roster = await getPartyCharacters(campaignId, 'approved')
  if (roster.length === 0) {
    return { ok: false, message: 'No approved party characters in this campaign.' }
  }

  /** Player characters only — matches lobby / session-start UX; opponent NPCs come from opponentRefKeys. */
  const rosterPlayerCharacters = roster.filter((row) => row.type !== 'npc')

  const sessionForExpected = session as unknown as GameSession
  const expectedAll = resolveExpectedSessionCharacterIds(sessionForExpected, roster)
  const expectedCharacterIds = expectedAll.filter((id) => rosterPlayerCharacters.some((r) => r.id === id))

  const launchCharacterIds = resolveLaunchSessionCharacterIds({
    expectedCharacterIds,
    rosterCharacters: rosterPlayerCharacters,
    presentUserIds: options.presentUserIds,
  })

  if (launchCharacterIds.length === 0) {
    return {
      ok: false,
      message:
        'At least one expected party character whose player is present in the lobby is required to start. ' +
        'Players must have this lobby open so their presence is recorded.',
    }
  }

  const launchSet = new Set(launchCharacterIds)
  const rosterLaunch = roster.filter((row) => launchSet.has(row.id))

  const combatants: CombatantInstance[] = []

  for (const row of rosterLaunch) {
    const detail = await getCharacterDetail(row.id)
    if (!detail) continue
    combatants.push(
      buildCharacterCombatantForGameSession({
        character: detail,
        catalog,
        ruleset,
        runtimeId: `party-${row.id}`,
        side: 'party',
        sourceKind: detail.type === 'npc' ? 'npc' : 'pc',
      }),
    )
  }

  if (combatants.length === 0) {
    return { ok: false, message: 'Could not load any party character detail for combat.' }
  }

  let opponentIndex = 0
  for (const key of session.opponentRefKeys ?? []) {
    if (key.startsWith('monster:')) {
      const id = key.slice('monster:'.length)
      const monster = catalog.monstersById?.[id] as Monster | undefined
      if (!monster) {
        return { ok: false, message: `Unknown monster id in session setup: ${id}` }
      }
      opponentIndex += 1
      combatants.push(
        buildMonsterCombatantForGameSession({
          monster,
          catalog,
          runtimeId: `monster-${opponentIndex}`,
        }),
      )
    } else if (key.startsWith('npc:')) {
      const id = key.slice('npc:'.length)
      const detail = await getCharacterDetail(id)
      if (!detail) {
        return { ok: false, message: `Unknown NPC id in session setup: ${id}` }
      }
      opponentIndex += 1
      combatants.push(
        buildCharacterCombatantForGameSession({
          character: detail,
          catalog,
          ruleset,
          runtimeId: `npc-${id}`,
          side: 'enemies',
          sourceKind: 'npc',
        }),
      )
    }
  }

  const suppressSameSideHostile = ruleset.mechanics.combat.encounter.suppressSameSideHostile === true

  const { space } = await resolveEncounterSpaceForGameSessionStart(campaignId, session)

  const input: CombatStartupInput = {
    combatants,
    space,
    battlefieldSpell: {
      spellsById: catalog.spellsById as Record<string, Spell>,
      monstersById: catalog.monstersById as Record<string, Monster>,
      suppressSameSideHostile,
    },
  }

  return { ok: true, input }
}
