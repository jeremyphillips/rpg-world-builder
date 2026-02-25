import type { EditionId } from '@/data'

/** Base for all per-edition equipment data (every entry has edition + cost) */
export interface EquipmentEditionDatumBase {
  edition: EditionId
  cost: string
}

/** Base for all equipment items (gear, armor, weapons): id, name, weight, editionData */
export interface EquipmentItemBase<TEditionDatum extends EquipmentEditionDatumBase> {
  id: string
  name: string
  weight: string
  editionData: TEditionDatum[]
}
