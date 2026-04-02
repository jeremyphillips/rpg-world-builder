# Encounter viewer permissions (client)

## Purpose

Documents the **client-side** viewer identity and capability model for the shared encounter UI (Encounter Simulator and GameSession `/play`). It complements [persisted-intent-sync.md](./persisted-intent-sync.md) and [../game-session.md](../game-session.md).

## Implementation summary

- **`EncounterViewerContext`** carries **`mode`** (`simulator` | `session`), session seat **`viewerRole`** (`dm` | `player` | `observer`), optional **`viewerUserId`**, grid presentation fields (`simulatorViewerMode`, etc.), and **`controlledCombatantIds`** resolved from encounter `CombatantInstance.source` plus session seat.
- **Resolution** happens before policy: `resolveGameSessionEncounterSeat` (game-session) and **`resolveSessionControlledCombatantIds`** (mechanics) produce `controlledCombatantIds`; the simulator sets **`mode: 'simulator'`** and does not rely on that list for turn permissions.
- **`deriveEncounterCapabilities`** is a **pure policy** over `EncounterState` + context: simulator grants full turn + DM-tool capabilities; in session, turn actions require **controlling the active combatant**; DM-seat **tools** (hidden info, DM chrome, etc.) stay available for the DM regardless of whose turn it is.
- **`EncounterActiveHeader`** `toolbarVariant` is **presentation only**, derived from **`viewerContext.mode`**, not a separate permission input.
- **`useEncounterActivePlaySurface`** applies the same capability flags to grid movement, action selection, resolve, and end turn so the shell matches the header.

## Post-build follow-ups (not blockers)

These are **explicit next steps**, not defects in the current client layering.

- **Server authorization:** The API must **enforce encounter action authorization independently** of client capabilities. Current capability gating is **client UX / policy only** and must not be treated as security.
- **Richer seat model:** Session **participant → character ownership** is still incomplete. **DM multi-character** and **partial or incomplete roster** scenarios may need a richer seat/control model than the minimal rules used today.
- **`EncounterViewerRole` alias:** The name **`EncounterViewerRole`** is **temporarily retained** as a **deprecated alias** of **`EncounterSessionSeat`** for compatibility with existing imports. **Remove it** after downstream migrations are complete.
- **Server-side tests:** Add or schedule **server-side authorization tests** for at least **move active combatant**, **resolve action**, and **end turn**, covering **DM**, **controlling player**, and **non-controlling player** cases.
