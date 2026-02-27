import { useCharacterBuilder } from '../../context'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { standardAlignments, fourEAlignments, basicAlignments } from '@/data/ruleSets'
import type { ClassProgression } from '@/data'
import type { StepId } from '../../types'
import {
  FIVE_E_STRENGTH_SKILLS,
  FIVE_E_DEXTERITY_SKILLS,
  FIVE_E_INTELLIGENCE_SKILLS,
  FIVE_E_WISDOM_SKILLS,
  FIVE_E_CHARISMA_SKILLS
} from '@/data'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// ---------------------------------------------------------------------------
// Skill name lookup
// ---------------------------------------------------------------------------

const SKILL_NAME_MAP: Record<string, string> = Object.fromEntries(
  [
    FIVE_E_STRENGTH_SKILLS,
    FIVE_E_DEXTERITY_SKILLS,
    FIVE_E_INTELLIGENCE_SKILLS,
    FIVE_E_WISDOM_SKILLS,
    FIVE_E_CHARISMA_SKILLS
  ].flatMap(group =>
    Object.entries(group).map(([id, def]) => [id, def.name])
  )
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAlignmentName(alignmentId: string | undefined): string {
  if (!alignmentId) return '—'
  const allAlignments = [...standardAlignments, ...fourEAlignments, ...basicAlignments]
  return allAlignments.find(a => a.id === alignmentId)?.name ?? alignmentId
}

function formatHitDie(prog: ClassProgression): string {
  if (prog.hitDie === 0 && prog.hpPerLevel) return `${prog.hpPerLevel} HP/lvl`
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

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string
  stepId: StepId
  value: React.ReactNode
  onEdit: (stepId: StepId) => void
  filled?: boolean
}

function SummaryCard({ label, stepId, value, onEdit, filled = true }: SummaryCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: filled ? 'transparent' : 'var(--mui-palette-action-hover)',
        opacity: filled ? 1 : 0.7,
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
              {label}
            </Typography>
            <Box sx={{ mt: 0.25 }}>{value}</Box>
          </Box>
          <Button
            size="small"
            startIcon={<EditIcon fontSize="small" />}
            onClick={() => onEdit(stepId)}
            sx={{ ml: 1, flexShrink: 0 }}
          >
            Edit
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ConfirmationStep
// ---------------------------------------------------------------------------

const ConfirmationStep = () => {
  const { state, goToStep, setName } = useCharacterBuilder()
  const { catalog } = useCampaignRules()

  const raceName = catalog.racesById[state.race]?.name ?? state.race ?? '—'
  const alignmentName = getAlignmentName(state.alignment)

  const filledClasses = state.classes.filter(cls => cls.classId)
  const isMulticlass = filledClasses.length > 1

  const classLines = filledClasses.map((cls, i) => {
    const classDef = cls.classId ? catalog.classesById[cls.classId] : undefined
    const name = classDef?.name ?? cls.classId ?? 'Unknown'

    let subclassName = ''
    if (cls.classDefinitionId && classDef) {
      const opt = classDef.definitions?.options?.find(o => o.id === cls.classDefinitionId)
      if (opt) subclassName = opt.name
    }

    let line = name
    if (subclassName) line += `, ${subclassName}`
    line += ` (Lvl ${cls.level})`
    if (i === 0 && isMulticlass) line += ' (primary)'
    return line
  })

  const equipmentCount =
    (state.equipment?.weapons?.length ?? 0) +
    (state.equipment?.armor?.length ?? 0) +
    (state.equipment?.gear?.length ?? 0)

  // Resolve skill IDs to display names
  const selectedSkillIds = state.proficiencies?.skills ?? []
  const resolvedSkillNames = selectedSkillIds.map(id => SKILL_NAME_MAP[id] ?? id)
  const totalProfs = selectedSkillIds.length

  // Resolve spell IDs to name + level from catalog
  const selectedSpellIds = state.spells ?? []
  const resolvedSpells = selectedSpellIds
    .map(id => {
      const spell = catalog.spellsById[id]
      return spell ? { name: spell.name, level: spell.level } : null
    })
    .filter(Boolean) as { name: string; level: number }[]
  const spellsByLevel = resolvedSpells.reduce<Map<number, string[]>>((map, s) => {
    const names = map.get(s.level) ?? []
    names.push(s.name)
    map.set(s.level, names)
    return map
  }, new Map())

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <CheckCircleIcon color="success" />
        <Typography variant="h5" fontWeight={700}>
          Review Your Character
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your selections below. Click <strong>Edit</strong> on any card to make changes, or press <strong>Generate Character</strong> when ready.
      </Typography>

      <Stack spacing={1.5}>
        {/* Name */}
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
          Character Name
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Optional — will be generated"
          value={state.name ?? ''}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 0.5 }}
        />

        {/* Race */}
        {!state.lockedFields?.has('race') && (
          <SummaryCard
            label="Race"
            stepId="race"
            filled={!!state.race}
            onEdit={goToStep}
            value={
              <Typography variant="body1" fontWeight={600}>
                {raceName}
              </Typography>
            }
          />
        )}

        {/* Level */}
        <SummaryCard
          label="Level"
          stepId="level"
          filled={!!state.totalLevel}
          onEdit={goToStep}
          value={
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body1" fontWeight={600}>
                Level {state.totalLevel || '—'}
              </Typography>
              {(state.xp ?? 0) > 0 && (
                <Chip label={`${(state.xp ?? 0).toLocaleString()} XP`} size="small" variant="outlined" />
              )}
            </Stack>
          }
        />

        {/* Classes */}
        <SummaryCard
          label="Class"
          stepId="class"
          filled={classLines.length > 0}
          onEdit={goToStep}
          value={
            classLines.length > 0 ? (
              <Box>
                {filledClasses.map((cls, i) => {
                  const classDef = cls.classId ? catalog.classesById[cls.classId] : undefined
                  const prog = classDef?.progression
                  const spellLabel = prog ? formatSpellcasting(prog) : null
                  return (
                    <Box key={i} sx={{ mb: i < filledClasses.length - 1 ? 1 : 0 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {classLines[i]}
                      </Typography>
                      {prog && (
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                          <Chip label={formatHitDie(prog)} size="small" variant="outlined" />
                          {prog.role && (
                            <Chip label={prog.role} size="small" variant="outlined" />
                          )}
                          {spellLabel && (
                            <Chip label={spellLabel} size="small" variant="outlined" />
                          )}
                          {prog.savingThrows && prog.savingThrows.length > 0 && (
                            <Chip
                              label={`Saves: ${prog.savingThrows.map(s => s.toUpperCase()).join(', ')}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      )}
                    </Box>
                  )
                })}
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">—</Typography>
            )
          }
        />

        {/* Alignment */}
        {!state.lockedFields?.has('alignment') && (
          <SummaryCard
            label="Alignment"
            stepId="alignment"
            filled={!!state.alignment}
            onEdit={goToStep}
            value={
              <Typography variant="body1" fontWeight={600}>
                {alignmentName}
              </Typography>
            }
          />
        )}

        {/* Proficiencies */}
        <SummaryCard
          label="Proficiencies"
          stepId="proficiencies"
          filled={totalProfs > 0}
          onEdit={goToStep}
          value={
            totalProfs > 0 ? (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {resolvedSkillNames.map(name => (
                  <Chip key={name} label={name} size="small" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body1" color="text.secondary">—</Typography>
            )
          }
        />

        {/* Spells */}
        <SummaryCard
          label="Spells"
          stepId="spells"
          filled={resolvedSpells.length > 0}
          onEdit={goToStep}
          value={
            resolvedSpells.length > 0 ? (
              <Box>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                  {resolvedSpells.length} spell{resolvedSpells.length !== 1 ? 's' : ''}
                </Typography>
                {[...spellsByLevel.entries()]
                  .sort(([a], [b]) => a - b)
                  .map(([level, names]) => (
                    <Box key={level} sx={{ mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        {level === 0 ? 'Cantrips' : `Level ${level}`}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
                        {names.sort().map(name => (
                          <Chip key={name} label={name} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  ))}
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">—</Typography>
            )
          }
        />

        {/* Equipment */}
        <SummaryCard
          label="Equipment"
          stepId="equipment"
          filled={equipmentCount > 0}
          onEdit={goToStep}
          value={
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body1" fontWeight={600}>
                {equipmentCount} item{equipmentCount !== 1 ? 's' : ''}
              </Typography>
              {(state.equipment?.weight ?? 0) > 0 && (
                <Chip label={`${state.equipment?.weight} lbs`} size="small" variant="outlined" />
              )}
              {(state.wealth?.gp ?? 0) > 0 && (
                <Chip label={`${state.wealth?.gp} gp remaining`} size="small" variant="outlined" color="warning" />
              )}
            </Stack>
          }
        />
      </Stack>
    </Box>
  )
}

export default ConfirmationStep
