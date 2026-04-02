# Encounter viewer permissions (client)

## Purpose

Documents the **client-side** viewer identity and capability model for the shared encounter UI (Encounter Simulator and GameSession `/play`). It complements [persisted-intent-sync.md](./persisted-intent-sync.md) and [../game-session.md](../game-session.md).

## Implementation summary

- **`EncounterViewerContext`** carries **`mode`** (`simulator` | `session`), session seat **`viewerRole`** (`dm` | `player` | `observer`), optional **`viewerUserId`**, grid presentation fields (`simulatorViewerMode`, etc.), and **`controlledCombatantIds`** resolved from encounter `CombatantInstance.source` plus session seat.
- **Resolution** happens before policy: `resolveGameSessionEncounterSeat` (game-session) and **`resolveSessionControlledCombatantIds`** (mechanics) produce `controlledCombatantIds`; the simulator sets **`mode: 'simulator'`** and does not rely on that list for turn permissions. When **`GameSession.participants`** does not list a logged-in player (common today), seat is still inferred from **campaign roster** (`ownerUserId`) plus **party combatants** in the encounter (`source.kind === 'pc'`) so controlling players get capabilities on their turn.
- **`deriveEncounterCapabilities`** is a **pure policy** over `EncounterState` + context: simulator grants full turn + DM-tool capabilities; in session, turn actions require **controlling the active combatant**; DM-seat **tools** (hidden info, DM chrome, etc.) stay available for the DM regardless of whose turn it is.
- **`EncounterActiveHeader`** `toolbarVariant` is **presentation only**, derived from **`viewerContext.mode`**, not a separate permission input.
- **`useEncounterActivePlaySurface`** applies the same capability flags to grid movement, action selection, resolve, and end turn so the shell matches the header.
- **Action-resolved toasts** (`registerCombatLogAppended` → `deriveEncounterToastForViewer`) combine **`EncounterViewerContext`** (mode, `controlledCombatantIds`) with log **`actorId` / `targetIds`** so tone, variant, and **`show`** match the viewer’s relationship to the event. Simulator normalization is centralized so one operator still sees actor-facing feedback. Details: [local-dispatch.md § Encounter toasts (viewer-aware)](./local-dispatch.md#encounter-toasts-viewer-aware).

## Server authorization (complement, not duplicate)

Client capabilities remain **UX / policy hints** only. The API enforces **who may submit intents** independently:

- **`POST /api/combat/sessions/:sessionId/intents`** requires **`requireAuth`** (session cookie).
- If a **game session** references this combat via **`activeEncounterId`**, the server loads it with **`findGameSessionByActiveEncounterId`**, loads **approved party roster** via **`getPartyCharacters`** for the same inference as the client, resolves seat (same rules as client `resolveGameSessionEncounterSeat`), and uses **`resolveSessionControlledCombatantIds`** + **`authorizeCombatIntentForGameSession`** ([`server/features/combat/services/combatIntentAuthorization.service.ts`](../../../../server/features/combat/services/combatIntentAuthorization.service.ts)) before **`applyPersistedIntent`**. Forbidden intents return **`403`** with code **`forbidden`**.
- **Orphan combat sessions** (Encounter Simulator / tests — no game session row) still require **authentication**; any logged-in user may submit intents until tighter policy (e.g. campaign id on the combat document) exists.

See also [../server/authoritative-flow.md](../server/authoritative-flow.md).

## Follow-ups (not blockers)

- **Richer seat model:** Session **participant → character ownership** is still minimal. **DM multi-character** and **partial or incomplete roster** scenarios may need schema + resolver changes alongside client and server policy.
- **Client handling of `403`:** `postPersistedCombatIntent` may need explicit **`forbidden`** handling / user messaging when the server rejects an intent.
- **Stricter orphan-session policy:** Optional **`campaignId`** / **`createdByUserId`** on persisted combat documents for membership checks when no game session is linked.
