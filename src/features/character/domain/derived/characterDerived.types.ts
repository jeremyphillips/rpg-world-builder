import type { CharacterClass } from '@/features/content/classes/domain/types'
import type { Race } from '@/features/content/races/domain/types'
import type { CreatureSenses } from '@/features/content/shared/domain/vocab/creatureSenses.types'
import type { EquipmentProficiency } from '@/features/mechanics/domain/proficiencies/proficiency-adapters'
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types'

import type { CharacterQueryContext } from '@/features/character/domain/query/characterQueryContext.types'
import type { CharacterQuerySource } from '@/features/character/domain/query/buildCharacterQueryContext'

/**
 * Sheet-oriented read model: effective proficiencies and other resolved facts
 * that need class definitions or interpretation (not persisted id sets alone).
 *
 * Phase 1A: proficiencies only. Class-document `proficiencies.weapons` / `armor` / `tools`
 * are merged per {@link buildCharacterDerivedContext}. Subclass **feature JSON** may
 * grant additional proficiencies via Effects; that path is not merged here yet
 * (see engine `collectClassEffects`).
 *
 * Phase 1B: {@link CharacterDerivedContext.senses} — race-granted creature senses (e.g. darkvision);
 * class/item/effect merges can extend the same shape later.
 */
export type CharacterDerivedContext = {
  senses: CreatureSenses
  proficiencies: {
    base: {
      skillIds: ReadonlySet<string>
      weapon: EquipmentProficiency
      armor: EquipmentProficiency
      toolIds: ReadonlySet<string>
    }
    granted: {
      weapon: EquipmentProficiency
      armor: EquipmentProficiency
      toolIds: ReadonlySet<string>
      skillIds: ReadonlySet<string>
    }
    effective: {
      weapon: EquipmentProficiency
      armor: EquipmentProficiency
      toolIds: ReadonlySet<string>
      skillIds: ReadonlySet<string>
    }
  }
}

export type BuildCharacterDerivedContextArgs = {
  character: CharacterQuerySource
  query: CharacterQueryContext
  catalogs?: {
    classesById?: ReadonlyMap<string, CharacterClass>
    racesById?: Readonly<Record<string, Race>>
  }
  rulesetId?: SystemRulesetId
}
