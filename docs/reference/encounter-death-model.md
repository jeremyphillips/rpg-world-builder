# Encounter death, defeat, and remains (domain model)

Reference for mechanics encounter semantics: participation, recorded death, remains, and targeting. **Authoritative implementation:** [`src/features/mechanics/domain/encounter/state/combatant-participation.ts`](../../src/features/mechanics/domain/encounter/state/combatant-participation.ts) and [`action-targeting.ts`](../../src/features/mechanics/domain/encounter/resolution/action/action-targeting.ts).

---

## Terminology

| Term | Meaning in this codebase |
|------|---------------------------|
| **Active** | `currentHitPoints > 0` — takes turns in initiative (when in order), valid “living” target for most actions. |
| **Defeated** | `currentHitPoints ≤ 0` — out of normal initiative participation, not a valid target for `single-creature` / typical hostile “living” targeting. HP is never stored below 0. |
| **Dead (recorded)** | A **death record** exists: `diedAtRound != null`. This is **not** the same as “HP ≤ 0” alone — see below. |
| **Remains** | Aftermath kind on the combatant: `corpse`, `bones`, `dust`, `disintegrated` (see [Remains semantics](#remains-semantics)). |
| **Death record** | Usually `diedAtRound` plus `remains` when lethal damage finalizes 0 HP; cleared when healing brings HP above 0 (revival). |

Prefer **helpers** over ad hoc `hp <= 0` checks so UI and rules stay aligned.

---

## Helper truth table

All predicates live in **`combatant-participation.ts`**.

| Helper | True when… |
|--------|----------------|
| `isActiveCombatant(c)` | `c.stats.currentHitPoints > 0` |
| `isDefeatedCombatant(c)` | `c.stats.currentHitPoints ≤ 0` |
| `isDeadCombatant(c)` | `c.diedAtRound != null` (recorded death this encounter) |
| `canTargetAsDeadCreature(c)` | `HP === 0` **and** remains are not `dust` or `disintegrated` (`undefined` at 0 HP counts as implicit corpse for this rule) |
| `hasRemainsOnGrid(c)` | `remains` is set and not `disintegrated` (strict: `undefined` ⇒ false — see remains doc) |
| `hasIntactRemainsForRevival(c)` | Remains not `dust` / `disintegrated` (`undefined` treated as intact for revival gates) |

**Initiative:** “Alive for next initiative roll” matches **`isActiveCombatant`** (see encounter `runtime.ts` — living filter uses `currentHitPoints > 0`).

---

## Targeting rules

Implemented in **`isValidActionTarget`** / **`getActionTargetInvalidReason`** (`action-targeting.ts`), using the helpers above.

| `targeting.kind` | Eligibility (simplified) |
|------------------|---------------------------|
| **`single-creature`** | `isActiveCombatant` — one **living** creature. |
| **`dead-creature`** | `canTargetAsDeadCreature` — **exactly 0 HP** and a corpse-like body (not dust/disintegrated). Dead-creature spells scan **all** combatants in `combatantsById`, not only `initiativeOrder`, so corpses dropped from initiative remain targetable. |
| **`single-target`** | Various rules; defeated combatants are still excluded where `isDefeatedCombatant` applies. |

Do not use raw `HP ≤ 0` alone for “dead-creature” eligibility — use **`canTargetAsDeadCreature`**.

---

## Remains semantics

- **`CombatantRemainsKind`:** `corpse` | `bones` | `dust` | `disintegrated`.
- **Lethal damage** that applies a death record sets **`remains`** (defaulting toward `corpse` unless overridden, e.g. Disintegrate → `disintegrated`).
- **`death-outcome`** effects (e.g. turns-to-dust) run when the target already has **`HP ≤ 0`**; they **refine** remains (e.g. to `dust`), they do not deal the killing blow by themselves.

**`remains === undefined`**

- **Living** combatants: usually no aftermath.
- **After a normal lethal kill:** resolution typically sets explicit `remains` with the death record.
- **`canTargetAsDeadCreature`:** at **0 HP**, `undefined` remains is treated as an **implicit corpse** for spell targeting.
- **`hasRemainsOnGrid`:** `undefined` ⇒ **false** (no stored aftermath — avoids UI assuming a body without data). This is intentionally **stricter** than dead-creature targeting.
- **`hasIntactRemainsForRevival`:** `undefined` ⇒ still **intact** (not destroyed); pair with HP / defeat checks for revival flows.

---

## Zero HP vs death record

| Situation | Typical state |
|-----------|----------------|
| Damage reduces HP from **> 0 to 0** (lethal path) | `HP === 0`, **`diedAtRound`** set, **`remains`** set (unless future rules change). |
| Undead Fortitude (or similar) **stabilizes at 1 HP** | Not defeated; **no** death record from that resolution. |
| **Synthetic / test** state: `HP === 0` without `diedAtRound` | **Defeated** yes, **dead (record)** no — not produced by current lethal reducers in normal play. |

**Rule of thumb:** “**Defeated**” = participation (`isDefeatedCombatant`). “**Dead (record)**” = revival windows / aftermath (`isDeadCombatant`). Do not equate “dead” in copy with **only** HP unless you intentionally mean defeated.

**Healing:** `applyHealingToCombatant` clears **`remains`** and **`diedAtRound`** when the combatant **revives** (`prevHp ≤ 0` and `newHp > 0`). Healing that does not cross above 0 HP does not clear the death record.

---

## Future room: unconscious and death saves

The type shape allows **`HP ≤ 0` without a death record** so that later mechanics (e.g. **unconscious at 0 HP** with death saving throws, or “stable but not dead”) can exist without conflating **defeated participation** with **recorded death**.

Until that is modeled:

- **`isDefeatedCombatant`** remains the broad “out of the fight” gate tied to HP.
- **`isDeadCombatant`** remains **record-based** (`diedAtRound`).
- Avoid adding a duplicate `encounterStatus` field that only mirrors HP until unconscious vs dead is represented distinctly.

---

## Related references

- [`docs/reference/badges.md`](badges.md) — `participation_defeated` preview chip pipeline (encounter UI).
- [`combatant.types.ts`](../../src/features/mechanics/domain/encounter/state/types/combatant.types.ts) — `remains`, `diedAtRound`, `CombatantDeathRecord`.
