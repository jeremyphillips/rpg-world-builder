import { useState, useEffect, useMemo, useCallback } from 'react'
import type { RaceId } from '@/shared/types/ruleset'
import type { CharacterDetailDto } from '@/features/character/read-model'
import { getAlignmentOptionsForClass } from '@/features/mechanics/domain/character/selection'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { resolveAlignmentOptions } from '@/features/mechanics/domain/rulesets/alignment/resolveOptions'
import type { AlignmentId } from '@/features/content/shared/domain/types'

export interface CharacterNarrative {
  personalityTraits: string[]
  ideals: string
  bonds: string
  flaws: string
  backstory: string
}

export interface UseCharacterFormReturn {
  name: string
  setName: React.Dispatch<React.SetStateAction<string>>
  imageKey: string | null
  setImageKey: React.Dispatch<React.SetStateAction<string | null>>
  narrative: CharacterNarrative
  setNarrative: React.Dispatch<React.SetStateAction<CharacterNarrative>>
  race: RaceId
  setRace: React.Dispatch<React.SetStateAction<string>>
  alignment: AlignmentId
  setAlignment: React.Dispatch<React.SetStateAction<string>>
  totalLevel: number
  setTotalLevel: React.Dispatch<React.SetStateAction<number>>
  xp: number
  setXp: React.Dispatch<React.SetStateAction<number>>
  alignmentOptions: { id: AlignmentId; label: string }[]
  raceOptions: { id: string; label: string }[]
  syncFromCharacter: (c: CharacterDetailDto) => void
}

function getRaceId(c: CharacterDetailDto): string {
  return (typeof c.race === 'object' && c.race ? c.race.id : null) ?? ''
}

export function useCharacterForm(character: CharacterDetailDto | null): UseCharacterFormReturn {
  const [name, setName] = useState('')
  const [imageKey, setImageKey] = useState<string | null>(null)
  const [narrative, setNarrative] = useState<CharacterNarrative>({
    personalityTraits: [],
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
  })
  const [race, setRace] = useState('')
  const [alignment, setAlignment] = useState('')
  const [totalLevel, setTotalLevel] = useState(0)
  const [xp, setXp] = useState(0)

  const { catalog, ruleset } = useCampaignRules()
  const { racesById } = catalog
  const { alignment: alignmentRules } = ruleset.mechanics.character

  const syncFromCharacter = useCallback((c: CharacterDetailDto) => {
    setName(c.name ?? '')
    setImageKey(c.imageKey ?? null)
    setNarrative({
      personalityTraits: c.narrative?.personalityTraits ?? [],
      ideals: c.narrative?.ideals ?? '',
      bonds: c.narrative?.bonds ?? '',
      flaws: c.narrative?.flaws ?? '',
      backstory: c.narrative?.backstory ?? '',
    })
    setRace(getRaceId(c))
    setAlignment(c.alignment ?? '')
    setTotalLevel(c.totalLevel ?? c.level ?? 1)
    setXp(c.xp ?? 0)
  }, [])

  // Sync form fields when character first loads
  useEffect(() => {
    if (character) syncFromCharacter(character)
  }, [character?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const alignmentOptions = useMemo(() => {
    if (!character) return []
    const classIds = (character.classes ?? []).map((c) => c.classId).filter(Boolean) as string[]
    const alignmentOptions = resolveAlignmentOptions(alignmentRules.optionSetId)
    return getAlignmentOptionsForClass(
      classIds, alignmentOptions, catalog.classesById
    )
  }, [character?.classes, alignmentRules.optionSetId, catalog.classesById])

  const raceOptions = Object.values(racesById).map((r) => ({
    id: r.id,
    label: r.name,
  }))

  return {
    name,
    setName,
    imageKey,
    setImageKey,
    narrative,
    setNarrative,
    race,
    setRace,
    alignment: alignment as AlignmentId,
    setAlignment,
    totalLevel,
    setTotalLevel,
    xp,
    setXp,
    alignmentOptions: alignmentOptions as { id: AlignmentId; label: string }[],
    raceOptions,
    syncFromCharacter,
  }
}
