---
name: Spatial blocking LoS integration
overview: Introduce layered spatial helpers (raw cell reads + composed predicates over cell flags, grid objects, and edges). Extend hasLineOfSight as the single geometric LoS gate for perception and placement. Extend movement to validate full supercover path clearance (cells entered + edge crossings), not destination-only. Shared supercover/adjacency geometry for LoS vs movement; distinct blocking policies per concern. Update docs/reference/space.md to match behavior and layering.
todos:
  - id: helpers-layering
    content: Raw readers + composed predicates (cellOpaqueToSight, cellMovementBlocked, edge crossing); grid-object + edge modules
    status: pending
  - id: los-hasLineOfSight
    content: Extend hasLineOfSight (interiors + segments); keep cellBlocksSight as raw; update sight tests
    status: pending
  - id: movement-path
    content: movementPathClear + wire canMoveTo, selectCellsWithinDistance, getMoveRejectionReason, placeCombatant
    status: pending
  - id: placement-split
    content: Separate destination validity vs LoS; unify placement/AoE terrain checks without collapsing predicates
    status: pending
  - id: tests
    content: Explicit matrix edge/window/grid/path/diagonal; note tests that assumed destination-only movement
    status: pending
  - id: docs-space-md
    content: Update docs/reference/space.md for LoS, movement path, edges vs grid objects vs cell flags
    status: pending
isProject: false
---

# Spatial blocking and LoS integration (tightened plan)

## Architectural anchors (do not drift)

- `**hasLineOfSight**` remains the **shared geometric gate** for:
  - perception (`lineOfSightClear` → `hasLineOfSight`)
  - placement / AoE when `lineOfSightRequired` (`isValidSingleCellPlacementPick`, `validateSingleCellPlacement`, action-requirement model)
- **Movement** validates the **full supercover path** from current cell to target (cells **entered** + **segment** edge crossings), **not** destination-only.
- **Raw** cell-flag reads and **composed** runtime predicates are **distinct layers** — see [Helper naming and layering](#helper-naming-and-layering).

## 1. Source-of-truth clarity


| Layer                                                                  | Role                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**EncounterCell` flags** (`kind`, `blocksSight`, `blocksMovement`, …) | **Transitional compatibility / denormalized** inputs from legacy flows and some map hydration. **Not** the intended long-term **sole** source of truth for “what blocks” on the tactical grid. |
| `**GridObject`** (`blocksMovement`, `blocksLineOfSight`, …)            | **First-class** runtime spatial content for placed props (resolved from authored/runtime defaults).                                                                                            |
| `**EncounterEdge`** (`blocksMovement`, `blocksSight`, `kind`, …)       | **First-class** runtime spatial content for walls / doors / windows **between** cells.                                                                                                         |


**Composed helpers must combine all three** where relevant:

- **LoS interior opacity:** `cell` terrain flags **+** grid objects in that cell (`blocksLineOfSight`).
- **Movement “enter this cell”:** `cell` kind/flags **+** grid objects (`blocksMovement`).
- **Segment crossing:** **edges** between consecutive cells on the path (orthogonal step, or **diagonal corner rule** — see [Risks](#risks-and-compatibility)).

Implementers: after this pass, **document in code** any remaining reliance on **denormalized** `EncounterCell` blocking that duplicates edge/grid semantics (compatibility), and point to a future **derived projection** pass.

## 2. Path validity vs destination validity vs edges vs LoS

Keep these **separate concepts** — do **not** collapse into one opaque “blocked” predicate.


| Concept                                     | Meaning                                                                                                                                   | Typical use                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Destination passability / occupiability** | May a token **stand** on this cell? (terrain + grid movement blockers; not edge traversal).                                               | `placeCombatant`, AoE origin cell, single-cell placement **terrain** leg.       |
| **Path clearance (movement)**               | Along the **supercover** path from `from` → `to`, every **entered** cell allows movement, and every **segment** allows movement crossing. | `canMoveTo`, `movementPathClear`, `selectCellsWithinDistance`.                  |
| **Edge crossing validity**                  | For adjacent cells (orthogonal or diagonal), do **edges** between them allow movement / sight **across that step**?                       | Shared segment helpers; **policy differs** for sight vs movement (e.g. window). |
| **Line-of-sight clearance**                 | Same supercover **geometry** as movement path; **sight** policy on interiors + segments (`hasLineOfSight`).                               | Perception, placement LoS requirement.                                          |


**Occupancy** (e.g. `getOccupant`) remains **orthogonal** — destination may be passable but occupied.

## 3. Shared geometry, different policy

- **Geometry:** Reuse **supercover cell sequence** (`gridCellsAlongSupercoverLine` / same path as today’s `hasLineOfSight`) for:
  - **LoS** (`hasLineOfSight`)
  - **Movement path** (`movementPathClear` or equivalent)
- **Policy differs:**
  - **Sight:** interior `cellOpaqueToSight` (terrain + `GridObject.blocksLineOfSight`); segment `edgeCrossingBlocksSight` (or composed name).
  - **Movement:** interior `cellMovementBlockedForPath` (terrain + `GridObject.blocksMovement`); segment `edgeCrossingBlocksMovement`.

**Explicit examples (first pass):**


| Situation       | Movement                   | LoS                                                                             |
| --------------- | -------------------------- | ------------------------------------------------------------------------------- |
| **Wall edge**   | Blocks crossing            | Blocks crossing                                                                 |
| **Window edge** | Blocks crossing            | Does **not** block crossing (builder sets `blocksSight: false` on window edges) |
| **Grid object** | Uses `blocksMovement` only | Uses `blocksLineOfSight` only (independent booleans)                            |


## 4. Helper naming and layering

### Raw (cell-flag readers only — no grid objects, no edges)

- Keep `**cellBlocksSight(space, cellId)`** in `[space.sight.ts](packages/mechanics/src/combat/space/sight/space.sight.ts)` as the **raw** `EncounterCell.blocksSight` (and missing-cell) resolver.
- Optionally add `**cellKindBlocksMovement(cell)`** / `**readCellBlocksMovementFlag(cell)`** if it clarifies “only `EncounterCell` fields” vs composed behavior.

### Composed policy helpers (not renamed flag reads)

These **intentionally** combine sources:


| Name (suggested)                                                                      | Composes                                                                                       | Notes                                                            |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `**cellOpaqueToSight(space, cellId)`**                                                | `cellBlocksSight` **OR** any grid object with `blocksLineOfSight`                              | **LoS interior** only; **not** a synonym for `cellBlocksSight`.  |
| `**cellMovementBlockedForEntering(space, cellId)`** (or `cellBlocksMovementComposed`) | `cell.kind` wall/blocking, `cell.blocksMovement`, **OR** any grid object with `blocksMovement` | **Entering** this cell for movement path; **not** edge crossing. |


**Rename note:** if `cellBlocksMovementForCombat` reads too much like a single flag, prefer `**cellMovementBlockedForEntering`** vs `**cellDestinationBlockedForMovement`** for destination-only checks.

### Edge primitives

- `**findEncounterEdgeBetween(space, a, b)**` — orthogonal adjacency; optional second helper for **diagonal corner** (two orthogonal edges).
- `**segmentSightBlocked(space, fromCellId, toCellId)`** — orthogonal edge or diagonal two-edge rule for **sight**.
- `**segmentMovementBlocked(space, fromCellId, toCellId)`** — parallel for **movement**.

**Grid object primitives** (in `[space.helpers.ts](packages/mechanics/src/combat/space/space.helpers.ts)` or `gridObjectSpatial.ts`):

- `findGridObjectsAtCell(space, cellId)`
- `cellHasMovementBlockingGridObject` / `cellHasSightBlockingGridObject` — or inline only if trivial; prefer named for tests.

### Orchestrators

- `**hasLineOfSight`** — uses supercover + `cellOpaqueToSight` on **interiors** + **segment** sight checks for **every** consecutive pair on path.
- `**movementPathClear`** — same supercover + `cellMovementBlockedForEntering` on **entered** cells + **segment** movement checks.

## 5. Doors and future state

- **First pass:** match **builder output** for `[edgeToEncounterEdge](src/features/game-session/combat/buildEncounterSpaceFromLocationMap.ts)`: doors currently **permissive** (`blocksMovement` / `blocksSight` false) = **open door** as **data convention**, not a permanent rule.
- **Implementation constraint:** keep edge lookup and segment checks **state-ready** (e.g. central functions that read `EncounterEdge` fields; avoid hard-coding “door” as always open in scattered `if` chains). Future **open/closed** attaches to **edge records** or a parallel field — **do not** document door semantics as fixed forever in code comments; use “first pass / open-door convention”.

## 6. Compatibility behavior

- **Denormalized `EncounterCell` blocking** (e.g. authored hydration mirroring props onto cells) may **remain** for older saves. The implementer must **call out in PR / comments** where behavior still **depends** on cell flags **duplicating** edge/grid logic.
- **Goal after pass:** new rules should be **correct** when `gridObjects` and `edges` are populated; cell flags are **additive** compatibility, not the only path.

## 7. Implementation outline

### LoS — `[space.sight.ts](packages/mechanics/src/combat/space/sight/space.sight.ts)`

1. Keep `gridCellsAlongSupercoverLine` / `traceLineOfSightCells`.
2. Interiors: indices `1 .. n-2` use `**cellOpaqueToSight`** (not raw `cellBlocksSight` alone).
3. Segments: for each consecutive pair on path, apply **sight** segment policy (orthogonal + diagonal corner rule).
4. Document: `**cellBlocksSight`** = raw; `**hasLineOfSight`** = composed.

### Movement — `[space.selectors.ts](packages/mechanics/src/combat/space/selectors/space.selectors.ts)`

- `**movementPathClear`:** supercover + entered-cell movement composition + movement segment policy.
- `**canMoveTo`:** distance/budget + `**movementPathClear`** + destination occupancy.
- `**selectCellsWithinDistance`:** filter with `**movementPathClear`** (and occupancy) so highlights match `**canMoveTo`**.
- `**getMoveRejectionReason`:** return `**Blocked`** when path fails.
- `**placeCombatant`:** destination must pass **destination** passability (composed + kind), not full path from nowhere (placement is not a move from a cell — **only destination**).

### Placement / AoE

- `**isValidSingleCellPlacementPick`:** (1) **destination** passability + occupancy + range, (2) `**hasLineOfSight`** if required — **two separate predicates** in code.
- `**validateSingleCellPlacement`:** same decomposition; no single mega-predicate.
- `**isValidAoeOriginCell`:** destination passability aligned with “stand here” rules + LoS uses **shared** helpers where applicable.

### Perception

- `[visibility-los.ts](packages/mechanics/src/combat/state/visibility/visibility-los.ts)` / `[evaluatePerceiveTargetOccupantForCombat](packages/mechanics/src/combat/state/visibility/combatant-pair-visibility.ts)`: **no change** if `hasLineOfSight` is the single geometric gate.

## 8. Tests (explicit matrix)

Add or extend tests so **each** of the following has at least one dedicated case:


| Test theme                         | Assert                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Edge-blocked LoS**               | Wall edge on segment clears LoS false when line crosses it.                                                       |
| **Window**                         | Sight crosses; **movement** crossing segment blocked.                                                             |
| **Grid object — intermediate LoS** | `GridObject` with `blocksLineOfSight` on **intermediate** cell blocks `hasLineOfSight` even if cell flag is open. |
| **Long Chebyshev move**            | Intermediate **wall/edge** blocks `movementPathClear` / `canMoveTo` though destination is open.                   |
| **Diagonal corner rules**          | Two-edge rule: blocking either cardinal edge blocks diagonal step for sight/movement per policy.                  |


**Regression:** Any test that assumed **destination-only** movement (long step with **wall** in between) **must** expect updated behavior — **list those files** during implementation (e.g. `canMoveTo` tests, movement UI tests, `selectCellsWithinDistance`).

## 9. Documentation — `[docs/reference/space.md](docs/reference/space.md)`

**In scope for this pass:** update the spatial reference so it stays accurate for the **next agent** and humans.

Suggested content updates:

- **Line of sight:** Describe `hasLineOfSight` as **composed** — supercover path, **interior** opacity (`cellOpaqueToSight`: cell flags + grid objects), **segment** checks (`EncounterEdge` / diagonal rule). Note raw `cellBlocksSight` vs composed behavior.
- **Movement:** `canMoveTo` / reachability use **full path** (`movementPathClear`), not destination-only; link to `selectCellsWithinDistance` behavior.
- **Source of truth:** Short subsection — `EncounterCell` flags as **transitional** where relevant; `**GridObject`** and `**EncounterEdge**` as first-class; **do not** imply cell flags alone define blocking.
- **Edges:** Wall / door / window semantics at a high level (movement vs LoS; door first-pass convention), without duplicating full code.
- **Limitations / follow-up:** Cover still deferred; derived projection of cell flags from objects + edges + terrain remains future work.

Keep the doc **concise** (reference style, not a second design doc).

## 10. Files likely touched


| Area                 | Files                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spatial + sight      | `[space.helpers.ts](packages/mechanics/src/combat/space/space.helpers.ts)`, new `spatial/edgeCrossing.ts` (or split), `[space.sight.ts](packages/mechanics/src/combat/space/sight/space.sight.ts)`     |
| Movement / placement | `[space.selectors.ts](packages/mechanics/src/combat/space/selectors/space.selectors.ts)`, `[action-requirement-model.ts](packages/mechanics/src/combat/resolution/action/action-requirement-model.ts)` |
| Barrel               | `[space/index.ts](packages/mechanics/src/combat/space/index.ts)`                                                                                                                                       |
| Tests                | `[space.sight.test.ts](packages/mechanics/src/combat/space/__tests__/sight/space.sight.test.ts)`, new movement/path tests, grep for old movement assumptions                                           |
| **Documentation**    | `[docs/reference/space.md](docs/reference/space.md)` — see [§9](#9-documentation-docsreferencespacemd)                                                                                                 |


## 11. Follow-up (out of scope here)

- **Cover:** `GridObject.coverKind` — attack resolution, not this pass.
- **Derived projection:** single writer that computes `EncounterCell` from terrain + `gridObjects` + `edges`.

---

## Risks and compatibility notes

### Diagonal rules

- **Diagonal** steps on the supercover path have **no** single `EncounterEdge` between the two diagonal cells. The **two orthogonal edges** corner rule is a **gameplay choice**; document it in code. If playtests want **different** diagonal rules, only the segment helpers change.

### Double-counting

- Maps may **both** set a **wall edge** and mark a **cell** as blocking — composed predicates should remain **consistent**; prefer **segment edges** for walls and **cell** for terrain/props where possible.

### Performance

- `selectCellsWithinDistance` calling `**movementPathClear`** per candidate is **O(cells × path length)** — acceptable for typical encounter grids; note if profiling needed later.

