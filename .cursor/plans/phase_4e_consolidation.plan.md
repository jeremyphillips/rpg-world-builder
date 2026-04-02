---
name: Phase 4E consolidation
overview: Document seam-canonical migrated flows, unmigrated truth-changing flows, deferred feedback follow-ups, and small comment/doc cleanup. Encounter start-by-intent is explicitly deferred by default (likely 4F+).
todos:
  - id: audit-confirm
    content: Re-grep production Encounter for engine bypass; confirm only useEncounterState + tests
  - id: doc-feedback-followups
    content: Add docs/reference/combat/client/feedback-followups.md (action-log-slice + registerIntentFailure)
  - id: doc-updates
    content: Update intents-and-events, local-dispatch, roadmap, README, MUTATION_ENTRY_POINTS, optional combat-encounter-refactor-reference
  - id: doc-deferred-start
    content: Document deferred encounter start-by-intent (4F+) in combat reference docs; not in 4E unless explicitly scoped
  - id: code-comments
    content: Refresh apply-combat-intent.ts module comment + not-implemented message; fix misleading stale notes
  - id: verify
    content: rg checks, full vitest, tsc (note unrelated failures)
isProject: false
---

# Phase 4E — Consolidation and deferred feedback documentation

## Audit summary (pre-build)

| Question | Answer |
|----------|--------|
| **Where does production call `applyCombatIntent`?** | Only `src/features/encounter/hooks/useEncounterState.ts`. |
| **Do routes bypass the seam for migrated flows?** | No — routes wire hook handlers only. |
| **What still mutates encounter truth directly in Encounter?** | Same hook: `createEncounterState` (start), DM/manual mutators, `triggerManualHook`, reset. |

**Migrated flows (seam-only in production):** end turn, move combatant, resolve action.

---

## Deferred by default: encounter start by intent

**Do not migrate `handleStartEncounter` in this pass by default.**

| | |
|--|--|
| **Current state** | Encounter start still creates initial combat state directly (`createEncounterState` in `useEncounterState`). |
| **Reason for deferral** | Requires a new startup intent or separate application entry point; canonical payload design for roster + space/options; likely touches intent union, startup semantics, and tests more broadly than this cleanup pass should. |
| **Plan** | Document as a **likely later phase (e.g. 4F or later)** in `docs/reference/combat/` and `MUTATION_ENTRY_POINTS.md`. **Only implement in Phase 4E if explicitly requested** as part of that build. |

---

## Documentation (required)

### New: `docs/reference/combat/client/feedback-followups.md`

Cover **action-log-slice** and **registerIntentFailure** (purpose, deferral rationale, architectural fit). Link from `docs/reference/combat/README.md`.

### Update existing reference docs

- `engine/intents-and-events.md` — Phase 4E: seam canonical for migrated flows; unmigrated flows named; link feedback follow-ups; **state start-by-intent deferred to 4F+ unless scoped**.
- `client/local-dispatch.md` — same.
- `roadmap.md` (formerly detailed in `migration-roadmap.md`, which now redirects) — Phase 4E bullet + **deferred start-encounter intent** as follow-up phase; see also consolidated [roadmap.md](../../docs/reference/combat/roadmap.md).
- `src/features/mechanics/domain/combat/application/MUTATION_ENTRY_POINTS.md` — Phase 4E section; **unmigrated** table including start encounter (direct `createEncounterState`) with pointer to 4F+.
- `docs/reference/combat-encounter-refactor-reference.md` — minimal pointer if needed.

---

## Code cleanup (small)

- `apply-combat-intent.ts`: refresh module comment; neutral `not-implemented` message (drop stale “Phase 4C+”).
- Grep for misleading phase/bypass comments in encounter + application.

**Do not** implement `registerIntentFailure` or expand `action-log-slice` consumption unless minimally required.

---

## Verification

- `rg` for `resolveCombatAction|advanceEncounterTurn|moveCombatant` under `src/features/encounter` excluding `__tests__` — expect only `useEncounterState` context keys / tests.
- `rg` docs for `action-log-slice`, `registerIntentFailure`, and deferred start / 4F.
- `npm run test:run`; `npx tsc -b` (call out unrelated failures).

---

## Definition of done

- Docs reflect seam-canonical migrated flows and honestly list unmigrated flows (including **start** as deferred to 4F+).
- `feedback-followups.md` exists with both deferred feedback topics.
- Stale application comments updated; **no** start-encounter migration unless explicitly in scope.
