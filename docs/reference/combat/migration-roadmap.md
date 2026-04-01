# Combat Migration Roadmap

## Purpose

This document tracks the high-level phased roadmap for the combat refactor.

It is not intended to capture every small implementation step.
It exists to keep the long-term direction visible.

## Refactor goals

The refactor is moving toward this end state:

- shared combat engine owns truth
- reusable client combat UI is separated from Encounter
- Encounter becomes a consumer/composer
- truth-changing operations move toward intent dispatch
- server later becomes authoritative for those intents
- authored location floors enter combat through an explicit adapter seam

## Phase 1 — Engine naming and space ownership

### Goal
Establish `combat` as the shared engine concept and move runtime board ownership under that engine.

### Main outcomes
- rename mechanics/domain `encounter` -> `combat`
- move `encounter/space` under combat ownership
- remove known engine -> feature import inversions
- update imports/exports/tests

### Why it matters
This phase makes ownership clearer before deeper extraction work.

## Phase 2 — Pure derivation extraction

### Goal
Move reusable, pure derivation out of Encounter into combat-owned selectors/presentation.

### Main outcomes
- extract pure combat derivation from `encounter/domain`
- create/clarify combat-owned presentation/selectors
- Encounter consumes derived models instead of owning them

### Why it matters
This makes reusable combat summaries and presentation derivation shareable by both UI and future server/application layers.

## Phase 3 — Reusable client combat UI extraction

### Goal
Create `src/features/combat` as the client-only reusable combat UI layer.

### Main outcomes
- extract low-risk shared combat UI primitives
- move client-only presentation helpers out of Encounter
- split `CombatGrid` from `EncounterGrid`
- extract selected row/panel/log display leaves
- keep shells and workflow in Encounter

### Why it matters
This makes Encounter a consumer of reusable combat UI rather than the owner of every combat-facing component.

## Phase 4 — Intent boundary and local dispatch

### Goal
Split client UI from direct mutation flow and introduce a combat intent dispatch seam.

### Main outcomes
- define intent types
- define result/event/error shapes
- introduce local dispatch/application seam
- migrate selected truth-changing flows from direct mutation to intent dispatch
- prepare later server-authoritative rollout

### Why it matters
This is the bridge from single-client mutation flow toward server-authoritative multiplayer.

### Phase 4A (contracts + local seam)

- Implemented: intent unions, `CombatIntentResult` / `CombatEvent` / `CombatDispatchError`, `applyCombatIntent` in `src/features/mechanics/domain/combat/application/`, end-turn wired from Encounter.

### Phase 4B (move + resolve through seam)

- Implemented: `MoveCombatantIntent` and `ResolveActionIntent` handled in `applyCombatIntent`; `handleMoveCombatant` and `handleResolveAction` dispatch intents only (orchestration in application layer).
- Next (4C+): broader action UX, optional standalone place/spawn intents, DM mutators.

See [.cursor/plans/phase_4a_combat_intent_dispatch.plan.md](../../../.cursor/plans/phase_4a_combat_intent_dispatch.plan.md).

## Future server-authoritative phase

### Goal
Move from local dispatch architecture to server-authoritative combat resolution.

### Main outcomes
- server receives intents
- server validates permissions and latest state
- shared engine resolves authoritative truth
- persistence + broadcast + reconnect flow are introduced
- client becomes canonical-state consumer

### Why it matters
This enables multiplayer live play without rethinking the whole combat system.

## Cross-cutting concerns

These concerns span multiple phases:

- keep ownership boundaries explicit
- avoid engine -> Encounter dependencies
- keep reusable combat UI free of route/setup concerns
- preserve a clean authored-content -> combat adapter seam
- avoid mixing UI-local state with authoritative combat truth

## Roadmap usage notes

When planning or reviewing a pass:

1. identify which phase it belongs to
2. confirm the target ownership boundary
3. check whether the change is mechanical, architectural, or behavioral
4. update this roadmap if the phase plan changes materially