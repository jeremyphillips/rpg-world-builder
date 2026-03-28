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

1. **Eligibility:** for each other-side combatant, **`resolveDefaultHideObservers`** returns ids where **`getStealthHideAttemptDenialReason` is `null`** (candidate observers for this attempt).
2. **Stealth total:** the **action resolver** rolls **d20 + Stealth modifier** when **`resolutionMode === 'hide'`** (`action-resolver.ts`). Modifier comes from **`hideProfile.stealthModifier`** or **`getStealthCheckModifier`** (`passive-perception.ts`, Dex-based until skill proficiencies are modeled).
3. **Comparison:** **`resolveHideWithPassivePerception(state, hiderId, stealthTotal, options)`** compares that total to each **candidate** observer’s **passive Perception** via **`getPassivePerceptionScore`** (`passive-perception.ts`).
4. **Threshold:** **`stealthBeatsPassivePerception(total, passive)`** — **Stealth must be strictly greater than** passive Perception (**`>`**). A **tie** does **not** hide you from that observer (observer wins ties).
5. **Storage:** For each candidate, **beat** → add observer id to **`hiddenFromObserverIds`**; **fail or tie** → remove that id if present. Non-candidate ids already on the list are left unchanged.

**Passive Perception source:** **`CombatantStatBlock.passivePerception`** when set (e.g. monsters from **`mechanics.senses.passivePerception`** in [`combatant-builders.ts`](../../src/features/encounter/helpers/combatant-builders.ts)). Otherwise **`10 + Wisdom modifier`** from **`stats.abilityScores`**. TODO: skill proficiency / expertise on characters.

**Standard Hide action:** **`DEFAULT_HIDE_COMBAT_ACTION`** in [`combat-action.types.ts`](../../src/features/mechanics/domain/encounter/resolution/combat-action.types.ts) (`resolutionMode: 'hide'`, `targeting: self`).

**Not implemented this pass:** active **opposed** Stealth vs rolled Perception (only passive). **`applyStealthHideSuccess`** remains for tests/manual/DM tooling and future active-contest output.

---

## Reconciliation helpers (consistency with perception)

These keep stored **`hiddenFromObserverIds`** aligned with the **shared perception seam** so stealth does not become a divergent truth source:

| Helper | Purpose |
|--------|---------|
| **`reconcileStealthHiddenForPerceivedObservers`** | Drop an observer from the subject’s list when that observer **can** perceive the subject’s occupant. |
| **`reconcileStealthBreakWhenNoConcealmentInCell`** | Clear stealth when the hider’s merged world cell **no longer** supports hide concealment (`cellWorldSupportsHideConcealment`). |

**Call sites (this pass):**

- **`resolveCombatActionInternal`** — runs **`reconcileStealthHiddenForPerceivedObservers`** before target resolution.
- **`useEncounterState` `handleMoveCombatant`** — after **`moveCombatant`**, runs **`reconcileStealthBreakWhenNoConcealmentInCell`** for the mover and **`reconcileStealthHiddenForPerceivedObservers`** on the result.

Other code paths that mutate grid placement without going through that hook should call the same reconciliation or hidden state may drift.

---

## Break on attack (baseline)

**`breakStealthOnAttack`** clears the attacker’s **`stealth`** when they **make** an attack (wired at the start of the attack-roll branch in **`action-resolver.ts`**). This is an intentional **baseline**; it may later be refined (per-observer reveal, features, “location revealed” vs full state, certain spells).

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
| `reconcileStealthHiddenForPerceivedObservers` | Align hidden-from with perception. |
| `reconcileStealthBreakWhenNoConcealmentInCell` | Clear stealth if cell has no concealment. |
| `breakStealthOnAttack` | Clear attacker stealth (baseline). |
| `isHiddenFromObserver` | Read helper (bookkeeping only). |

---

## TODO / future work

- **Active opposed** Stealth vs **rolled** Perception (not passive-only).
- Cover / three-quarters cover and feature exceptions (Skulker, magical concealment).
- Sense-specific break and bypass threading consistent with **`EncounterViewerPerceptionCapabilities`**.
- Richer **observer sets** (not only “other side” + eligibility).
- Stealth **skill** proficiency / expertise on **`getStealthCheckModifier`** and Perception on **`getPassivePerceptionScore`**.

See also [Perception and visibility](./perception-and-visibility.md).
