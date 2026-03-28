# Stealth and hidden state

## Boundary: perception vs hidden state

- **Perception** (`canPerceiveTargetOccupantForCombat`, `canSeeForTargeting`, pair visibility for attack rolls) answers whether an observer **currently** sees a subject’s **occupant**. That seam is **unchanged** and remains the authority for sight.
- **Hidden state** (`CombatantInstance.stealth`) records **observer-relative** stealth bookkeeping **on top of** perception. It is **not** a second visibility engine.
- **Targeting** continues to use **`canSeeForTargeting`**. **Attack-roll modifiers** continue to use **`resolveCombatantPairVisibilityForAttackRoll`**. Stealth rules live in **`stealth-rules.ts`** and layer semantics (lifecycle, future advantage hooks) without duplicating LOS/perception math.

---

## Runtime shape

- **`stealth?: CombatantStealthRuntime`** on the **subject** combatant — always an **object wrapper** (not a bare `hiddenFromObserverIds` on `CombatantInstance`) so metadata can grow without reshaping combatants.
- This pass stores only:
  - **`hiddenFromObserverIds: string[]`** — combatant ids of observers for whom the subject is treated as hidden (subject to reconciliation below).

---

## Single rules owner

All stealth **rules and mutations** live in:

**[`stealth-rules.ts`](../../src/features/mechanics/domain/encounter/state/stealth-rules.ts)**

Other modules (**`action-resolver.ts`**, **`useEncounterState`**) call exported helpers only; they do not reimplement stealth logic.

---

## Hide attempt eligibility

**`getStealthHideAttemptDenialReason`** delegates to **`getHideAttemptEligibilityDenialReason`** in [`sight-hide-rules.ts`](../../src/features/mechanics/domain/encounter/state/sight-hide-rules.ts) (occupant perception + merged **world** concealment at the hider’s cell). Dim light / light obscurement behavior follows that helper — not a new universal “always hide in dim” rule.

Eligibility answers **whether a hide attempt may be attempted** vs a given observer. It does **not** roll Stealth or compare to passive Perception.

---

## Hide resolution vs passive Perception (baseline)

**Flow:**

1. **Candidate observers:** **`resolveDefaultHideObservers`** lists other-side combatants for whom **`getStealthHideAttemptDenialReason`** is **`null`** (hide **eligibility** only — concealment / not hiding in plain sight). Baseline observer set is **the opposing side**; distance, cover, and sense-specific filters are **not** applied yet (see TODOs).
2. **No eligible observers:** if the candidate list is **empty**, **`resolveCombatAction`** logs the outcome and performs **no d20 Stealth roll** (nothing to compare against). Eligibility is evaluated **before** rolling.
3. **Stealth total:** when there is at least one candidate, **`action-resolver.ts`** rolls **d20 + Stealth modifier** for **`resolutionMode === 'hide'`**. Modifier comes from **`hideProfile.stealthModifier`** or **`getStealthCheckModifier(actor)`** (runtime snapshot: Dex + proficiency when threaded — see [`passive-perception.ts`](../../src/features/mechanics/domain/encounter/state/passive-perception.ts)).
4. **Comparison:** **`resolveHideWithPassivePerception(state, hiderId, stealthTotal, options)`** compares that total to each **candidate** observer’s **passive Perception** via **`getPassivePerceptionScore(observer)`**.
5. **Threshold:** **`stealthBeatsPassivePerception(total, passive)`** — Stealth must be **strictly greater than** passive Perception (**`>`**). A **tie** (**`==`**) does **not** count as hidden from that observer (observer wins ties). This matches the strict-greater tests in **`action-resolution.hide.test.ts`** and **`stealth-rules.test.ts`**.
6. **Storage (partial success):** For each **candidate**, **beat** → observer id is **on** **`hiddenFromObserverIds`**; **fail or tie** → that id is **removed** if it was only in the candidate set. Observer ids **not** in the candidate list for this attempt are **unchanged** (so prior hidden-from state can persist for observers you did not re-contest).

**Passive Perception source:** authoritative runtime seam **`getPassivePerceptionScore`** — prefers **`stats.skillRuntime`** (explicit passive, PB × Perception proficiency, etc.) and legacy **`stats.passivePerception`**, then derived **`10 + Wisdom`** as in [`passive-perception.ts`](../../src/features/mechanics/domain/encounter/state/passive-perception.ts). Populated from character/monster builders ([`combatant-builders.ts`](../../src/features/encounter/helpers/combatant-builders.ts)).

**Standard Hide action:** **`DEFAULT_HIDE_COMBAT_ACTION`** in [`combat-action.types.ts`](../../src/features/mechanics/domain/encounter/resolution/combat-action.types.ts) (`resolutionMode: 'hide'`, `targeting: self`).

**Separation of concerns:** **Eligibility** (can you try?) ≠ **resolution** (did your Stealth beat their passive?) ≠ **visibility** (can they see your occupant right now?) ≠ **stored hidden state** (runtime bookkeeping). Rules do **not** conflate “currently unseen” with “hidden.”

**Not implemented:** active **opposed** Stealth vs **rolled** Perception (passive-only baseline). **`applyStealthHideSuccess`** remains for tests/manual/DM tooling and future active-contest output.

---

## Reconciliation helpers (consistency with perception)

These keep stored **`hiddenFromObserverIds`** aligned with the **shared perception seam** so stealth does not become a divergent truth source:

| Helper | Purpose |
|--------|---------|
| **`reconcileStealthAfterMovementOrEnvironmentChange`** | **Authoritative sequence:** (1) for **each** combatant with `stealth`, **`reconcileStealthBreakWhenNoConcealmentInCell`**; (2) **`reconcileStealthHiddenForPerceivedObservers`**. Use after movement, placement, zone, or baseline changes. |
| **`reconcileStealthHiddenForPerceivedObservers`** | Drop an observer from the subject’s list when that observer **can** perceive the subject’s occupant (observer-relative; partial lists preserved). |
| **`reconcileStealthBreakWhenNoConcealmentInCell`** | Clear **that** subject’s stealth when their merged-world cell **no longer** supports hide concealment (`cellWorldSupportsHideConcealment`). |
| **`applyEncounterEnvironmentBaselinePatchAndReconcileStealth`** | **`updateEncounterEnvironmentBaseline`** + full reconcile (baseline-only callers; avoids circular imports). |

**Runtime integration (deterministic order):**

1. **`reconcileBattlefieldEffectAnchors`** (placement mutations, obstacle moves, aura anchor refresh) ends with **`reconcileStealthAfterMovementOrEnvironmentChange`** after environment-zone projection — covers **`placeCombatant`**, **`moveGridObstacleInEncounterState`**, and any path that runs this anchor pass.
2. **`useEncounterState` `handleMoveCombatant`** — after **`moveCombatant`**, runs **`reconcileBattlefieldEffectAnchors`** (so creature-anchored zones + stealth stay aligned), then **`resolveAttachedAuraSpatialEntryAfterMovement`** when spell context is present.
3. **`resolveCombatActionInternal`** — still runs **`reconcileStealthHiddenForPerceivedObservers`** **before** resolving the declared action (unchanged).

**Pure baseline patch:** **`updateEncounterEnvironmentBaseline`** does **not** run stealth (keeps tests and imports simple). For runtime lighting/obscurement changes that should affect hidden state, use **`applyEncounterEnvironmentBaselinePatchAndReconcileStealth`**.

**TODO:** cover/feature/sense-specific exceptions; richer “who counts as an observer” than passive hide resolution.

---

## Combat: attacks, targeting, and hidden state

**Design rule:** hidden state **does not** replace the shared visibility/perception seam. It **layers** bookkeeping (who you beat on Hide) on top; **attack rolls** and **sight targeting** still use **`canPerceiveTargetOccupantForCombat`** / **`canSeeForTargeting`** only.

| Concern | Source of truth | Uses `stealth` / `hiddenFromObserverIds`? |
|--------|-----------------|-------------------------------------------|
| Unseen attacker / unseen target (adv/dis on attack) | **`resolveCombatantPairVisibilityForAttackRoll`** → **`getAttackVisibilityRollModifiersFromPair`** | **No** — avoids double-counting when obscurement already denies occupant perception. |
| “Creature you can see” / sight-required targets | **`canSeeForTargeting`** | **No** |
| Hide vs passive Perception, hidden-from lists | **`stealth-rules.ts`**, **`resolveHideWithPassivePerception`** | **Yes** |
| Align hidden lists when perception changes | **`reconcileStealthHiddenForPerceivedObservers`** | **Yes** |

Contract constant: **`ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE`** (`stealth-attack-integration.ts`) is **`false`** — attack-roll code must stay free of stealth-based modifier branches.

**Gameplay benefit today:** “Hidden from observer X” lines up with hide resolution and reconciliation. **Combat advantage** from being hard to see flows through the **same** unseen-attacker / unseen-target rules as other cases (e.g. heavy obscurement), not a parallel “hidden = advantage” engine.

**Not modeled:** guessed location, sound-only detection, partial reveal per observer, Skulker-style exceptions.

---

## Break on attack (baseline)

**`breakStealthOnAttack`** clears the attacker’s entire **`stealth`** wrapper **after** the attack **d20 roll** is computed in **`action-resolver.ts`** (immediately after hit/miss is determined, before logging). That ordering keeps “reveal on attack” after the roll step; modifiers still come **only** from pair visibility (not from reading `stealth`).

**Semantics:** **global** reveal — all **`hiddenFromObserverIds`** cleared for the attacker. **TODO:** observer-relative reveal, location-only reveal, or feature-specific behavior.

---

## API summary

| Export | Role |
|--------|------|
| `getStealthHideAttemptDenialReason` | Hide **attempt** eligibility (delegates). |
| `getPassivePerceptionScore` | Passive Perception for hide comparison. |
| `getStealthCheckModifier` | Dex-based Stealth modifier for the Hide action roll. |
| `resolveHideWithPassivePerception` | Apply hide outcome vs passive Perception (after total is known). |
| `stealthBeatsPassivePerception` | Strict **`>`** threshold helper. |
| `applyStealthHideSuccess` | Merge **observerIds** (manual / future active contest). |
| `resolveDefaultHideObservers` | Candidate observers (eligibility only). |
| `reconcileStealthAfterMovementOrEnvironmentChange` | Full sequence: concealment loss + perceived-again pruning. |
| `applyEncounterEnvironmentBaselinePatchAndReconcileStealth` | Baseline patch + full reconcile. |
| `reconcileStealthHiddenForPerceivedObservers` | Align hidden-from with perception. |
| `reconcileStealthBreakWhenNoConcealmentInCell` | Clear stealth if cell has no concealment. |
| `breakStealthOnAttack` | Clear attacker stealth after attack roll (global reveal). |
| `ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE` | Contract flag (`false`) — attack modifiers must not read `stealth`. |
| `isHiddenFromObserver` | Read helper (bookkeeping only). |

---

## TODO / future work

- **Observer-relative or partial break** on attack (vs global `breakStealthOnAttack`).
- **Guessed location / sound** awareness for unseen targets (not occupant perception).
- **Active opposed** Stealth vs **rolled** Perception (contested check path; keep passive baseline as fallback).
- **Cover / light obscurement / three-quarters cover** and feature exceptions (e.g. Skulker, magical concealment) in eligibility or observer filtering.
- **Sense-specific** break and bypass threading consistent with **`EncounterViewerPerceptionCapabilities`** (blindsight vs hidden, etc.).
- **Richer observer sets** — e.g. allies in range, line-of-sight, or “aware” subsets instead of only all opposing combatants passing eligibility.
- Further **skill/item** bonuses on snapshots if not already covered by **`CombatantSkillRuntimeSnapshot`**.

See also [Perception and visibility](./perception-and-visibility.md).
