import { useCharacterBuilder } from '../../context'
import { editions, settings, races, classes } from '@/data'
import { standardAlignments, fourEAlignments, basicAlignments } from '@/data/alignments'
import { spells as spellCatalog } from '@/data/classes/spells'
import { getNameById } from '@/domain/lookups'
import { getClassProgression } from '@/features/mechanics/domain/progression'
import type { ClassProgression } from '@/data/classes/types'
import type { EditionProficiency } from '@/data/types'
import type { StepId } from '../../types'

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
// Helpers
// ---------------------------------------------------------------------------

function getAlignmentName(alignmentId: string | undefined): string {
  if (!alignmentId) return '—'

  const allAlignments = [...standardAlignments, ...fourEAlignments, ...basicAlignments]
  const found = allAlignments.find((a) => a.id === alignmentId)
  return found?.name ?? alignmentId
}

function getClassLine(
  cls: { classId?: string; classDefinitionId?: string; level: number },
  allClasses: typeof classes,
  isPrimary: boolean,
  isMulticlass: boolean,
  edition?: string,
): string {
  const classData = allClasses.find((c) => c.id === cls.classId)
  const name = (edition && classData?.displayNameByEdition?.[edition]) ?? classData?.name ?? cls.classId ?? 'Unknown'

  let subclassName = ''
  if (cls.classDefinitionId && classData) {
    for (const def of classData.definitions) {
      const opt = def.options.find((o) => o.id === cls.classDefinitionId)
      if (opt) { subclassName = opt.name; break }
    }
  }

  let line = name
  if (subclassName) line += `, ${subclassName}`
  line += ` (Lvl ${cls.level})`
  if (isPrimary && isMulticlass) line += ' (primary)'

  return line
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

  const editionName = getNameById(editions as unknown as { id: string; name: string }[], state.edition) ?? state.edition ?? '—'
  const settingName = getNameById(settings as unknown as { id: string; name: string }[], state.setting) ?? state.setting ?? 'None'
  const raceName = getNameById(races as unknown as { id: string; name: string }[], state.race) ?? state.race ?? '—'
  const alignmentName = getAlignmentName(state.alignment)

  const filledClasses = state.classes.filter((cls) => cls.classId)
  const isMulticlass = filledClasses.length > 1
  const classLines = filledClasses.map((cls, i) =>
    getClassLine(cls, classes, i === 0, isMulticlass, state.edition),
  )

  const equipmentCount =
    (state.equipment?.weapons?.length ?? 0) +
    (state.equipment?.armor?.length ?? 0) +
    (state.equipment?.gear?.length ?? 0)

  // Resolve selected skill IDs to display names via edition catalogue
  const selectedSkillIds = state.proficiencies?.skills ?? []
  const editionObj = editions.find(e => e.id === state.edition)
  const editionSkillMap: Record<string, EditionProficiency> =
    (editionObj?.proficiencies as any)?.[state.edition ?? '']?.skills ?? {}
  const resolvedSkillNames = selectedSkillIds.map(
    id => editionSkillMap[id]?.name ?? id,
  )
  const totalProfs = selectedSkillIds.length

  // Resolve selected spell IDs to name + level for the summary card
  const selectedSpells = state.spells ?? []
  const resolvedSpells = selectedSpells
    .map((id) => {
      const spell = spellCatalog.find((s) => s.id === id)
      if (!spell) return null
      const entry = spell.editions.find((e) => e.edition === state.edition)
      return entry ? { name: spell.name, level: entry.level } : null
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
          placeholder="Optional — will be generate"
          value={state.name ?? ''}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 0.5 }}
        />
  

        {/* Edition */}
        {!state.lockedFields?.has('edition') && (
          <SummaryCard
            label="Edition"
            stepId="edition"
            filled={!!state.edition}
            onEdit={goToStep}
            value={
              <Typography variant="body1" fontWeight={600}>
                {editionName}
              </Typography>
            }
          />
        )}

        {/* Setting */}
        {!state.lockedFields?.has('setting') && (
          <SummaryCard
            label="Setting"
            stepId="setting"
            filled={!!state.setting}
            onEdit={goToStep}
            value={
              <Typography variant="body1" fontWeight={600}>
                {settingName}
              </Typography>
            }
          />
        )}

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
                  const prog = getClassProgression(cls.classId, state.edition)
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
                              label={`Saves: ${prog.savingThrows.map((s) => s.toUpperCase()).join(', ')}`}
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
                {resolvedSkillNames.map((name) => (
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
                        {names.sort().map((name) => (
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
