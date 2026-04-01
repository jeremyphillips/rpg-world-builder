# Action prep vs commit (Phase 4C)

Short classification for the client combat intent seam. Authoritative execution lives in the combat application layer; Encounter owns workflow and **UI-local** state until the user commits.

## A — UI-local preparation

**Owner:** Encounter / React state (not combat intents).

Examples:

- Hover over grid cells or tokens
- Drawer open/closed, expanded rows
- `aoeStep` before the user confirms placement
- Temporary target selection (before resolve)
- Temporary AoE / placement preview
- Modal visibility

These do **not** change canonical combat truth until folded into a committed intent.

## B — Confirmed input normalization

**Owner:** Encounter hook or a **pure** helper that maps confirmed UI/hook fields into engine-shaped data.

Examples:

- Building the payload that matches `ResolveCombatActionSelection` (actor, `actionId`, optional targets, AoE cell, caster options, spawn cell, object anchor, unaffected ids)
- Trimming strings, filtering empty optional fields

This is still **not** engine execution—only shaping inputs for dispatch.

## C — Authoritative execution

**Owner:** `src/features/mechanics/domain/combat/application/` + shared engine.

Examples:

- `applyCombatIntent` → `applyResolveActionIntent` → `resolveCombatAction`
- Same stack for end turn and movement (`applyEndTurnIntent`, `applyMoveCombatantIntent`)

## Unified commit path for actions

All action categories that ultimately call **`resolveCombatAction`** share the **same** client commit path today:

`handleResolveAction` → `ResolveActionIntent` → `applyCombatIntent` → `applyResolveActionIntent` → `resolveCombatAction`.

AoE origin, spawn/single-cell placement, and caster options are **fields on** `ResolveActionIntent` (via `ResolveCombatActionSelection`), not separate intent kinds, unless a later phase introduces dedicated intents.

## See also

- [`MUTATION_ENTRY_POINTS.md`](./MUTATION_ENTRY_POINTS.md)
- [`docs/reference/combat/client/local-dispatch.md`](../../../../../docs/reference/combat/client/local-dispatch.md)
