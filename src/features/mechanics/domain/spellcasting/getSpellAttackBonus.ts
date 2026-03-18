/**
 * 5e spell attack bonus: proficiency bonus + spellcasting ability modifier.
 */
export function getSpellAttackBonus(proficiencyBonus: number, abilityModifier: number): number {
  return proficiencyBonus + abilityModifier
}
