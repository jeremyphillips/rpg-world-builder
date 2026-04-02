# Combat roadmap and gaps

## Purpose

This document tracks **what is done**, **what is planned**, and **known gaps** in the combat system. It complements [architecture.md](./architecture.md) (principles and layers) and [ownership-boundaries.md](./ownership-boundaries.md) (where code belongs).

For philosophy and stable definitions, prefer the top-level combat docs and [glossary.md](./glossary.md). This file is allowed to go stale on fine-grained task lists; refresh it when phases complete or priorities shift.

---

## Completed milestones (summary)

These are high-level checkpoints, not exhaustive changelogs.

### Engine and extraction

- **Phase 1:** `combat` naming, space under combat ownership, import hygiene.
- **Phase 2:** Pure derivation moved toward combat-owned selectors/presentation where applicable.
- **Phase 3 (client UI):** `src/features/combat` as reusable combat-facing UI; Encounter remains workflow shell.
- **Phase 4A–4F:** Intent/result/event contracts; **`applyCombatIntent`** for in-encounter mutations; **`startEncounterFromSetup`** + **`CombatStartupInput`** for startup (distinct from runtime intents); Encounter uses these seams for migrated flows (see [client/local-dispatch.md](./client/local-dispatch.md)).
- **Shared package:** Combat-facing public surface lives in [`@rpg-world-builder/mechanics`](../../../packages/mechanics/README.md) (`applyCombatIntent`, `startEncounterFromSetup`, wire types, canonical state types). See [adr-shared-combat-extraction.md](./adr-shared-combat-extraction.md).

### Server (authoritative persistence, first pass)

- **Stage 3A:** `POST /api/combat/sessions` — startup via shared mechanics, proof of server import.
- **Stage 3B:** Stateless apply-intent smoke (superseded by 3C).
- **Stage 3C:** **Persisted** combat sessions (MongoDB): `sessionId`, monotonic **`revision`**, snapshot **`state`**; **`POST /api/combat/sessions`** creates a session; **`POST /api/combat/sessions/:sessionId/intents`** applies intents with **`baseRevision`**; stale revision → **409**, missing session → **404**. No realtime, no campaign permissions on combat routes yet.

---

## Outstanding work (prioritized themes)

Order is indicative, not a commitment.

### 1. Server: realtime and synchronization (likely “Stage 3D”)

- WebSocket (or equivalent) broadcast of canonical state/results after mutations.
- Reconnect / resync contract (client sends last known revision; server returns snapshot or error).
- Optional: delta vs full snapshot policy.

### 2. Server: permissions and tenancy

- Tie combat sessions to **campaign** (or session) and enforce **who may start or mutate** combat.
- Authenticated routes; avoid anonymous combat mutation in production.

### 3. Client: optional migration to server-backed combat

- Encounter (or a thin adapter) could call HTTP combat APIs instead of (or in addition to) local `applyCombatIntent` / `startEncounterFromSetup` when “live server combat” is enabled.
- UX for **409 stale revision** (refresh state, retry, or merge policy).

### 4. Persistence depth

- **Snapshot-first** is intentional today; **event log / replay** for audit or recovery is not implemented.
- **EncounterState** evolution should stay **schema-versioned** at persistence boundaries (see ADR); explicit migration/version field on stored documents is still a follow-up if snapshots long-lived.

### 5. Package and tooling

- **Narrower `exports` map** and semver policy for `@rpg-world-builder/mechanics` (ADR already defers this).
- **Server TypeScript** may not be fully covered by root `tsc -b`; CI alignment for `server/` typecheck is a quality gap.
- **HTTP wire DTOs** for startup (e.g. `CombatStartupInput` without non-JSON `rng`) could be named exports if API stabilizes.

### 6. Authored content and adapter

- Location floor → combat seed adapter remains a **long-term** seam; see [authored-content/location-floor-adapter.md](./authored-content/location-floor-adapter.md).

### 7. Client deferred feedback

- Optional `action-log-slice` expansion, `registerIntentFailure`, etc., remain in [client/feedback-followups.md](./client/feedback-followups.md).

---

## Current gaps and shortcomings (explicit)

These are **known limitations** as of the last doc update; they are not bugs per se, but boundaries of what is implemented.

| Area | Gap |
|------|-----|
| **Multiplayer** | No socket broadcast; clients do not share one authoritative stream yet. |
| **Permissions** | Combat REST routes do not enforce campaign membership or role; treat as dev/smoke unless gated elsewhere. |
| **Client integration** | Production Encounter still uses **local** dispatch; persisted server combat is **not** wired into the Encounter UI by default. |
| **Stateless apply** | Stage 3B-style “send full state in body” apply path was removed in favor of **session id + revision**; old clients must migrate. |
| **Persistence** | Single snapshot per session; no append-only event log, no replay tooling. |
| **RNG / determinism** | Startup `rng` is not part of JSON; server uses engine defaults. Reproducible seeds for server-side tests/APIs are not fully standardized. |
| **Mechanics surface** | Engine helpers like `createEncounterState` remain **internal** to the package; only the ADR-listed public surface is supported for app/server. |
| **Documentation** | `server/overview.md` does not exist; server narrative lives in [server/authoritative-flow.md](./server/authoritative-flow.md) and this roadmap. |

---

## Historical phase detail (Phases 1–4)

Granular Phase 4A–4F notes and links to older plans lived in **`migration-roadmap.md`**. That file now **points here** so we keep a single roadmap source. For git history, use the repo; for “what we meant by Phase 4C,” see [client/local-dispatch.md](./client/local-dispatch.md) and mechanics `MUTATION_ENTRY_POINTS.md`.

---

## How to use this doc

1. When planning a combat pass, check **Outstanding work** and **Current gaps** first.
2. When finishing a milestone, add a one-line **Completed** bullet and trim or move detail to ADRs or feature READMEs if needed.
3. Keep **architecture** and **ownership** docs stable; this file may change often.
