import type { EquipmentEditionDatumBase, EquipmentItemBase } from './equipment.types'

// ─── Rarity ──────────────────────────────────────────────────────────────────
/**
 * Magic-item rarity tier.
 *
 * 5e (2014 & 2024) and 3e/3.5e both use a rarity concept, though the labels
 * were formalised in 5e.  For earlier editions we map approximate power levels
 * to these buckets so the UI can present a unified filter.
 */
export type MagicItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very-rare'
  | 'legendary'
  | 'artifact'

// ─── Slot ────────────────────────────────────────────────────────────────────
/** Body slot or item type the magic item occupies. */
export type MagicItemSlot =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'ring'
  | 'cloak'
  | 'boots'
  | 'gloves'
  | 'helm'
  | 'belt'
  | 'amulet'
  | 'wondrous'
  | 'potion'
  | 'scroll'
  | 'wand'
  | 'staff'
  | 'rod'

// ─── Effect descriptors ─────────────────────────────────────────────────────
/**
 * Structured, machine-readable description of a magic item's mechanical
 * effect.  Intended to replace the free-text `effect` string over time.
 *
 * Engine code does NOT consume these yet — they exist to prepare the data
 * model for gradual migration.
 */
export type EffectDescriptor =
  | { kind: 'bonus'; target: 'armor_class' | 'attack' | 'damage'; value: number }
  | { kind: 'stat_bonus'; stat: string; value: number }
  | { kind: 'grant'; grantType: string; value: unknown }
  | { kind: 'custom'; id: string; params?: Record<string, unknown> }

// ─── Edition-specific data ───────────────────────────────────────────────────
/** Per-edition stats for a magic item. */
export interface MagicItemEditionDatum extends EquipmentEditionDatumBase {
  // ——— Universal ———
  rarity?: MagicItemRarity
  /** true, false, or a string condition like "by a spellcaster" */
  requiresAttunement?: boolean | string
  charges?: number
  /** How the item recharges, e.g. "1d6+1 at dawn" */
  recharges?: string
  /** Enhancement bonus (+1, +2, +3) for weapons / armor / shields */
  bonus?: number
  properties?: string[]
  /** Brief mechanical description of the item's effect */
  effect?: string
  /** Structured effect descriptors (future replacement for `effect`). */
  effects?: EffectDescriptor[]

  // ——— 1e / 2e ———
  /** XP value for identifying / possessing the item */
  xpValue?: number
  /** GP sale value */
  gpValue?: number

  // ——— 4e ———
  /**
   * 4e item level (1-30).  In 4th Edition every magic item has an explicit
   * level that gates when a character can acquire / use it.  The standard
   * treasure parcel gives one item of level+1, one of level, and one of
   * level-1.  The domain logic uses this field to filter the item picker in
   * 4e — a character cannot equip an item whose enhancementLevel exceeds
   * their own level.
   *
   * For non-4e editions this field is omitted; gating is handled by rarity
   * (5e) or cost (3e).
   */
  enhancementLevel?: number
}

// ─── Top-level item ──────────────────────────────────────────────────────────
export interface MagicItem extends EquipmentItemBase<MagicItemEditionDatum> {
  slot: MagicItemSlot

  /**
   * If the magic item is a variant of a mundane item, this links to its
   * base equipment ID.  For example a "+1 Longsword" would have
   * `baseItemId: 'longsword'`.  Lets the UI inherit properties like
   * damage dice, weight, and damage type from the mundane version.
   */
  baseItemId?: string

  /** Consumable items (potions, scrolls) are destroyed on use. */
  consumable?: boolean

  /**
   * TODO: Support item quantities.
   *
   * Consumable items like potions and scrolls should eventually be
   * quantity-tracked in the builder (e.g. "3× Potion of Healing").
   * For now we treat every selection as a single instance.  When
   * implementing, consider:
   *   - A `quantity` field on the character's equipment state
   *   - Budget deduction per unit
   *   - Weight multiplied by quantity
   */
}
