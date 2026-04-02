---
name: Phase 4D log and toast from intent results
overview: Consolidate intent success feedback in useEncounterState; flatten log-appended entries once; one microtask per successful apply (not per log-appended event); keep registerCombatLogAppended(entries, state) API; optional failure surfacing and narrow toast metadata—no combat log UI redesign.
todos:
  - id: audit-doc
    content: Add PHASE_4D feedback audit note (or extend MUTATION_ENTRY_POINTS)
    status: pending
  - id: flatten-helper
    content: Add flattenLogEntriesFromIntentSuccess + tests (single concat of all log-appended)
    status: pending
  - id: hook-consolidate
    content: useEncounterState — one queueIntentSuccessFeedback per success; one microtask calling register once
    status: pending
  - id: toast-optional
    content: Optionally pass intentEvents into toast builder later; no broad rewrite in 4D
    status: pending
  - id: failure-optional
    content: Optional registerIntentFailure for validation errors (minimal)
    status: pending
  - id: docs
    content: Update intents-and-events, local-dispatch, roadmap
    status: pending
  - id: verify
    content: Grep, tsc, full vitest, manual smoke
    status: pending
isProject: false
---

# Phase 4D — Derive combat log and toast from canonical result/event output

## Locked implementation choices (refinement)

1. **API: Option A (minimal churn)** — Keep **`registerCombatLogAppended(entries, stateAfter)`** as the public hook contract. Do not rename to a broader `registerCombatIntentFeedback` in this pass unless a follow-up explicitly requires it.

2. **Flatten once** — Add a pure helper (e.g. `flattenLogEntriesFromIntentSuccess` or `flattenLogEntriesFromEvents`) that **concatenates** all `CombatLogEvent` records from every `log-appended` event in `result.events` **in order**. Call sites use this single flattened array for notifications.

3. **One microtask per successful intent result** — After `applyCombatIntent` succeeds, schedule **exactly one** `queueMicrotask` that invokes `combatLogAppendedRef.current?.(flattenedEntries, result.nextState)` **when `flattenedEntries.length > 0`**. Do **not** queue one microtask per `log-appended` event (removes duplicate scheduling and aligns toast/log side effects with one logical “commit”).

**Behavioral note:** If a future intent ever emitted multiple `log-appended` chunks in one result, they merge into one callback invocation—acceptable and matches “one user-visible outcome per intent success.”

## Audit summary

| Area | Today | Target |
|------|--------|--------|
| Success loops | Three copy-pasted loops over `result.events` in `useEncounterState` | Single helper + one microtask |
| Log notification | Per `log-appended` microtask | **One** microtask with flattened entries |
| Toast | `buildEncounterActionToastPayload(entries, state)` | Unchanged signature; receives flattened `entries` |
| Failure | Silent `return prev` | Optional minimal failure callback (out of band for “choose A” core) |

## Implementation steps

1. **Audit note** — [`MUTATION_ENTRY_POINTS.md`](../../src/features/mechanics/domain/combat/application/MUTATION_ENTRY_POINTS.md) or `PHASE_4D_FEEDBACK_PATHS.md` under [`combat/application/`](../../src/features/mechanics/domain/combat/application/).

2. **Pure helper** — Place in [`combat/application/`](../../src/features/mechanics/domain/combat/application/) (e.g. `intent-success-log-entries.ts`): input `CombatIntentSuccess` or `CombatEvent[]`, output `CombatLogEvent[]`.

3. **Refactor** [`useEncounterState.ts`](../../src/features/encounter/hooks/useEncounterState.ts) — `handleNextTurn`, `handleResolveAction`, `handleMoveCombatant` success paths call shared internal `notifyLogAppendedFromIntentSuccess(result)` that flattens and queues **one** microtask.

4. **Tests** — Unit tests for flatten helper (empty, single chunk, multiple `log-appended` order preserved). Optional regression: same flattened array as manual concat of old behavior.

5. **Toast** — [`encounter-action-toast.ts`](../../src/features/encounter/helpers/actions/encounter-action-toast.ts): no mandatory change in 4D; optional `intentEvents` parameter deferred unless a small win is obvious.

6. **Failure** — Optional `registerIntentFailure` or similar; **not** required to satisfy “choose A” / flatten / one microtask.

7. **Docs** — [`docs/reference/combat/engine/intents-and-events.md`](../../docs/reference/combat/engine/intents-and-events.md), [`client/local-dispatch.md`](../../docs/reference/combat/client/local-dispatch.md), [`roadmap.md`](../../docs/reference/combat/roadmap.md).

## Verification

- **Grep:** no duplicate feedback paths; `registerCombatLogAppended` still used from route.
- **`tsc -b`**, **`npm run test:run`**.
- **Manual:** resolve, move, end turn — toasts/logs match prior behavior; no duplicate toasts from multiple microtasks.

## Out of scope

- Combat log component/layout redesign.
- Full event taxonomy or toast copy rewrite.
- Server sync.

## Follow-up

- **4E** — remove remaining non-intent mutation entry points.
