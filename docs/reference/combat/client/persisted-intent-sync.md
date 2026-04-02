# Persisted session intent sync (GameSession `/play`)

## Purpose

Document how **`POST /api/combat/sessions/:sessionId/intents`** is used when **`useEncounterState`** is wired with **`persistedCombat`** (e.g. GameSession **`/play`**): what is sent on the wire, how the client avoids common failure modes, and how that relates to server limits and mechanics behavior.

For product placement of GameSession vs Encounter Simulator, see [../game-session.md](../game-session.md). For the REST contract at a high level, see [../server/authoritative-flow.md](../server/authoritative-flow.md).

## Flow (summary)

1. The UI applies **`applyCombatIntent`** locally (same as Encounter Simulator) so the table stays responsive.
2. On success, the client **mirrors** the same **`intent`** (and a JSON-safe **`context`**) to the server with **`baseRevision`** equal to the last acknowledged server revision.
3. The server checks **`session.revision === baseRevision`**, runs **`applyCombatIntent`** with the same shape, persists **`nextState`**, and returns the new **`revision`**.

**Local feedback after success** (combat log, action-resolved toasts) is driven by the same local apply path as the simulator; for GameSession **`/play`**, viewer-aware toast policy still uses **`EncounterViewerContext`** (seat, controlled combatants). See [local-dispatch.md § Encounter toasts (viewer-aware)](./local-dispatch.md#encounter-toasts-viewer-aware).

## Client: `postPersistedCombatIntent` (`combatSessionApi.ts`)

- **Slim context:** Before send, **`monstersById`** is stripped from nested **`ApplyCombatIntentContext`** fields (`resolveCombatActionOptions`, `advanceEncounterTurnOptions.battlefieldInterval`, `moveCombatantSpellContext`, `spatialEntryAfterMove`). The catalog is large and was dominating POST body size; functions (**`spellLookup`**, **`buildSummonAllyCombatant`**, **`rng`**) are already absent on the wire because JSON cannot serialize them.
- **Implication:** Server-side resolution uses whatever **`context`** survives JSON. Paths that depended on **`monstersById`** or **`spellLookup`** for parity with the client must either load data server-side later or tolerate reduced parity for those edges until the server injects catalogs and lookups.

## Client: `useEncounterState` (persisted mode)

When **`persistedCombat`** is set:

- **Serialized sync queue:** Each **`postPersistedCombatIntent`** runs **after** the previous request finishes and **`persistedRevisionRef`** is updated from the response. That avoids overlapping POSTs both sending the **same** `baseRevision` (which produces **409 Conflict** / stale revision once the first commit advances the server).
- **Latest state ref:** **`encounterStateRef`** tracks the latest **`EncounterState`** for **`handleMoveCombatant`**, **`handleNextTurn`**, and **`handleResolveAction`**. It is assigned **`encounterStateRef.current = encounterState` during render** (not only in `useEffect`) so handlers never read a **null/stale** ref between paint and effect (which previously blocked movement).
- **Apply outside `setEncounterState` updaters:** Those handlers compute **`applyCombatIntent`** once per user action (using the ref + closure inputs), then **`setEncounterState(result.nextState)`**. This avoids duplicate side effects from development double-invocation of state updaters and keeps persistence aligned with one intent per action.

## Mechanics: JSON context and spell paths

Over HTTP, **`ApplyCombatIntentContext`** is JSON — no **`spellLookup`** / **`rng`** functions. Mechanics code that runs on the server for attached-aura **spatial entry**, **interval**, and related paths **guards** **`spellLookup`** (and similar) with **`typeof … === 'function'`** before invoking, so missing lookups do not throw when **`spatialEntryAfterMove`** or similar objects are still present with only flags (e.g. **`suppressSameSideHostile`**) after serialization.

## Other clients (multiplayer)

Only the client that **POST**s an intent receives the HTTP response with the new **`revision`** and **`state`**. Other participants in the same game session **do not** get that response; they stay in sync by listening for **`game_session_sync`** on the socket layer and **refetching** the same persisted combat snapshot via **`GET /api/combat/sessions/:sessionId`** when the event indicates a newer **`combatRevision`** (see [../game-session.md](../game-session.md) Socket.IO note). Authoritative state remains **server + GET**; the socket is an **invalidation** signal, not a second source of truth.

## See also

- [../game-session.md](../game-session.md) — GameSession **`/play`** and `activeEncounterId`
- [../server/authoritative-flow.md](../server/authoritative-flow.md) — revision checks and 409
- [local-dispatch.md](./local-dispatch.md) — local **`applyCombatIntent`** dispatch
- [../roadmap.md](../roadmap.md) — 409 UX, realtime, server-side catalog injection (still open themes)
