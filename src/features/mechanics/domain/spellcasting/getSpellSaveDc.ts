/**
 * 5e spell save DC: 8 + proficiency bonus + spellcasting ability modifier.
 */
export function getSpellSaveDc(proficiencyBonus: number, abilityModifier: number): number {
  return 8 + proficiencyBonus + abilityModifier
}
