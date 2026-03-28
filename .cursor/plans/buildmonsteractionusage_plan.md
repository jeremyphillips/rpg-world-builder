# Plan: `buildMonsterActionUsage` follow-up

## Decisions (locked in)

- **Tests:** Exercise usage mapping only through **`buildMonsterExecutableActions(monster, weaponsById, effects)`** — assert on returned **`CombatActionDefinition[]`** (e.g. `usage.recharge`, `usage.uses`). **Do not** export **`buildMonsterActionUsage`**; it stays **`private`** to [`monster-combat-adapter.ts`](src/features/encounter/helpers/monster-combat-adapter.ts).
- **Documentation:** Add **JSDoc** on the private helper describing catalog → **`CombatActionUsage`** mapping, **`special`-only** eligibility, initial **`recharge.ready`**, and pointers to **`CombatActionUsage`** / turn-boundary recharge behavior (see [`runtime.ts`](src/features/mechanics/domain/encounter/state/runtime.ts) **`processActionRecharge`**, [`action-cost.ts`](src/features/mechanics/domain/encounter/resolution/action/action-cost.ts)).
- **Schema:** **Defer** any support for **`recharge` / `uses`** on non-**`special`** actions (**`natural`**, **`weapon`**) until the **monster action types** actually allow those fields. No widening of **`CombatActionUsage`** or reset logic in this pass.

## Implementation scope

1. **JSDoc** — `buildMonsterActionUsage` only (concise; no new markdown doc unless you ask later).
2. **Tests** — New **`describe`** block (or file co-located with [`encounter-helpers.test.ts`](src/features/encounter/helpers/encounter-helpers.test.ts) importing `buildMonsterExecutableActions` from [`encounter-helpers`](src/features/encounter/helpers/encounter-helpers.ts)) with **minimal `Monster` fixtures**:
   - **`special`** + **`recharge`** only → `usage.recharge` with `ready: true`, `min`/`max` from catalog; `uses` absent.
   - **`special`** + **`uses`** (`count`, `period: 'day'`) only → `usage.uses` with `max`/`remaining`/`period`; `recharge` absent.
   - **`special`** + both → both branches populated.
   - **`special`** + neither → `usage` undefined.
   - **`natural`** (and optionally **`weapon`**) with no usage fields in schema → `usage` undefined (documents current behavior; no schema change).

## Out of scope

- Exporting **`buildMonsterActionUsage`** for unit tests.
- Extending **`MonsterNaturalAttackAction`** / **`MonsterWeaponAction`** with **`recharge`/`uses`**.
- Legendary / lair action economy (separate containers).

## Todos

- [x] Add JSDoc on `buildMonsterActionUsage` in `monster-combat-adapter.ts`.
- [x] Add public-adapter tests via `buildMonsterExecutableActions` in `encounter-helpers.test.ts` (or dedicated `monster-combat-adapter.usage.test.ts` that imports from `encounter-helpers` only).
