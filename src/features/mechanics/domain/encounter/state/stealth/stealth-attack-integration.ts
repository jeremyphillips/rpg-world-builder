/**
 * **Stealth hidden state vs attack / targeting (integration contract)**
 *
 * - **Attack-roll advantage/disadvantage** (unseen attacker / unseen target) is driven **only** by
 *   {@link resolveCombatantPairVisibilityForAttackRoll} and {@link getAttackVisibilityRollModifiersFromPair},
 *   which use {@link canPerceiveTargetOccupantForCombat}. Do **not** read `CombatantInstance.stealth` in
 *   the attack-roll path — that would risk double-stacking with the visibility seam.
 * - **Targeting** for sight-required effects uses {@link canSeeForTargeting} (same occupant perception).
 *   Hidden state does **not** replace or shortcut that check.
 * - **Runtime hidden state** (`hiddenFromObserverIds`) is bookkeeping for hide rules and reconciliation;
 *   it stays aligned with perception via {@link reconcileStealthHiddenForPerceivedObservers} before each
 *   action. When concealment already makes the defender unable to perceive the attacker’s occupant,
 *   unseen-attacker advantage already applies without consulting `stealth`.
 * - **Break on attack:** {@link breakStealthOnAttack} clears the attacker’s stealth **after** the d20
 *   attack roll is computed (`action-resolver.ts`), and clears **all** hidden-from observers at once
 *   (global reveal — observer-specific reveal is TODO).
 *
 * **Not modeled here:** guessed squares, sound-only awareness, partial reveal per observer, cover/Skulker
 * exceptions — see `docs/reference/stealth.md`.
 */

/** Intentional: attack-roll code must not branch on `stealth` for modifiers; keep `false`. */
export const ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE = false as const
