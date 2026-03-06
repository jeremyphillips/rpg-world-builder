// features/levelUp/levelUp.types.ts
//
// Types for the level-up wizard — a lightweight flow separate from the
// full character builder, focused on incremental level advancement.

import type { CharacterClassInfo } from '@/features/character/domain/types'
import type { ClassId } from '@/shared/types/ruleset'
import type { Spell } from '@/features/content/shared/domain/types'

// ---------------------------------------------------------------------------
// Wizard state
// ---------------------------------------------------------------------------

/**
 * Working state for the level-up wizard.
 *
 * Pre-populated from the CharacterDoc when the wizard opens, then mutated
 * as the user makes choices.  On confirmation the delta is merged back
 * into the character document.
 */
export interface LevelUpState {
  // ── Identity (read-only during wizard) ──────────────────────────────
  characterName: string
  currentLevel: number
  pendingLevel: number
  classes: CharacterClassInfo[]
  /** ID of the primary class gaining the level */
  primaryClassId: ClassId
  /** Current spell IDs on the character */
  currentSpells: string[]

  // ── Choices ─────────────────────────────────────────────────────────
  /** HP gained this level (rolled or average) */
  hpGained: number | null
  /** Method used to determine HP: 'average' | 'rolled' */
  hpMethod: 'average' | 'rolled' | null
  /** Newly-selected spell IDs (additive on top of currentSpells) */
  newSpells: string[]
  /** Spell IDs the user chose to swap out (known casters only) */
  removedSpells: string[]
  /** Subclass chosen (if unlock level reached this advancement) */
  subclassId: string | null
  // ASI / feat choices — placeholder for future implementation
  asiChoices: null
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export type LevelUpStepId =
  | 'subclass'
  | 'hitPoints'
  | 'spells'
  | 'features'
  | 'confirm'

export interface LevelUpStepConfig {
  id: LevelUpStepId
  label: string
}

// ---------------------------------------------------------------------------
// Wizard result — the delta to persist
// ---------------------------------------------------------------------------

export interface LevelUpResult {
  /** New total level */
  totalLevel: number
  /** Updated classes array with incremented primary class level */
  classes: CharacterClassInfo[]
  /** New HP total */
  hitPoints: { total: number; generationMethod: string }
  /** Complete spell list after additions/removals */
  spells: Spell[]
  /** Subclass ID (if newly chosen) */
  subclassId?: string
}
