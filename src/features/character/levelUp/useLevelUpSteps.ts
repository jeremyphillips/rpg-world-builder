// features/levelUp/useLevelUpSteps.ts
//
// Determines which wizard steps are needed for a specific level-up,
// based on the character's class progression data.

import { useMemo } from 'react'
import type { LevelUpStepConfig, LevelUpState } from './levelUp.types'
import { 
  getClassSpellLimitsAtLevel, 
  getClassProgression, 
  getSubclassUnlockLevel 
} from '@/features/mechanics/domain/progression'

/**
 * Returns the ordered list of level-up wizard steps required for this
 * particular advancement.
 *
 * Step logic:
 *   1. **subclass** — only if the *new* class level matches the subclass
 *      unlock level AND the character doesn't already have one selected.
 *   2. **hitPoints** — always present (every level grants HP).
 *   3. **spells** — only if the class is a spellcaster AND the new level
 *      grants additional spells known or cantrips (known-caster model).
 *   4. **features** — always present (read-only summary of new class features).
 *   5. **confirm** — always present.
 */
export function useLevelUpSteps(state: LevelUpState): LevelUpStepConfig[] {
  const { classes, pendingLevel, primaryClassId } = state

  return useMemo(() => {
    const steps: LevelUpStepConfig[] = []

    const primaryClass = classes.find(c => c.classId === primaryClassId)
    if (!primaryClass) return [{ id: 'confirm', label: 'Confirm' }]

    const oldClassLevel = primaryClass.level
    const newClassLevel = oldClassLevel + (pendingLevel - (state.currentLevel))

    // ── Subclass ──────────────────────────────────────────────────────
    const unlockLevel = getSubclassUnlockLevel(primaryClassId)
    if (
      unlockLevel &&
      newClassLevel >= unlockLevel &&
      !primaryClass.subclassId
    ) {
      steps.push({ id: 'subclass', label: 'Subclass' })
    }

    // ── Hit Points ────────────────────────────────────────────────────
    steps.push({ id: 'hitPoints', label: 'Hit Points' })

    // ── Spells ────────────────────────────────────────────────────────
    const prog = getClassProgression(primaryClassId)
    if (prog?.spellProgression) {
      const oldLimits = getClassSpellLimitsAtLevel(prog, oldClassLevel)
      const newLimits = getClassSpellLimitsAtLevel(prog, newClassLevel)

      const gainsSpells =
        newLimits.totalKnown > oldLimits.totalKnown ||
        newLimits.cantrips > oldLimits.cantrips ||
        newLimits.maxSpellLevel > oldLimits.maxSpellLevel

      if (gainsSpells) {
        steps.push({ id: 'spells', label: 'Spells' })
      }
    }

    // ── Features (always shown) ───────────────────────────────────────
    steps.push({ id: 'features', label: 'New Features' })

    // ── Confirm (always shown) ────────────────────────────────────────
    steps.push({ id: 'confirm', label: 'Confirm' })

    return steps
  }, [classes, pendingLevel, primaryClassId, state.currentLevel])
}
