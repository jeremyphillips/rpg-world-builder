import type { MagicItemRarity } from '../equipment/magicItems.types'
import type { AbilityScores } from '@/shared/types/character.core'

export interface LevelProgression {
  level: number
  xpRequired: number
}

export type EditionId = 
  '5e' | '4e' | '3.5e' | '3e' | '2e' | '1e' | 'becmi' | 'bx' | 'b' | 'odd'

export interface EditionProficiency {
  name: string
  ability: keyof AbilityScores
  /** 5e skill description. */
  description?: string
  /** 2e ability-check modifier applied when using the proficiency. */
  checkModifier?: number
  /** 2e slot cost to acquire the proficiency. */
  baseCost?: number
}

export interface Edition {
  id: EditionId
  name: string
  settings: string[]
  alignments: AlignmentList
  readonly races: readonly string[]
  classes: string[]
  progression: {
    maxLevel?: number
    /**
     * Universal XP table — one progression shared by all classes.
     * Used by 3e, 3.5e, 4e, 5e where every class advances at the same rate.
     */
    experience?: LevelProgression[]
    /**
     * Class-specific XP tables — keyed by canonical class ID.
     *
     * Pre-3e editions (OD&D, Basic, 1e, 2e) have different XP requirements
     * per class.  For example in 2e a Fighter needs 2,000 XP for level 2
     * while a Thief needs only 1,250 XP.
     *
     * Keys use post-alias canonical IDs (e.g. "fighter" not "fighting-man",
     * "wizard" not "magic-user").  The lookup function in xp.ts resolves
     * aliases before checking this map.
     *
     * When both `experience` and `classExperience` exist, class-specific
     * takes priority — `experience` serves as the fallback for any class
     * not explicitly listed.
     */
    classExperience?: Record<string, LevelProgression[]>
  }
  /**
   * Multiclassing rules for this edition.
   *
   * When omitted, multiclassing is NOT allowed (safe default for Basic-era
   * editions where it doesn't exist).
   */
  multiclassing?: {
    /** Whether this edition supports multiclassing at all. */
    allowed: boolean
    /**
     * Maximum number of classes a character can hold simultaneously.
     * Omit or leave undefined for no hard cap (e.g. 5e, 3e).
     *
     * Examples:
     *   - 2e: 2–3 (depends on race — human dual-class is unlimited but
     *     demihumans are capped at 2–3 fixed combos)
     *   - 4e: 2 (primary + hybrid/paragon multiclass)
     */
    maxClasses?: number
  }
  proficiencies?: Partial<Record<EditionId, {
    skills: Record<string, EditionProficiency>
  }>>
  generation?: {
    abilityScoreMethod: AbilityScoreMethod
  }
  levelScaling?: {
    proficiencyBonus?: Record<number, number>
  },
  equipmentRestrictions?: {
    plateArmorMinLevel?: number
    allowMagicItemsAtCreation?: boolean
    // Add additional restriction flags as needed for 2e vs 5e logic
    enforceWeightLimit?: boolean;
  }
  /**
   * Magic item budget by character level tier.
   *
   * Defines how many (and what rarity) magic items a character should have
   * at various level ranges.  The specifics differ wildly by edition:
   *
   *   - **5e**: Rarity-gated.  Items are Common → Legendary.  Xanathar's
   *     Guide provides recommended counts per tier.
   *   - **4e**: Level-gated.  Every magic item has an explicit item level;
   *     the standard treasure parcel gives one item of level+1, one of level,
   *     one of level-1.  `magicItemBudget` captures this as tiers.
   *   - **3e/3.5e**: Wealth-gated.  No rarity system; instead, total
   *     character wealth is budgeted and items are purchased from that pool.
   *     The `maxItemValueGp` field captures the max single-item cost.
   *   - **1e/2e**: DM-distributed treasure.  No formal system — items are
   *     found via random treasure tables.  Budget is omitted.
   *   - **Basic/OD&D**: No formal magic item economy.  Omitted.
   *
   * When this field is omitted, the edition has no structured magic item
   * granting rules.
   */
  magicItemBudget?: {
    /** Maximum simultaneous attunement slots (5e: 3, others: undefined) */
    maxAttunement?: number
    tiers: {
      /** Inclusive level range, e.g. [1, 4] */
      levelRange: [number, number]
      /**
       * 5e: maximum rarity a character should possess at this tier.
       * 4e/3e: omitted (gating is by item level or GP value instead).
       */
      maxRarity?: MagicItemRarity
      /** Recommended number of permanent (non-consumable) magic items */
      permanentItems: number
      /** Recommended number of consumable items (potions, scrolls) */
      consumableItems: number
      /**
       * 3e: maximum GP value of any single magic item at this tier.
       * Derived from the Wealth By Level table.
       */
      maxItemValueGp?: number
    }[]
  }
}
