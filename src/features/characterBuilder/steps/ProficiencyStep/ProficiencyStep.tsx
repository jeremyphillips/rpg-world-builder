import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import LockIcon from '@mui/icons-material/Lock'

import { useMemo, useCallback } from 'react'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { getSuggestedSkillProficienciesByClass } from '@/features/characterBuilder/domain/classes'
import { skillProficiencyIdToName } from '@/features/mechanics/domain/core/character/skillProficiencies.utils'
import { getSkillIds } from '@/features/character/domain/utils/character-proficiency.utils'
import type { ProficiencyAdjustment } from '@/features/character/domain/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillGroup {
  classId: string
  className: string
  options: string[]
  choiceCount: number
  key: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProficiencyStep = () => {
  const { state, setProficiencies } = useCharacterBuilder()
  const { catalog } = useCampaignRules()

  const { classes: selectedClasses, proficiencies, editMode, step } = state
  const selectedSkills = getSkillIds(proficiencies)

  const lockedSkillIds = useMemo(() => {
    const ids = editMode?.lockedSelections?.['skills']
    return ids ? new Set(ids) : new Set<string>()
  }, [editMode?.lockedSelections])

  const skillGroups: SkillGroup[] = useMemo(() => {
    const result: SkillGroup[] = []
    const allSkills = Object.values(catalog.skillProficienciesById)
    for (const cls of selectedClasses) {
      if (!cls.classId) continue
      const classDef = catalog.classesById[cls.classId]
      if (!classDef) continue

      const skills = classDef.proficiencies?.skills
      if (!skills || skills.type !== 'choice') continue

      const count = skills.choose ?? 0
      if (count === 0) continue

      const options = skills.from ?? getSuggestedSkillProficienciesByClass(allSkills, cls.classId).map((s) => s.id)
      result.push({
        classId: cls.classId,
        className: classDef.name,
        options,
        choiceCount: count,
        key: `${cls.classId}::skills`,
      })
    }
    return result
  }, [selectedClasses, catalog.classesById, catalog.skillProficienciesById])

  const totalSlots = useMemo(
    () => skillGroups.reduce((sum, g) => sum + g.choiceCount, 0),
    [skillGroups],
  )

  const toggleSkill = useCallback(
    (skillId: string) => {
      const isSelected = selectedSkills.includes(skillId)
      const isLocked = lockedSkillIds.has(skillId)
      if (isSelected && isLocked) return

      const currentSkills = proficiencies?.skills ?? {}
      let next: Record<string, ProficiencyAdjustment>
      if (isSelected) {
        const { [skillId]: _, ...rest } = currentSkills
        next = rest
      } else {
        if (selectedSkills.length >= totalSlots) return
        next = { ...currentSkills, [skillId]: { proficiencyLevel: 1 } }
      }
      setProficiencies({ ...proficiencies, skills: next })
    },
    [selectedSkills, lockedSkillIds, totalSlots, proficiencies, setProficiencies],
  )

  if (skillGroups.length === 0) {
    return (
      <>
        <h2>Proficiencies</h2>
        <Typography color="text.secondary">
          No proficiency choices available. Select a class first.
        </Typography>
      </>
    )
  }

  const remaining = totalSlots - selectedSkills.length

  return (
    <>
      <h2>Choose {step.name}</h2>

      <Stack spacing={2}>
        {skillGroups.map((group) => (
          <Card key={group.key} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {group.className} — Skills
                </Typography>
                <Chip
                  label={remaining > 0 ? `${remaining} remaining` : 'Complete'}
                  color={remaining > 0 ? 'warning' : 'success'}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Choose {group.choiceCount} from the options below.
              </Typography>

              {group.options.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {group.options.map((skillId) => {
                    const isChosen = selectedSkills.includes(skillId)
                    const isLocked = isChosen && lockedSkillIds.has(skillId)
                    const isNonInteractive = isLocked

                    return (
                      <Chip
                        key={skillId}
                        label={skillProficiencyIdToName(skillId)}
                        icon={isLocked ? <LockIcon sx={{ fontSize: 14 }} /> : undefined}
                        color={isChosen ? 'primary' : 'default'}
                        variant={isChosen ? 'filled' : 'outlined'}
                        onClick={isNonInteractive ? undefined : () => toggleSkill(skillId)}
                        sx={{ cursor: isNonInteractive ? 'default' : 'pointer' }}
                      />
                    )
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Options not yet available for this category.
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  )
}

export default ProficiencyStep
