type LoreBase = {
  alignment?: string
  xpValue?: number
}

export interface LoreClassicDnD extends LoreBase {
  numberAppearing?: { wandering: string; lair: string } // dice expressions
  treasureType?: string
  intelligence?: string
}