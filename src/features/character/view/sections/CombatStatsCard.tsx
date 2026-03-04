import { useState } from 'react'
import type { CharacterDoc, CharacterClassInfo } from '@/shared'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { getClassProgression } from '@/features/mechanics/domain/classes/progression'
import type { ClassProgression } from '@/data/classes.types'
import { useCombatStats } from '@/features/character/hooks'
import type { LoadoutOption } from '@/features/character/domain/engine/getLoadoutPickerOptions'
import type { WeaponPickerOption } from '@/features/character/domain/engine/getWeaponPickerOptions'
import type { AttackEntry } from '@/features/character/hooks/useCombatStats'
import { formatBreakdown } from '@/features/mechanics/domain/resolution/stat-resolver'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { StatShield } from '@/ui/primitives'
import Divider from '@mui/material/Divider'
import type { BreakdownToken } from '@/features/mechanics/domain/resolution/stat-resolver'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAbilityContributions(breakdown: BreakdownToken[]): string {
  return breakdown
    .filter(t => t.type === 'ability')
    .map(t => `${t.value} ${t.label}`)
    .join('  ')
}

function formatHitDie(prog: ClassProgression): string {
  if (prog.hitDie === 0 && prog.hpPerLevel) return `${prog.hpPerLevel} HP/level`
  return `d${prog.hitDie}`
}

function formatSpellcasting(prog: ClassProgression): string | null {
  if (!prog.spellcasting || prog.spellcasting === 'none') return null
  const labels: Record<string, string> = {
    full: 'Full caster', half: 'Half caster', third: 'Third caster', pact: 'Pact magic',
  }
  return labels[prog.spellcasting] ?? prog.spellcasting
}

function formatAttackProg(prog: ClassProgression): string {
  return prog.attackProgression.charAt(0).toUpperCase() + prog.attackProgression.slice(1)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CombatStatsCardProps = {
  character: CharacterDoc
  filledClasses: CharacterClassInfo[]
  isMulticlass: boolean
  canEditAll: boolean
  race: string
  alignment: string
  raceOptions: { id: string; label: string }[]
  alignmentOptions: { id: string; label: string }[]
  canEdit?: boolean
  onSave: (partial: Record<string, unknown>) => Promise<void>
}

export default function CombatStatsCard({
  character,
  filledClasses,
  isMulticlass,
  canEdit = false,
  onSave,
}: CombatStatsCardProps) {
  const {
    calculatedArmorClass, loadoutOptions, activeOption, activeLoadout,
    attacks, maxHp, initiative, weaponOptions, wieldedWeaponIds,
  } = useCombatStats(character)
  const { catalog } = useCampaignRules()
  const [configOpen, setConfigOpen] = useState(false)
  const [weaponPickerOpen, setWeaponPickerOpen] = useState(false)

  const getClassName = (classId?: string): string => {
    if (!classId) return 'Unknown'
    return catalog.classesById[classId]?.name ?? classId
  }

  const hasCombat = true
  const hasMultipleConfigs = loadoutOptions.length > 1
  const hasMultipleWeapons = weaponOptions.length > 1

  const handleLoadoutChange = async (index: string) => {
    const option = loadoutOptions[Number(index)]
    if (!option) return
    await onSave({ combat: { loadout: option.loadout } })
    setConfigOpen(false)
  }

  const handleWeaponChange = async (slot: 'mainHandWeaponId' | 'offHandWeaponId', weaponId: string) => {
    const value = weaponId === '' ? undefined : weaponId
    const newLoadout = { ...activeLoadout, [slot]: value }
    await onSave({ combat: { loadout: newLoadout } })
  }

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Combat
        </Typography>

        {hasCombat ? (
          <Stack direction="row" spacing={3} sx={{ mt: 0.5, mb: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <StatShield
                label="AC"
                value={calculatedArmorClass.value}
              />

              {activeOption && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                  {activeOption.label}
                  {(() => {
                    const abilities = formatAbilityContributions(activeOption.breakdown)
                    return abilities ? `  ${abilities}` : ''
                  })()}
                </Typography>
              )}

              {canEdit && hasMultipleConfigs && (
                <Link
                  component="button"
                  variant="caption"
                  onClick={() => setConfigOpen(prev => !prev)}
                  sx={{ fontSize: '0.65rem' }}
                >
                  {configOpen ? 'Hide' : 'Change'}
                </Link>
              )}

              {!hasMultipleConfigs && calculatedArmorClass && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                  {formatBreakdown(calculatedArmorClass.breakdown)}
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {character.hitPoints?.total ?? '—'}{maxHp > 0 ? ` / ${maxHp}` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">HP</Typography>
              {character.hitPoints?.generationMethod && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                  {character.hitPoints.generationMethod}
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {initiative >= 0 ? `+${initiative}` : initiative}
              </Typography>
              <Typography variant="caption" color="text.secondary">Init</Typography>
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>—</Typography>
        )}

        {/* Armor configuration selector */}
        <Collapse in={configOpen}>
          <Box sx={{ mb: 2, px: 0.5 }}>
            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              Equipment Loadout
            </Typography>
            <RadioGroup
              value={String(loadoutOptions.indexOf(activeOption!))}
              onChange={(_, val) => handleLoadoutChange(val)}
            >
              {loadoutOptions.map((option: LoadoutOption, idx: number) => {
                const abilities = formatAbilityContributions(option.breakdown)
                return (
                  <FormControlLabel
                    key={idx}
                    value={String(idx)}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        <strong>{option.totalAC}</strong>
                        {':  '}
                        {option.label}
                        {abilities && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {'  '}{abilities}
                          </Typography>
                        )}
                      </Typography>
                    }
                    sx={{ ml: 0, mr: 0, '.MuiFormControlLabel-label': { ml: 0.5 } }}
                  />
                )
              })}
            </RadioGroup>
          </Box>
        </Collapse>

        {/* Class quick stats */}
        {filledClasses.map((cls, i) => {
          const prog = getClassProgression(cls.classId)
          if (!prog) return null
          const spellLabel = formatSpellcasting(prog)
          return (
            <Box key={i} sx={{ mb: i < filledClasses.length - 1 ? 1.5 : 0 }}>
              {isMulticlass && (
                <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                  {getClassName(cls.classId)} {cls.level}
                </Typography>
              )}
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                <Chip label={`Hit Die: ${formatHitDie(prog)}`} size="small" variant="outlined" />
                <Chip label={`Attack: ${formatAttackProg(prog)}`} size="small" variant="outlined" />
                {prog.savingThrows && prog.savingThrows.length > 0 && (
                  <Chip label={`Saves: ${prog.savingThrows.map(s => s.toUpperCase()).join(', ')}`} size="small" variant="outlined" />
                )}
                {spellLabel && <Chip label={spellLabel} size="small" variant="outlined" />}
                {prog.role && (
                  <Chip label={`${prog.role}${prog.powerSource ? ` (${prog.powerSource})` : ''}`} size="small" variant="outlined" />
                )}
              </Stack>
            </Box>
          )
        })}

        <Divider sx={{ my: 3 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Attacks
          </Typography>
          {canEdit && hasMultipleWeapons && (
            <Link
              component="button"
              variant="caption"
              onClick={() => setWeaponPickerOpen(prev => !prev)}
              sx={{ fontSize: '0.65rem' }}
            >
              {weaponPickerOpen ? 'Hide' : 'Wield'}
            </Link>
          )}
        </Stack>

        <Collapse in={weaponPickerOpen}>
          <Box sx={{ mb: 2, px: 0.5 }}>
            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              Main Hand
            </Typography>
            <Select
              size="small"
              fullWidth
              value={wieldedWeaponIds[0] ?? ''}
              onChange={(e) => handleWeaponChange('mainHandWeaponId', e.target.value)}
              sx={{ fontSize: '0.8rem', mb: 1 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {weaponOptions.map((w: WeaponPickerOption) => (
                <MenuItem key={w.weaponId} value={w.weaponId}>{w.name}</MenuItem>
              ))}
            </Select>

            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              Off Hand
            </Typography>
            <Select
              size="small"
              fullWidth
              value={wieldedWeaponIds[1] ?? ''}
              onChange={(e) => handleWeaponChange('offHandWeaponId', e.target.value)}
              sx={{ fontSize: '0.8rem' }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {weaponOptions.map((w: WeaponPickerOption) => (
                <MenuItem key={w.weaponId} value={w.weaponId}>{w.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </Collapse>

        {attacks.length > 0 ? (
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 0.5, '& td, & th': { py: 0.5, px: 0.75, textAlign: 'left' } }}>
            <thead>
              <tr>
                <Box component="th"><Typography variant="caption" fontWeight={600}>Weapon</Typography></Box>
                <Box component="th"><Typography variant="caption" fontWeight={600}>Atk</Typography></Box>
                <Box component="th"><Typography variant="caption" fontWeight={600}>Damage</Typography></Box>
              </tr>
            </thead>
            <tbody>
              {attacks.map((atk: AttackEntry) => (
                <tr key={atk.weaponId}>
                  <Box component="td"><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{atk.name}</Typography></Box>
                  <Box component="td">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        {atk.attackBonus >= 0 ? `+${atk.attackBonus}` : atk.attackBonus}
                      </Typography>
                      <Tooltip title={formatBreakdown(atk.attackBreakdown)} arrow placement="top">
                        <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                      </Tooltip>
                    </Stack>
                  </Box>
                  <Box component="td">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {atk.damage}{atk.damageType ? ` ${atk.damageType}` : ''}
                      </Typography>
                      {atk.damageBreakdown.length > 1 && (
                        <Tooltip title={formatBreakdown(atk.damageBreakdown)} arrow placement="top">
                          <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                </tr>
              ))}
            </tbody>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
            No weapons wielded.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
