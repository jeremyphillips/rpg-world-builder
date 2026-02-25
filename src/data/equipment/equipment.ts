import { armor } from './armor'
import { weapons } from './weapons'
import { gear } from './gear'
import { magicItems } from './magicItems'
import { enhancementTemplates } from './enchantments'

export const equipment = {
  armor: armor,
  weapons: weapons,
  gear: gear,
  magicItems: magicItems,
  enchantments: { enhancementTemplates },
} as const