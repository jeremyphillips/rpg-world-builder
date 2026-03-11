export const MAGIC_ITEM_SLOT_OPTIONS = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'shield', label: 'Shield' },
  { value: 'potion', label: 'Potion' },
  { value: 'ring', label: 'Ring' },
  { value: 'cloak', label: 'Cloak' },
  { value: 'boots', label: 'Boots' },
  { value: 'gloves', label: 'Gloves' },
  { value: 'helm', label: 'Helm' },
  { value: 'belt', label: 'Belt' },
  { value: 'amulet', label: 'Amulet' },
  { value: 'wand', label: 'Wand' },
  { value: 'staff', label: 'Staff' },
  { value: 'rod', label: 'Rod' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'wondrous', label: 'Wondrous' },
] as const;

export type MagicItemSlot = (typeof MAGIC_ITEM_SLOT_OPTIONS)[number]['value'];

export const MAGIC_ITEM_RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'very-rare', label: 'Very Rare' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'artifact', label: 'Artifact' },
] as const;

export type MagicItemRarity = (typeof MAGIC_ITEM_RARITY_OPTIONS)[number]['value'];
