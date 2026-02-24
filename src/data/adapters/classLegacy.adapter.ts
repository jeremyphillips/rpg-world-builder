import type { CharacterClass } from "@/data/classes/types"

export function adaptClassCoreToLegacyClass(c: CharacterClass) {
  return {
    id: c.id,
    name: c.name,
    definitions: c.definitions ? [{ edition: '5e', ...c.definitions }] : [],
    proficiencies: c.proficiencies ? [{ edition: '5e', ...c.proficiencies }] : [],
    requirements: c.requirements ? [{ edition: '5e', ...c.requirements }] : [],
    progression: c.progression ? [{ edition: '5e', ...c.progression }] : [],
  };
}