import type { SkillProficiency, SkillProficiencyCombatUiActionId } from '@/features/content/skillProficiencies/domain/types'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { DEFAULT_HIDE_COMBAT_ACTION } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

/**
 * Maps a skill-advertised combat affordance to a {@link CombatActionDefinition}.
 * Stays in the encounter adapter layer — not on {@link SkillProficiency} content.
 *
 * TODO: Allow bonus-action cost / resource overrides when rules need it (e.g. Cunning Action).
 * TODO: Attach hide-eligibility disabled reasons from encounter state without encoding layout in skill data.
 * TODO: Grid-based hide (cell/object selection) should extend this builder’s output, not `SkillProficiency`.
 */
export function buildCombatActionForSkillAffordance(
  actionId: SkillProficiencyCombatUiActionId,
): CombatActionDefinition | undefined {
  if (actionId === 'hide') {
    return {
      ...DEFAULT_HIDE_COMBAT_ACTION,
      id: 'hide',
    }
  }
  return undefined
}

/**
 * Emits combat actions for skills the combatant is proficient in when the skill opts into {@link SkillProficiencyCombatUi}.
 */
export function buildSkillAffordanceCombatActions(args: {
  proficientSkillIds: readonly string[]
  skillProficienciesById: Record<string, SkillProficiency>
}): CombatActionDefinition[] {
  const out: CombatActionDefinition[] = []
  const seen = new Set<string>()
  for (const skillId of args.proficientSkillIds) {
    const skill = args.skillProficienciesById[skillId]
    const ui = skill?.combatUi
    if (!ui) continue
    const def = buildCombatActionForSkillAffordance(ui.actionId)
    if (!def || seen.has(def.id)) continue
    seen.add(def.id)
    out.push(def)
  }
  return out
}
