---
name: Viewer-aware encounter toasts
overview: Neutral action-resolved content, viewer relationship + typed policy defaults, explicit suppression, stable dedupe keys, centralized simulator normalization, optional queue contract; AppToast stays presentation-only. No message-copy rewrites in scope.
status: completed
todos:
  - id: neutral-content
    content: "buildActionResolvedNeutralContent: title/narrative/mechanics + outcomeMeta + stable dedupeKey; no tone or viewer phrasing"
    status: completed
  - id: event-identity
    content: "EncounterToastEvent includes dedupeKey (or eventId); hook skips if same key shown for viewer"
    status: completed
  - id: viewer-context-normalize
    content: "Centralize simulator session branching in normalizeToastViewerContext (or deriveEffectiveRelationship); one place only"
    status: completed
  - id: relationship
    content: "deriveViewerRelationshipForActionResolved (actor/target/dm/uninvolved) using log actorId/targetIds"
    status: completed
  - id: defaults-registry
    content: "Typed per-kind defaults (variant, autoHideDuration, suppression baseline); policy overrides per dimension"
    status: completed
  - id: policy-output
    content: "Policy returns explicit dimensions + show boolean; no suppression as hook special-case"
    status: completed
  - id: derive-toast
    content: "deriveEncounterToastForViewer orchestrates defaults + overrides; single entry from registerCombatLogAppended"
    status: completed
  - id: wire-hook
    content: "useEncounterActivePlaySurface + deps; optional queue (enqueue on open, next on close, adjacent dedupe)"
    status: completed
  - id: tests-docs
    content: "Unit tests dedupe/suppression/relationship; local-dispatch.md + pipeline note for future event kinds"
    status: completed
isProject: true
---

# Viewer-aware encounter play-surface toasts (refined plan)

## Implementation status (2026)

Shipped in-repo:

- **Neutral + legacy wrapper:** [`src/features/encounter/helpers/actions/encounter-action-toast.ts`](../../src/features/encounter/helpers/actions/encounter-action-toast.ts) — `buildActionResolvedNeutralContent`, `computeActionResolvedDedupeKey`, `buildEncounterActionToastPayload` (tests).
- **Pipeline:** [`src/features/encounter/toast/`](../../src/features/encounter/toast/) — types, `normalizeToastViewerContext`, `deriveActionResolvedViewerRelationship`, defaults, `applyActionResolvedPolicyDimensions`, `deriveEncounterToastForViewer`; tests under `toast/__tests__/`.
- **Hook:** [`useEncounterActivePlaySurface`](../../src/features/encounter/hooks/useEncounterActivePlaySurface.tsx) — `viewerContext` + `toastViewerInput`, dedupe `Set`, FIFO queue with adjacent key skip, `AppToast` from presentation.
- **Callers:** [`GameSessionEncounterPlaySurface`](../../src/features/game-session/components/GameSessionEncounterPlaySurface.tsx) passes `viewerContext`; simulator active route supplies runtime (includes viewer context).

**Dedupe** is inline refs (no separate `useEncounterToastDedupe` module). **Docs:** [local-dispatch.md](../../docs/reference/combat/client/local-dispatch.md) — *Encounter toasts (viewer-aware)*.

---

## Problem (unchanged)

[`buildEncounterActionToastPayload`](src/features/encounter/helpers/actions/encounter-action-toast.ts) picks **tone** from aggregate hits/misses only; all viewers see the same tone. Targets should see appropriate tones; actors another. Log events expose **`actorId` / `targetIds`**.

**Scope:** No rewrites of existing title/narrative/mechanics strings beyond moving them into the neutral builder.

---

## Guardrails (implementation requirements)

### 1. Stable toast identity / dedupe

- Every **`EncounterToastEvent`** carries a **dedupe key** (or lightweight **event id**) stable for the same logical resolution, e.g. derived from `(round, turn, intent correlation)` or **deterministic hash of flattened log entry ids** for that intent batch.
- The hook (or queue consumer) **skips showing** if the **same dedupe key** was already shown for this viewer in the current session (or within a short window—pick one rule and document it).
- Purpose: safe behavior under **local dispatch**, future **socket-driven** duplicate notifications, and **queueing** without double-fire.

### 2. Suppression is first-class

- Viewer-aware policy returns an explicit **`show: boolean`** (or equivalent) as **part of the policy output type**, not inferred by ad hoc checks inside [`useEncounterActivePlaySurface`](src/features/encounter/hooks/useEncounterActivePlaySurface.tsx).
- When `show === false`, the hook does nothing beyond what the contract requires (no toast state update).

### 3. Separate policy dimensions

- Policy layer outputs **independent fields** (merge from defaults + overrides):
  - **relationship** (or pass-through from prior step)
  - **`tone`**
  - **`variant`**
  - **`autoHideDuration`**
  - **`show` / suppression**
- Avoid a single opaque branch that bundles all of the above; prefer **compose**: defaults → relationship-specific overrides → per-event overrides.

### 4. Centralize simulator normalization

- **One** module (e.g. `normalizeToastViewerContext` or `resolveToastViewerRelationship`) applies **simulator vs session** rules so [`EncounterRuntimeContext`](src/features/encounter/routes/EncounterRuntimeContext.tsx) (`controlledCombatantIds: []`) maps to **current actor-facing behavior** without repeating `mode === 'simulator'` in every toast kind.
- Per–toast-type policies consume **normalized** viewer/relationship inputs only.

### 5. Typed per-event defaults

- Small **default config** per `EncounterToastEvent['kind']`, e.g.:

  - `defaultVariant`
  - `defaultAutoHideDuration`
  - `defaultShow` baseline (e.g. true for `action_resolved` unless policy says otherwise)

- Event-specific policy **overrides only** what differs from defaults.

### 6. Neutral content stays viewer-agnostic

- **`buildActionResolvedNeutralContent`** (name TBD): **only** `title`, `narrative`, `mechanics`, and **outcome metadata** (hit/miss counts, nat1 flags, etc.) for policy—**no tone**, no viewer-specific phrasing.

### 7. Optional queue contract (if implemented or added later)

- **Enqueue** when a toast is **already open** and a new resolved config arrives.
- **On close**, show the **next** queued item.
- **Dedupe adjacent** queue entries with the **same dedupe key** when practical.
- **Out of scope now:** full priority/preemption; document that contract explicitly in code or [`local-dispatch.md`](docs/reference/combat/client/local-dispatch.md).

### 8. Future event contract (documentation)

- Every future encounter toast kind follows the **same pipeline**:
  1. **Neutral event payload** (no tone in builder)
  2. **Relationship derivation** (kind-specific)
  3. **Policy registry entry** (defaults + overrides; explicit `show`)
  4. **`AppToast` props** — presentation only

Add a short subsection to [`local-dispatch.md`](docs/reference/combat/client/local-dispatch.md) (or a `toast/README` under `encounter/toast/`) stating this pipeline—**not** expanding into copy rewrites.

---

## Architecture (refined)

```mermaid
flowchart TD
  log[CombatLogEvent[] + stateAfter]
  neutral[buildActionResolvedNeutralContent + dedupeKey]
  evt[EncounterToastEvent kind action_resolved]
  norm[Normalize viewer / simulator]
  rel[deriveViewerRelationship]
  defaults[Per-kind defaults]
  pol[Policy: relationship plus dimensions plus show]
  merge[Merge defaults with overrides]
  hook[Hook: dedupe by key then show or queue]
  app[AppToast]
  log --> neutral --> evt
  norm --> rel
  evt --> pol
  rel --> pol
  defaults --> merge
  pol --> merge --> hook --> app
```

---

## Files (expected) — **done**

| Action | Path |
|--------|------|
| Add | `src/features/encounter/toast/encounter-toast-types.ts` — events, `dedupeKey`, viewer input, policy I/O with explicit dimensions |
| Add | `src/features/encounter/toast/normalize-toast-viewer.ts` — simulator vs session normalization |
| Add | `src/features/encounter/toast/derive-viewer-relationship.ts` |
| Add | `src/features/encounter/toast/encounter-toast-defaults.ts` — per-kind defaults |
| Add | `src/features/encounter/toast/encounter-toast-policy.ts` — composable policy for `action_resolved` |
| Add | `src/features/encounter/toast/derive-encounter-toast-for-viewer.ts` |
| — | Dedupe: **inline** `shownToastDedupeKeysRef` in hook (no separate `useEncounterToastDedupe` module) |
| Refactor | [`encounter-action-toast.ts`](src/features/encounter/helpers/actions/encounter-action-toast.ts) — neutral builder + legacy wrapper for tests |
| Update | [`useEncounterActivePlaySurface.tsx`](src/features/encounter/hooks/useEncounterActivePlaySurface.tsx) |
| Update | [`GameSessionEncounterPlaySurface.tsx`](src/features/game-session/components/GameSessionEncounterPlaySurface.tsx) + simulator runtime |
| Add | `src/features/encounter/toast/__tests__/derive-encounter-toast-for-viewer.test.ts` |
| Update | [`local-dispatch.md`](docs/reference/combat/client/local-dispatch.md) — *Encounter toasts (viewer-aware)* |

---

## `action_resolved` behavior (unchanged intent)

Actor vs target vs DM vs uninvolved tones as in the prior plan; suppression for uninvolved per **explicit** `show` from policy.

---

## Out of scope

- Message copy rewrites
- Full priority/preemption for queue
