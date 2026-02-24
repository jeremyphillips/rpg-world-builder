import { armorCore } from './armorCore'
import { weaponsCore } from './weaponsCore'
import { gearCore } from './gearCore'
import { magicItemsCore } from './magicItemsCore'

export const equipmentCore = {
  armor: armorCore,
  weapons: weaponsCore,
  gear: gearCore,
  magicItems: magicItemsCore,
} as const