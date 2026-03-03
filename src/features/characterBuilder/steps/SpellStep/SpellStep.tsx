import { useMemo, useCallback } from 'react'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import type { Spell } from '@/features/content/domain/types/spell.types'
import { SpellHorizontalCard } from '@/features/spell/cards'
import { InvalidationNotice } from '@/features/characterBuilder/components'
import {
  buildSpellSelectionModel,
  isSpellLevelFull,
  toggleSpellSelection,
} from '@/features/mechanics/domain/spells/selection'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelHeading(level: number): string {
  if (level === 0) return 'Cantrips'
  return `${level}${level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'} Level`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SpellStep = () => {
  const { state, setSpells, stepNotices, dismissNotice } = useCharacterBuilder()
  const { catalog } = useCampaignRules()
  const { classes: selectedClasses, spells: selectedSpells = [], step } = state

  const notices = stepNotices.get('spells') ?? []

  const model = useMemo(
    () => buildSpellSelectionModel(
      { classes: selectedClasses, spells: selectedSpells },
      catalog.classesById,
      catalog.spellsById,
    ),
    [selectedClasses, selectedSpells, catalog.classesById, catalog.spellsById]
  )

  const { availableByLevel, limits, selectedPerLevel, totalSelectedLeveled } = model
  const { perLevelMax, maxSpellLevel, totalKnown } = limits

  const toggleSpell = useCallback(
    (spellId: string, spellLevel: number) => {
      const result = toggleSpellSelection(selectedSpells, model, spellId, spellLevel)
      if (result.changed) setSpells(result.spells)
    },
    [selectedSpells, model, setSpells]
  )

  if (availableByLevel.size === 0) {
    return (
      <div>
        <h2>{step.name}</h2>
        <Typography variant="body2" color="text.secondary">
          No spells available for the selected class.
        </Typography>
      </div>
    )
  }

  const classNames = selectedClasses
    .filter((c: { classId?: string }) => c.classId)
    .map((c: { classId?: string }) => {
      const cls = c.classId ? catalog.classesById[c.classId] : undefined
      return cls?.name ?? c.classId
    })
    .join(' / ')

  return (
    <div>
      <h2>Choose {step.name}</h2>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Select spells for <strong>{classNames}</strong>.
      </Typography>

      <InvalidationNotice items={notices} onDismiss={() => dismissNotice('spells')} />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        {[...perLevelMax.entries()]
          .sort(([a], [b]) => a - b)
          .filter(([level]) =>
            level === 0
              ? (perLevelMax.get(0) ?? 0) > 0
              : level <= maxSpellLevel
          )
          .map(([level, max]) => {
            const count = selectedPerLevel.get(level) ?? 0
            const full = count >= max
            return (
              <Chip
                key={level}
                label={`${levelHeading(level)}: ${count} / ${max}`}
                size="small"
                color={full ? 'success' : 'default'}
                variant="outlined"
              />
            )
          })}
        {totalKnown > 0 && (
          <Chip
            label={`Total Known: ${totalSelectedLeveled} / ${totalKnown}`}
            size="small"
            color={totalSelectedLeveled >= totalKnown ? 'success' : 'default'}
            variant="outlined"
          />
        )}
      </Stack>

      {[...availableByLevel.entries()]
        .filter(([level]) => level === 0
          ? (perLevelMax.get(0) ?? 0) > 0
          : level <= maxSpellLevel
        )
        .map(([level, spells]: [number, Spell[]]) => {
        const levelFull = isSpellLevelFull(model, level)

        return (
          <Box key={level} sx={{ mb: 3 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              {levelHeading(level)}
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({spells.length} available)
              </Typography>
            </Typography>

            <Stack spacing={1}>
              {spells
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((spell) => {
                  const isSelected = selectedSpells.includes(spell.id)
                  return (
                    <SpellHorizontalCard
                      key={spell.id}
                      spell={spell}
                      selected={isSelected}
                      disabled={levelFull && !isSelected}
                      onToggle={() => toggleSpell(spell.id, level)}
                    />
                  )
                })}
            </Stack>
          </Box>
        )
      })}
    </div>
  )
}

export default SpellStep
