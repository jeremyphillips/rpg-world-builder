import { useMemo, useState } from 'react'

import type { EnemyOption, EnemyRosterEntry, PartyOption } from '../types'

export function useCombatSimulationRoster(args: {
  partyOptions: PartyOption[]
  enemyOptionsByKey: Record<string, EnemyOption>
  nextRuntimeId: (prefix: string) => string
}) {
  const { partyOptions, enemyOptionsByKey, nextRuntimeId } = args

  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([])
  const [enemyRoster, setEnemyRoster] = useState<EnemyRosterEntry[]>([])

  const selectedPartyOptions = useMemo(
    () => partyOptions.filter((option) => selectedPartyIds.includes(option.id)),
    [partyOptions, selectedPartyIds],
  )

  const selectedEnemyOptions = useMemo(() => {
    const uniqueKeys = Array.from(new Set(enemyRoster.map((entry) => entry.sourceKey)))
    return uniqueKeys
      .map((key) => enemyOptionsByKey[key])
      .filter((option): option is EnemyOption => Boolean(option))
  }, [enemyRoster, enemyOptionsByKey])

  const enemySourceCounts = useMemo(
    () =>
      enemyRoster.reduce<Record<string, number>>((counts, entry) => {
        counts[entry.sourceKey] = (counts[entry.sourceKey] ?? 0) + 1
        return counts
      }, {}),
    [enemyRoster],
  )

  const selectedCombatantIds = useMemo(
    () => [...selectedPartyIds, ...enemyRoster.map((entry) => entry.runtimeId)],
    [enemyRoster, selectedPartyIds],
  )

  function handleEnemySelectionChange(nextValue: EnemyOption[]) {
    const nextKeys = new Set(nextValue.map((option) => option.key))
    const previousKeys = new Set(enemyRoster.map((entry) => entry.sourceKey))

    setEnemyRoster([
      ...enemyRoster.filter((entry) => nextKeys.has(entry.sourceKey)),
      ...nextValue
        .filter((option) => !previousKeys.has(option.key))
        .map((option) => ({
          runtimeId: nextRuntimeId(option.kind),
          sourceKey: option.key,
          sourceId: option.sourceId,
          kind: option.kind,
          label: option.label,
        })),
    ])
  }

  function removePartyCombatant(characterId: string) {
    setSelectedPartyIds((prev) => prev.filter((id) => id != characterId))
  }

  function removeEnemyCombatant(runtimeId: string) {
    setEnemyRoster((prev) => prev.filter((candidate) => candidate.runtimeId !== runtimeId))
  }

  function addEnemyCopy(entry: EnemyRosterEntry) {
    setEnemyRoster((prev) => [
      ...prev,
      {
        runtimeId: nextRuntimeId(entry.kind),
        sourceKey: entry.sourceKey,
        sourceId: entry.sourceId,
        kind: entry.kind,
        label: entry.label,
      },
    ])
  }

  return {
    selectedPartyIds,
    setSelectedPartyIds,
    enemyRoster,
    setEnemyRoster,
    selectedPartyOptions,
    selectedEnemyOptions,
    enemySourceCounts,
    selectedCombatantIds,
    handleEnemySelectionChange,
    removePartyCombatant,
    removeEnemyCombatant,
    addEnemyCopy,
  }
}
