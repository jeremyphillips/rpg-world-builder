import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CharacterDoc } from '@/shared'
import { getAlignmentOptionsForCharacter } from '@/features/character/domain/reference'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'

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
  race: string
  setRace: React.Dispatch<React.SetStateAction<string>>
  alignment: string
  setAlignment: React.Dispatch<React.SetStateAction<string>>
  totalLevel: number
  setTotalLevel: React.Dispatch<React.SetStateAction<number>>
  xp: number
  setXp: React.Dispatch<React.SetStateAction<number>>
  alignmentOptions: { id: string; label: string }[]
  raceOptions: { id: string; label: string }[]
  syncFromCharacter: (c: CharacterDoc) => void
}

export function useCharacterForm(character: CharacterDoc | null): UseCharacterFormReturn {
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

  const syncFromCharacter = useCallback((c: CharacterDoc) => {
    setName(c.name ?? '')
    setImageKey(c.imageKey ?? null)
    setNarrative({
      personalityTraits: c.narrative?.personalityTraits ?? [],
      ideals: c.narrative?.ideals ?? '',
      bonds: c.narrative?.bonds ?? '',
      flaws: c.narrative?.flaws ?? '',
      backstory: c.narrative?.backstory ?? '',
    })
    setRace(c.race ?? '')
    setAlignment(c.alignment ?? '')
    setTotalLevel(c.totalLevel ?? c.level ?? 0)
    setXp(c.xp ?? 0)
  }, [])

  // Sync form fields when character first loads
  useEffect(() => {
    if (character) syncFromCharacter(character)
  }, [character?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  const alignmentOptions = useMemo(() => {
    if (!character) return []
    const classIds = (character.classes ?? []).map((c) => c.classId).filter(Boolean) as string[]
    return getAlignmentOptionsForCharacter(classIds, alignmentRules.options, catalog.classesById)
  }, [character?.classes, alignmentRules.options, catalog.classesById])

  // const raceOptions = useMemo(() => {
  //   if (!character) return []
  //   return Object.values(racesById).map((r) => ({
  //     id: r.id,
  //     label: r.name,
  //   }))
  // }, [])

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
    alignment,
    setAlignment,
    totalLevel,
    setTotalLevel,
    xp,
    setXp,
    alignmentOptions,
    raceOptions,
    syncFromCharacter,
  }
}
