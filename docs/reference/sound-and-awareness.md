# Sound and awareness (roadmap)

Concise reference for **future** hearing / sound / awareness work. For **current** rules and types, see [Perception and visibility](./perception-and-visibility.md), [Stealth and hidden state](./stealth.md), and [Awareness and guessed position](./awareness-and-guessed-position.md).

---

## 1. Purpose

Preserve the **mental model** already encoded in code: **visual perception**, **stealth bookkeeping**, and **non-visual guessed location** are separate layers. This doc records what exists today, what is **deliberately deferred**, and **likely extension points** so a future pass can continue without re-litigating boundaries.

---

## 2. Current awareness model (three bands)

| Band | Meaning | Primary seam / state |
|------|---------|---------------------|
| **Visually perceived** | Observer can **see** the subject’s **occupant** for combat rules. | `canPerceiveTargetOccupantForCombat` / `canSeeForTargeting` (`visibility/combatant-pair-visibility.ts`, `visibility/visibility-seams.ts`) |
| **Hidden / unseen** | Observer-relative stealth: subject is **hidden from** that observer. | `CombatantStealthRuntime.hiddenFromObserverIds` — **`stealth/stealth-rules.ts`** only |
| **Guessed position** | Observer does **not** see the occupant but has a **last attributed grid cell** (e.g. noise). | `CombatantAwarenessRuntime.guessedCellByObserverId` — **`awareness/awareness-rules.ts`** |

`resolveTargetLocationAwareness` classifies an observer–subject pair as **`visible`**, **`guessed-location`**, or **`unknown`**.

---

## 3. Key distinctions

- **Visibility vs hidden state vs guessed position** — Perception answers **sight**. Stealth records **who is hidden from whom** (rules lifecycle). Awareness records **where** an observer *attributes* an unseen subject — **not** sight.
- **Guessed position vs “can see target”** — Guessed cell **never** satisfies **`requiresSight`** on actions. Targeting without **`requiresSight`** may allow **visible occupant OR guessed cell** (`isValidActionTarget`, `targetingLocationAwarenessAllows` in `action-targeting.ts`).
- **Sound-based awareness vs visual perception** — Today there is **no** sound propagation engine. **`applyNoiseAwarenessForSubject`** is a **narrow event hook** that refreshes guesses for **opposing** observers who cannot see the occupant. It does **not** replace **`canPerceiveTargetOccupantForCombat`**.

---

## 4. What is currently implemented

- Shared **occupant** visibility for targeting, attack modifiers, opportunity attacks, hide eligibility, and stealth reconciliation (`canPerceiveTargetOccupantForCombat` / `canSeeForTargeting`).
- **Stealth** entry (`resolveHideWithPassivePerception`, `getStealthHideAttemptDenialReason`), sustain/reconcile (`reconcileStealthAfterMovementOrEnvironmentChange`, `reconcileStealthBreakWhenNoConcealmentInCell`, `reconcileStealthHiddenForPerceivedObservers`) using **`getHideAttemptEligibilityDenialReason`** with **`hide-attempt`** vs **`stealth-sustain`** modes where documented in **`stealth/sight-hide-rules.ts`** / **`stealth/stealth-rules.ts`**.
- **Passive Perception** and **Stealth check** modifiers from **`getPassivePerceptionScore`** / **`getStealthCheckModifier`** (`awareness/passive-perception.ts`) on **`CombatantInstance`** — not ad hoc source-model reads in resolution.
- **Guessed cells**: **`getGuessedCellForObserver`**, **`setGuessedCellForObserver`**, **`applyNoiseAwarenessForSubject`** (e.g. after attack resolution in **`action-resolver.ts`**), **`reconcileAwarenessGuessesWithPerception`** (also after **`reconcileStealthHiddenForPerceivedObservers`**).
- **Movement / environment**: **`reconcileBattlefieldEffectAnchors`** ends with **`reconcileStealthAfterMovementOrEnvironmentChange`** (see **`stealth.md`**); baseline patches use **`applyEncounterEnvironmentBaselinePatchAndReconcileStealth`**.
- **Resolver** runs **`reconcileStealthHiddenForPerceivedObservers`** before building targets so stealth aligns with perception at resolve time.

---

## 5. What is intentionally NOT implemented yet

- **Full sound propagation** — occlusion, materials, room acoustics.
- **Hearing range simulation** — distance bands, deafness, blindsight vs audio.
- **Wrong-square attacks** — stale guess, miss when the creature moved, attack-a-square without a creature id.
- **Richer sensory capability systems** — full threading of **`EncounterViewerPerceptionCapabilities`** for non-visual senses vs stealth/guesses.
- **Silent vs noisy movement hooks** — automatic refresh/clear of guesses on move (partially noted as TODO in **`awareness/awareness-rules.ts`**).

---

## 6. Likely future extension points

- **Events that refresh or invalidate awareness** — combat actions (`attack`, `movement`, `other` **`NoiseAwarenessKind`**), spell effects, DM tools; keep calling **`applyNoiseAwarenessForSubject`** or specialized siblings rather than duplicating visibility.
- **Attack-at-guessed-location** — square-only targeting, disadvantage tiers, automatic miss rules; keep **`requiresSight`** strict and extend non-sight actions explicitly.
- **Richer hearing rules** — range checks **after** a clean **`EncounterState`** API for “does observer have any auditory fix on subject?” without folding into **`canSeeForTargeting`**.

---

## 7. Open design questions

- Should **guessed cell** ever **substitute** for range measurement, or always **actual** placement for **`isWithinRange`** (current: **actual** placement only)?
- When an observer **gains** vision, guesses drop — should **losing** vision ever **seed** a guess from last known cell without a noise event?
- **Ally** vs **enemy** noise rules — current noise path focuses on **opposing** sides; allies might need different semantics later.
- **Global** vs **observer-relative** break on **`breakStealthOnAttack`** — still a **`stealth/stealth-rules.ts`** TODO for feature-specific behavior.

---

*This file is intentionally a stabilization / roadmap note, not a commitment to ship every item.*
