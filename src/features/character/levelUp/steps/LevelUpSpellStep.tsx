// features/levelUp/steps/LevelUpSpellStep.tsx
//
// Shared spell-selection UI for the level-up wizard.
// Reuses SpellHorizontalCard and spell helpers from the domain layer,
// but manages its own selection state (no dependency on the character
// builder context).

import { useMemo, useCallback } from 'react'
import { getClassProgression } from '@/features/mechanics/domain/progression'
import { groupSpellsByLevel, getClassSpellLimitsAtLevel } from '@/features/mechanics/domain/spells'
import { getAvailableSpellsByClass } from '@/features/mechanics/domain/spells/selection'
import { SpellHorizontalCard } from '@/features/spell/cards'
import type { LevelUpState } from '../levelUp.types'

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
// Props
// ---------------------------------------------------------------------------

interface LevelUpSpellStepProps {
  state: LevelUpState
  onChange: (patch: Partial<LevelUpState>) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LevelUpSpellStep({
  state,
  onChange,
}: LevelUpSpellStepProps) {
  const {
    primaryClassId,
    classes,
    currentSpells,
    newSpells,
    removedSpells,
    pendingLevel,
    currentLevel,
  } = state

  const primaryClass = classes.find(c => c.classId === primaryClassId)
  const oldClassLevel = primaryClass?.level ?? 1
  const newClassLevel = oldClassLevel + (pendingLevel - currentLevel)

  const prog = useMemo(
    () => getClassProgression(primaryClassId),
    [primaryClassId],
  )

  const oldLimits = useMemo(
    () => (prog ? getClassSpellLimitsAtLevel(prog, oldClassLevel) : null),
    [prog, oldClassLevel],
  )

  const newLimits = useMemo(
    () => (prog ? getClassSpellLimitsAtLevel(prog, newClassLevel) : null),
    [prog, newClassLevel],
  )

  const availableByLevel = useMemo(() => {
    const available = getAvailableSpellsByClass(primaryClassId)
    return groupSpellsByLevel(available)
  }, [primaryClassId])

  // Compute effective spell list: current - removed + new
  const effectiveSpells = useMemo(() => {
    const set = new Set(currentSpells)
    for (const id of removedSpells) set.delete(id)
    for (const id of newSpells) set.add(id)
    return set
  }, [currentSpells, newSpells, removedSpells])

  // Per-level limit budgets at the NEW level
  const { perLevelMax, maxSpellLevel, totalKnown } = useMemo(() => {
    if (!newLimits)
      return {
        perLevelMax: new Map<number, number>(),
        maxSpellLevel: 0,
        totalKnown: 0,
      }

    const map = new Map<number, number>()
    if (newLimits.cantrips > 0) map.set(0, newLimits.cantrips)

    for (let i = 0; i < newLimits.slotsByLevel.length; i++) {
      const spellLevel = i + 1
      if (newLimits.slotsByLevel[i] > 0) {
        map.set(spellLevel, newLimits.slotsByLevel[i])
      }
    }

    return {
      perLevelMax: map,
      maxSpellLevel: newLimits.maxSpellLevel,
      totalKnown: newLimits.totalKnown,
    }
  }, [newLimits])

  // How many new slots the player gained
  const newCantrips = (newLimits?.cantrips ?? 0) - (oldLimits?.cantrips ?? 0)
  const newKnown = (newLimits?.totalKnown ?? 0) - (oldLimits?.totalKnown ?? 0)

  // Count effective selections per level
  const selectedPerLevel = useMemo(() => {
    const map = new Map<number, number>()
    for (const [level, spells] of availableByLevel) {
      let count = 0
      for (const s of spells) {
        if (effectiveSpells.has(s.id)) count++
      }
      if (count > 0) map.set(level, count)
    }
    return map
  }, [effectiveSpells, availableByLevel])

  const totalSelected = useMemo(() => {
    let sum = 0
    for (const [level, count] of selectedPerLevel) {
      if (level !== 0) sum += count
    }
    return sum
  }, [selectedPerLevel])

  const isLevelFull = useCallback(
    (spellLevel: number) => {
      const max = perLevelMax.get(spellLevel) ?? 0
      const count = selectedPerLevel.get(spellLevel) ?? 0
      if (max > 0 && count >= max) return true
      if (spellLevel > 0 && totalKnown > 0 && totalSelected >= totalKnown)
        return true
      return false
    },
    [perLevelMax, selectedPerLevel, totalKnown, totalSelected],
  )

  const toggleSpell = useCallback(
    (spellId: string, spellLevel: number) => {
      const isCurrentlySelected = effectiveSpells.has(spellId)
      const isOriginal = currentSpells.includes(spellId)

      if (isCurrentlySelected) {
        // Deselecting
        if (isOriginal) {
          // Mark as removed
          onChange({ removedSpells: [...removedSpells, spellId] })
        } else {
          // Remove from newly added
          onChange({ newSpells: newSpells.filter(id => id !== spellId) })
        }
      } else {
        // Selecting
        if (isLevelFull(spellLevel)) return

        if (removedSpells.includes(spellId)) {
          // Re-adding a previously removed spell
          onChange({
            removedSpells: removedSpells.filter(id => id !== spellId),
          })
        } else {
          // Adding a new spell
          onChange({ newSpells: [...newSpells, spellId] })
        }
      }
    },
    [
      effectiveSpells,
      currentSpells,
      newSpells,
      removedSpells,
      isLevelFull,
      onChange,
    ],
  )

  if (availableByLevel.size === 0) {
    return (
      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Spells
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No spells available for the selected class and edition.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Spells
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {newKnown > 0 &&
          `You can learn ${newKnown} new spell${newKnown > 1 ? 's' : ''}.`}
        {newCantrips > 0 &&
          ` You gain ${newCantrips} new cantrip${newCantrips > 1 ? 's' : ''}.`}
        {newKnown === 0 &&
          newCantrips === 0 &&
          'You gain access to higher-level spell slots.'}
      </Typography>

      {/* Limits summary */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 2 }}
        flexWrap="wrap"
        useFlexGap
      >
        {[...perLevelMax.entries()]
          .sort(([a], [b]) => a - b)
          .filter(
            ([level]) =>
              level === 0
                ? (perLevelMax.get(0) ?? 0) > 0
                : level <= maxSpellLevel,
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
            label={`Total Known: ${totalSelected} / ${totalKnown}`}
            size="small"
            color={totalSelected >= totalKnown ? 'success' : 'default'}
            variant="outlined"
          />
        )}
      </Stack>

      {/* Spell list by level */}
      {[...availableByLevel.entries()]
        .filter(
          ([level]) =>
            level === 0
              ? (perLevelMax.get(0) ?? 0) > 0
              : level <= maxSpellLevel,
        )
        .map(([level, spells]) => {
          const levelFull = isLevelFull(level)

          return (
            <Box key={level} sx={{ mb: 3 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                {levelHeading(level)}
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  ({spells.length} available)
                </Typography>
              </Typography>

              <Stack spacing={1}>
                {spells
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((spell) => {
                    const isSelected = effectiveSpells.has(spell.id)
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
    </Box>
  )
}
