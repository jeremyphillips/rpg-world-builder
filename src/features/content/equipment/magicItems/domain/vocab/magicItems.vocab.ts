export const MAGIC_ITEM_SLOT_OPTIONS = [
  { id: 'weapon', name: 'Weapon' },
  { id: 'armor', name: 'Armor' },
  { id: 'shield', name: 'Shield' },
  { id: 'potion', name: 'Potion' },
  { id: 'ring', name: 'Ring' },
  { id: 'cloak', name: 'Cloak' },
  { id: 'boots', name: 'Boots' },
  { id: 'gloves', name: 'Gloves' },
  { id: 'helm', name: 'Helm' },
  { id: 'belt', name: 'Belt' },
  { id: 'amulet', name: 'Amulet' },
  { id: 'wand', name: 'Wand' },
  { id: 'staff', name: 'Staff' },
  { id: 'rod', name: 'Rod' },
  { id: 'scroll', name: 'Scroll' },
  { id: 'wondrous', name: 'Wondrous' },
] as const;

export type MagicItemSlot = (typeof MAGIC_ITEM_SLOT_OPTIONS)[number]['id'];

export const MAGIC_ITEM_RARITY_OPTIONS = [
  { id: 'common', name: 'Common' },
  { id: 'uncommon', name: 'Uncommon' },
  { id: 'rare', name: 'Rare' },
  { id: 'very-rare', name: 'Very Rare' },
  { id: 'legendary', name: 'Legendary' },
  { id: 'artifact', name: 'Artifact' },
] as const;

export type MagicItemRarity = (typeof MAGIC_ITEM_RARITY_OPTIONS)[number]['id'];
