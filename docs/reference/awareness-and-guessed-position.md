# Awareness and guessed position (sound seam)

For deferred sound/hearing work and open questions, see [Sound and awareness (roadmap)](./sound-and-awareness.md).

## Purpose

This pass adds a **small, explicit** observer-relative model for **estimated grid location** when an observer **does not** visually perceive a subject’s **occupant** (`canPerceiveTargetOccupantForCombat`). It closes part of the gap between:

- **“I can see them”** — unchanged; still **only** the shared perception / visibility seam.
- **“I know roughly where they are (e.g. heard a noise)”** — **`CombatantAwarenessRuntime`** on the **subject**, keyed by observer id.
- **“No usable location”** — no entry for that observer in **`guessedCellByObserverId`**.

This is **not** a second visibility engine, **not** hearing range simulation, and **not** a substitute for **`canSeeForTargeting`** / requires-sight targeting.

---

## How it differs from visibility and stealth

| Concept | Role |
|--------|------|
| **Perception / visibility** (`canPerceiveTargetOccupantForCombat`, `canSeeForTargeting`) | **Authoritative** for whether an observer **currently sees** the subject’s occupant. |
| **Stealth / hidden** (`CombatantInstance.stealth`, `hiddenFromObserverIds`) | Observer-relative **hide bookkeeping** — who treats the subject as hidden for stealth rules. **Independent** of guessed position. |
| **Awareness / guessed cell** (`CombatantInstance.awareness`, `guessedCellByObserverId`) | Observer-relative **last attributed cell** when sight does **not** apply — e.g. noise at a location. **Does not** imply sight. |

A subject can be **hidden** from an observer **and** still have a **guessed cell** for that same observer (e.g. heard movement or an attack from that cell while still not seeing the occupant).

---

## Runtime shape

- **`awareness?: CombatantAwarenessRuntime`** on the **subject** combatant.
- **`guessedCellByObserverId?: Record<string, string>`** — observer combatant id → **grid cell id** (string id from placements / space).

Mutations and rules live in **`awareness/awareness-rules.ts`**. Helpers include **`getGuessedCellForObserver`**, **`setGuessedCellForObserver`**, **`clearGuessedCellForObserver`**, **`applyNoiseAwarenessForSubject`**, **`reconcileAwarenessGuessesWithPerception`**, **`resolveTargetLocationAwareness`** (classifies **visible** vs **guessed-location** vs **unknown** for an observer–subject pair).

---

## What updates guessed position (current pass)

- **`applyNoiseAwarenessForSubject(state, subjectId, { kind })`** — for **opposing** combatants (`partyCombatantIds` / `enemyCombatantIds`), for each observer who **cannot** `canPerceiveTargetOccupantForCombat` the subject’s occupant, sets that observer’s guess to the subject’s **current placement cell** (requires **`placements`** and a resolved cell). **`kind`** is **`'attack' | 'movement' | 'other'`** for future tuning; behavior is the same for all kinds in this narrow implementation.
- **Integration:** after **`breakStealthOnAttack`** in **`action-resolver.ts`**, **`applyNoiseAwarenessForSubject`** runs with **`kind: 'attack'`** so an attack from a cell can refresh location awareness for observers who still cannot see the attacker’s occupant.

**Not** wired in this pass: automatic “noisy movement” vs silent movement; silent movement does **not** clear guesses automatically (see below).

---

## What clears guessed position

- **`reconcileAwarenessGuessesWithPerception`** — removes an observer’s guess when that observer **can** perceive the subject’s occupant (**vision supersedes** sound-only hints).
- **Integration:** **`reconcileStealthHiddenForPerceivedObservers`** (in **`stealth/stealth-rules.ts`**) ends with **`reconcileAwarenessGuessesWithPerception`**, so any path that reconciles stealth after perception changes also aligns guesses.

**Not** fully modeled yet: clearing guesses when the subject **silently** leaves a cell, successful hide with no subsequent noise, or “lost track” without a perception change — those need explicit hooks or a future **hearing / sensory** layer.

---

## Targeting and attacks

**`isValidActionTarget`** / **`getActionTargetInvalidReason`** (`action-targeting.ts`) integrate guessed position **without** conflating it with sight:

| Action targeting | Location requirement |
|------------------|----------------------|
| **`requiresSight: true`** | **`canSeeForTargeting`** only. Guessed cell **does not** help. Failure: **`Target not visible`**. |
| **`requiresSight`** false/omitted (creature-targeting kinds: **`single-target`**, **`single-creature`**, **`dead-creature`**, **`entered-during-move`**) | **Visible occupant** **or** (by default) a **guessed cell** for this observer on the subject. If neither: **`Target location unknown`**. |
| **`allowGuessedLocationWhenUnseen: false`** on **`CombatActionTargetingProfile`** | Same as forcing **sight-only** without setting **`requiresSight`** — useful for special cases; guessed cell does not help. |

- **Range** (`rangeFt`) still uses **actual** combatant placements — guessed cell does **not** substitute distance (the creature is still at its real cell; awareness only answers “do you know to swing there”).
- **Attack-roll advantage/disadvantage** still comes only from **`resolveCombatantPairVisibilityForAttackRoll`** / the shared visibility seam — guessed targeting does **not** add extra visibility modifiers (avoid double-counting unseen-target rules).

**Not** implemented: selecting **only** a grid square with no creature token (true attack-a-square); **wrong-square** miss rules when the guess is stale; decoys.

---

## Remaining TODOs (broader systems)

- **Full hearing / sound propagation** — range, walls, stealth-at-a-distance, sense-specific rules.
- **Attack-a-square / wrong-square resolution** — miss when the creature moved after the guess; uncertainty tiers (“heard but not pinpointed”).
- **Richer sensory capabilities** — threading **`EncounterViewerPerceptionCapabilities`** and blindsight-like behavior with hidden + guessed position.
- **Deeper world / geometry** — 3D, occlusion, and movement noise categories wired from **`moveCombatant`** and action types.
- **History / timeline** of awareness — not stored; only current guessed cell per observer pair.

See also [Perception and visibility](./perception-and-visibility.md) and [Stealth and hidden state](./stealth.md).
