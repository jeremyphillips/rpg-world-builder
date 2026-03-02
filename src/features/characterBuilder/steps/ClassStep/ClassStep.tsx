import { useEffect } from 'react'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { InvalidationNotice } from '@/features/characterBuilder/components'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { evaluateClassEligibility, getClassRestrictionNotes } from '@/features/mechanics/domain/character-build/rules'
import { getSubclassUnlockLevel } from '@/features/mechanics/domain/progression'
import { getClassDefinitions } from '@/features/character/domain/reference'
import { canAddClass } from '@/features/character/domain/validation'
import { getClassProgression } from '@/features/mechanics/domain/progression'
import type { ClassProgression } from '@/data/classes.types'
import { ButtonGroup } from '@/ui/patterns'
import { getSubclassNameById } from '@/features/character/domain/reference'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatHitDie(prog: ClassProgression): string {
  if (prog.hitDie === 0 && prog.hpPerLevel) return `${prog.hpPerLevel} HP/level`
  return `d${prog.hitDie}`
}

function formatSpellcasting(prog: ClassProgression): string | null {
  if (!prog.spellcasting || prog.spellcasting === 'none') return null
  const labels: Record<string, string> = {
    full: 'Full caster',
    half: 'Half caster',
    third: 'Third caster',
    pact: 'Pact magic',
  }
  return labels[prog.spellcasting] ?? prog.spellcasting
}

function formatSavingThrows(prog: ClassProgression): string | null {
  if (!prog.savingThrows || prog.savingThrows.length === 0) return null
  return prog.savingThrows.map((s) => s.toUpperCase()).join(', ')
}

const ClassStep = () => {
  const {
    state,
    allocatedLevels,
    setActiveClassIndex,
    setClassId,
    addClass,
    updateClassLevel,
    removeClass,
    updateClassDefinition,
    allocateRemainingLevels,
    stepNotices,
    dismissNotice
  } = useCharacterBuilder()
  const { catalog, ruleset } = useCampaignRules()
  const { classesById } = catalog
  const { multiclassing: multiclassingRules } = ruleset.mechanics.progression

  const {
    step,
    classes: selectedClasses,
    activeClassIndex,
    totalLevel
  } = state

  useEffect(() => {
    if (selectedClasses[0]?.classId === undefined && activeClassIndex !== 0) {
      setActiveClassIndex(0)
    }
  }, [selectedClasses[0]?.classId, activeClassIndex, setActiveClassIndex])

  const activeClass =
    typeof activeClassIndex === 'number'
      ? selectedClasses[activeClassIndex]
      : null

  const remainingLevels = (totalLevel ?? 0) - allocatedLevels

  const characterLevel = totalLevel ?? 1
  const ruleCtx = { classId: selectedClasses[0]?.classId }
  const { abilityScores } = state

  // Does this campaign support multiclassing at all? (ignoring current class
  // count / remaining levels — just the campaign-level rule)
  const campaignAllowsMulticlass = canAddClass(multiclassingRules, ruleCtx, 1, 1, characterLevel, undefined, abilityScores).allowed

  // When multiclassing is disabled, auto-allocate all levels to the primary
  // class so the user doesn't need to interact with a level spinner.
  useEffect(() => {
    if (!campaignAllowsMulticlass && remainingLevels > 0) {
      allocateRemainingLevels()
    }
  }, [campaignAllowsMulticlass, remainingLevels, allocateRemainingLevels])

  /* ---------- Primary class options ---------- */
  const classOptions = Object.values(catalog.classesById)
    .map(cls => {
      const { allowed } = evaluateClassEligibility(cls.id, state, classesById)
      return {
        id: cls.id,
        label: cls.name,
        disabled: !allowed,
      }
    })

  const primaryClassSelected = Boolean(selectedClasses[0]?.classId)

  const restrictionNotes = getClassRestrictionNotes(Object.keys(classesById), classesById)

  const classNotices = stepNotices.get('class') ?? []

  return (
    <div>
      <header>
        <h2>Choose {step.name}</h2>
        <InvalidationNotice items={classNotices} onDismiss={() => dismissNotice('class')} />

        {/* Level allocation summary — only relevant for multiclass editions */}
        {campaignAllowsMulticlass && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Allocate your {totalLevel ?? 0} total level{(totalLevel ?? 0) > 1 ? 's' : ''} across one or more classes.
            </Typography>
            <Typography variant="body2">
              <strong>Levels Allocated:</strong> {allocatedLevels} / {totalLevel}
              {remainingLevels > 0 && (
                <>
                  {' — '}
                  <Typography component="span" variant="body2" color="text.secondary">
                    {remainingLevels} level{remainingLevels > 1 ? 's' : ''} remaining
                  </Typography>
                </>
              )}
            </Typography>
            {remainingLevels === 0 && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">All levels allocated</Typography>
              </Stack>
            )}
          </Box>
        )}
      </header>

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {selectedClasses.map((cls, index) => {
          const isActive = activeClass && index === activeClassIndex
          const isPrimary = index === 0

          const subclassUnlockLevel = getSubclassUnlockLevel(cls.classId)
          const canChooseSubclass =
            cls.classId &&
            subclassUnlockLevel &&
            cls.level >= subclassUnlockLevel

          const definitions = canChooseSubclass
            ? getClassDefinitions(cls.classId, cls.level)
            : []

          const subclassOptions = definitions.map(opt => ({
            id: opt.id ?? '',
            label: opt.name,
          }))

          return (
            <Card
              key={index}
              variant="outlined"
              sx={{
                width: '100%',
                transition: 'height 0.3s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                ...(isActive && {
                  borderColor: 'var(--mui-palette-primary-main)',
                  bgcolor: 'var(--mui-palette-action-hover)',
                }),
              }}
            >
              <CardContent sx={{ pb: isActive ? 0 : undefined }}>
                {/* Card header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Chip
                      label={isPrimary ? 'Primary Class' : 'Secondary Class'}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                      {(cls.classId && catalog.classesById[cls.classId]?.name) || 'Choose a class'}
                      {cls.classDefinitionId && ` — ${getSubclassNameById(cls.classId, cls.classDefinitionId)}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" my={1.5}>
                      Level {cls.level}
                    </Typography>
                    {restrictionNotes.length > 0 && restrictionNotes.map((note, i) => (
                      <Typography
                        key={i}
                        component="small"
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {note}
                      </Typography>
                    ))}
                  </Box>

                  {!isActive && (
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="medium"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setActiveClassIndex(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="medium"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => removeClass(index)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </CardContent>

              {/* Expanded editor */}
              {isActive && (
                <>
                  <CardContent>
                    {/* Class selection */}
                    <ButtonGroup
                      options={classOptions.map(opt => {
                        const primaryClassId = selectedClasses[0]?.classId
                        let disabled =
                          opt.disabled || (index !== 0 && opt.id === primaryClassId)
                        let tooltip: string | undefined

                        if (!disabled && index > 0) {
                          const mc = canAddClass(
                            multiclassingRules, ruleCtx, selectedClasses.length,
                            remainingLevels, characterLevel, opt.id, abilityScores,
                          )
                          if (!mc.allowed) {
                            disabled = true
                            tooltip = mc.reason
                          }
                        }

                        return { ...opt, disabled, tooltip }
                      })}
                      value={cls.classId}
                      onChange={id => setClassId(id)}
                      autoSelectSingle
                    />

                    {/* Progression info panel */}
                    {cls.classId && (() => {
                      const prog = classesById[cls.classId]?.progression
                      if (!prog) return null
                      const spellLabel = formatSpellcasting(prog)
                      const savesLabel = formatSavingThrows(prog)
                      const previewFeatures = (prog.features ?? []).slice(0, 4)
                      return (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                            <Chip label={`Hit Die: ${formatHitDie(prog)}`} size="small" variant="outlined" />
                            {prog.role && (
                              <Chip
                                label={`${prog.role}${prog.powerSource ? ` (${prog.powerSource})` : ''}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {spellLabel && <Chip label={spellLabel} size="small" variant="outlined" />}
                            {savesLabel && <Chip label={`Saves: ${savesLabel}`} size="small" variant="outlined" />}
                          </Stack>
                          {previewFeatures.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {previewFeatures.map((f) => `Lv ${f.level}: ${f.name}`).join(', ')}
                            </Typography>
                          )}
                        </Box>
                      )
                    })()}

                    {/* Level spinner — only shown when multiclassing is available */}
                    {campaignAllowsMulticlass && (
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 3 }}>
                        <IconButton
                          size="medium"
                          disabled={cls.level <= 1}
                          onClick={() => updateClassLevel(index, cls.level - 1)}
                          color="primary"
                        >
                          <RemoveIcon />
                        </IconButton>

                        <TextField
                          value={cls.level}
                          size="small"
                          type="number"
                          slotProps={{
                            input: {
                              readOnly: true,
                              sx: { textAlign: 'center', width: 72 },
                            },
                            htmlInput: {
                              min: 1,
                              max: totalLevel,
                              style: { textAlign: 'center' },
                            },
                          }}
                          label="Level"
                        />

                        <IconButton
                          size="medium"
                          disabled={remainingLevels <= 0}
                          onClick={() => updateClassLevel(index, cls.level + 1)}
                          color="primary"
                        >
                          <AddIcon />
                        </IconButton>

                        <Button
                          variant="text"
                          size="small"
                          onClick={allocateRemainingLevels}
                          disabled={remainingLevels <= 0}
                        >
                          Allocate remaining
                        </Button>
                      </Stack>
                    )}

                    {/* Subclass */}
                    {subclassOptions.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Subclass</Typography>
                        <ButtonGroup
                          options={subclassOptions}
                          value={cls.classDefinitionId}
                          onChange={id =>
                            updateClassDefinition(index, id)
                          }
                          autoSelectSingle
                          size="sm"
                        />
                      </>
                    )}

                    {!canChooseSubclass && cls.classId && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Subclass unlocks at level {subclassUnlockLevel}
                      </Typography>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          )
        })}
      </Stack>

      {/* Add class — gated by multiclassing rules */}
      {primaryClassSelected && (() => {
        const mc = canAddClass(multiclassingRules, ruleCtx, selectedClasses.length, remainingLevels, characterLevel, undefined, abilityScores)
        return (
          <CardActions sx={{ px: 0, pt: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addClass}
              disabled={!mc.allowed}
            >
              Add another class
            </Button>
            {!mc.allowed && mc.reason && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {mc.reason}
              </Typography>
            )}
          </CardActions>
        )
      })()}
    </div>
  )
}

export default ClassStep
