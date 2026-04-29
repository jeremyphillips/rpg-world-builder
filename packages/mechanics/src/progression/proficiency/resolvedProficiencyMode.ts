export type ResolvedProficiencyMode = 'none' | 'proficient' | 'expertise'

export function resolveProficiencyMultiplier(mode: ResolvedProficiencyMode): number {
  switch (mode) {
    case 'expertise':
      return 2
    case 'proficient':
      return 1
    default:
      return 0
  }
}

/**
 * @param proficiencyBonus Base PB from ruleset or creature.
 * @param mode Resolved tier; `undefined` and `'none'` contribute 0.
 */
export function resolveProficiencyContribution(
  proficiencyBonus: number,
  mode: ResolvedProficiencyMode | undefined,
): number {
  if (mode === undefined || mode === 'none') return 0
  return proficiencyBonus * resolveProficiencyMultiplier(mode)
}
