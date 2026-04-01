# Deferred client feedback enhancements

This note records **optional** follow-ups for richer feedback from the combat application seam. They are **not** required for the seam to be valid: success paths already expose `CombatIntentResult`, `CombatEvent` (including `log-appended`), and Encounter registers log/toast via `registerCombatLogAppended` after Phase 4D flattening.

See also: [local-dispatch.md](./local-dispatch.md), [../engine/intents-and-events.md](../engine/intents-and-events.md).

---

## `action-log-slice`

**What it is:** A narrow `CombatEvent` variant (`kind: 'action-log-slice'`) that can carry **`entryTypes`** — the set of `CombatLogEventType` values appended during a resolution — as a lightweight summary alongside full `log-appended` rows.

**Where it lives:** Emitted from the application layer (e.g. [`apply-resolve-action-intent.ts`](../../../../src/features/mechanics/domain/combat/application/apply-resolve-action-intent.ts)) when useful; type definition is in [`combat-intent-result.types.ts`](../../../../src/features/mechanics/domain/combat/results/combat-intent-result.types.ts).

**What it could enable (future):**

- Toast or banner copy keyed off entry categories without re-deriving from raw log lines
- Short action-result summaries for UI that does not want to parse full `CombatLogEvent` payloads
- Parity between “what happened” summaries and log rows without a broad combat log UI rewrite

**Why it is optional:** Phase 4D already merges all `log-appended` chunks for one successful intent and passes them to `buildEncounterActionToastPayload`. Consumers can derive presentation from those rows today.

**Why it was deferred from 4C/4D:** Those phases focused on seam hardening, committed action path, and single microtask / flattened log feedback — not on new consumer surfaces for summary metadata.

**Likely phase:** A future refinement pass when product wants toast/summary behavior driven explicitly by canonical entry-type summaries rather than heuristics on log text.

---

## `registerIntentFailure`

**What it is:** A possible **Encounter-side** API (parallel to `registerCombatLogAppended`) that registers a callback invoked when `applyCombatIntent` returns **`ok: false`**, passing structured **`CombatDispatchError`** and/or **`CombatValidationIssue`** lists so the UI can show validation toasts, inline hints, or telemetry.

**Problem it would solve:** Today, failure paths in [`useEncounterState`](../../../../src/features/encounter/hooks/useEncounterState.ts) typically **preserve previous state** (`return prev`) without surfacing `result.error` to the route — so illegal moves, validation failures, or `not-implemented` intents are easy to miss in the UI.

**Why the architecture can defer it:** Local single-player flows often rely on UI affordances that prevent invalid commits; silent no-op is acceptable until explicit failure UX is prioritized. The seam already returns full error shapes; nothing blocks adding a hook later without changing engine contracts.

**Where it would fit:** React hook / route layer — same ownership as `registerCombatLogAppended`. It would **not** live inside `applyCombatIntent` (which stays pure).

**Relation to the application seam:** `CombatIntentResult` already discriminates success vs failure and carries `CombatDispatchError`. A future `registerIntentFailure` would only **wire** that result to UI feedback, not redefine outcomes.

**Likely phase:** A small client pass after product defines how failures should present (toast vs inline vs modal), or when multiplayer requires visible rejection reasons.

---

## Encounter start by intent (related deferral)

Routing **`handleStartEncounter`** through `applyCombatIntent` (or a dedicated startup applicator) is **out of scope** for Phase 4E by default. It needs a new intent or entry point, canonical payload for roster + space/options, and broader tests — typically tracked as **Phase 4F or later**. See [`migration-roadmap.md`](../migration-roadmap.md) and [`MUTATION_ENTRY_POINTS.md`](../../../../src/features/mechanics/domain/combat/application/MUTATION_ENTRY_POINTS.md).
