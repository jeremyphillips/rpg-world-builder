import { useMemo, useState } from 'react'

import type { OpponentOption, OpponentRosterEntry, AllyOption } from '../types'

export function useEncounterRoster(args: {
  allyOptions: AllyOption[]
  opponentOptionsByKey: Record<string, OpponentOption>
  nextRuntimeId: (prefix: string) => string
}) {
  const { allyOptions, opponentOptionsByKey, nextRuntimeId } = args

  const [selectedAllyIds, setSelectedAllyIds] = useState<string[]>([])
  const [opponentRoster, setOpponentRoster] = useState<OpponentRosterEntry[]>([])

  const selectedAllyOptions = useMemo(
    () => allyOptions.filter((option) => selectedAllyIds.includes(option.id)),
    [allyOptions, selectedAllyIds],
  )

  const selectedOpponentOptions = useMemo(() => {
    const uniqueKeys = Array.from(new Set(opponentRoster.map((entry) => entry.sourceKey)))
    return uniqueKeys
      .map((key) => opponentOptionsByKey[key])
      .filter((option): option is OpponentOption => Boolean(option))
  }, [opponentRoster, opponentOptionsByKey])

  const opponentSourceCounts = useMemo(
    () =>
      opponentRoster.reduce<Record<string, number>>((counts, entry) => {
        counts[entry.sourceKey] = (counts[entry.sourceKey] ?? 0) + 1
        return counts
      }, {}),
    [opponentRoster],
  )

  const selectedCombatantIds = useMemo(
    () => [...selectedAllyIds, ...opponentRoster.map((entry) => entry.runtimeId)],
    [opponentRoster, selectedAllyIds],
  )

  function handleOpponentSelectionChange(nextValue: OpponentOption[]) {
    const nextKeys = new Set(nextValue.map((option) => option.key))
    const previousKeys = new Set(opponentRoster.map((entry) => entry.sourceKey))

    setOpponentRoster([
      ...opponentRoster.filter((entry) => nextKeys.has(entry.sourceKey)),
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

  function removeAllyCombatant(characterId: string) {
    setSelectedAllyIds((prev) => prev.filter((id) => id != characterId))
  }

  function removeOpponentCombatant(runtimeId: string) {
    setOpponentRoster((prev) => prev.filter((candidate) => candidate.runtimeId !== runtimeId))
  }

  function addOpponentCopy(entry: OpponentRosterEntry) {
    setOpponentRoster((prev) => [
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
    selectedAllyIds,
    setSelectedAllyIds,
    opponentRoster,
    setOpponentRoster,
    selectedAllyOptions,
    selectedOpponentOptions,
    opponentSourceCounts,
    selectedCombatantIds,
    handleOpponentSelectionChange,
    removeAllyCombatant,
    removeOpponentCombatant,
    addOpponentCopy,
  }
}
