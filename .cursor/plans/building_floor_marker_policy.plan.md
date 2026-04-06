---
name: ""
overview: ""
todos: []
isProject: false
---

# Plan: Building / floor map object policy + strict `marker` stance

## Status (pass 1 — implemented)

Pass 1 is **done** in the repo: placement policy, tests, `**placeObjectBridge`**, `**resolvePlacedKindToAction`**, and `**useLocationEditWorkspaceModel**` placement of draft objects (including `**authoredPlaceKindId**` for table → obstacle) are aligned. **Not** in this plan’s original scope: legacy DB migration, API-level “no maps on building,” and a full placed-kind redesign.

---

## Goal

Align persisted map-object policy with location semantics:

- `**building`** is a **content type that composes floors**. It is **not** a tactical map object host.
- `**floor`** is the **tactical / interior authored map host** for discrete persisted cell objects (`LOCATION_MAP_OBJECT_KIND_IDS`).
- `**marker`** is for **annotation / point-of-interest semantics** on scales where that meaning is real (macro maps), **not** a freeform escape hatch on interior tactical maps.

## Desired policy outcome (persisted kinds)

In `shared/domain/locations/map/locationMapPlacement.policy.ts`, `**ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE`**:


| Host scale     | Allowed persisted object kinds                                     |
| -------------- | ------------------------------------------------------------------ |
| `**building**` | `**[]**` — no map objects                                          |
| `**floor**`    | `**['obstacle', 'door', 'treasure', 'stairs']**` — **no `marker`** |


`marker` remains available only on host scales where POI / annotation semantics apply (e.g. **world**, **region**, **subregion**, **city**, **district**, **site**, **room** — per existing product rules; **not** building, **not** floor).

## 1. Policy stance (explicit)

- `**marker` on `floor` is intentionally removed.** It must not be kept as a vague custom placeholder. Interior tactical authoring should use **obstacle**, **door**, **treasure**, **stairs** (and links/edges/paint as defined elsewhere), not an overloaded `marker`.
- `**marker` on `building`** has no utility and is disallowed together with all other persisted object kinds (`building: []`).
- **Future floor “annotations”** (DM notes, labels, non-tactical pins) must **not** silently reuse `marker`. If needed, introduce a **separate annotation concept** (distinct type, storage, and UI). **Out of scope for pass 1.**

## 2. Implementation (what was done)

### 2.1 Policy + tests

- `**locationMapPlacement.policy.ts`:** `building: []`, `floor` without `marker` (see table above).
- `**shared/domain/locations/__tests__/map/locationMapPlacement.policy.test.ts`:** Asserts empty building, floor list, and `canPlaceObjectKindOnHostScale('floor', 'marker') === false`.

### 2.2 Bridge / mapping

- `**placeObjectBridge.ts`:** `table` + `hostScale === 'floor'` → persisted `**obstacle`** (not `marker`). Palette identity preserved via `**authoredPlaceKindId: 'table'**` on the cell object at save time (see resolver + workspace below).
- `**resolvePlacedKindToAction.ts`:** Object action may include `**authoredPlaceKindId`** when `table` → `obstacle`. Deprecated `**resolveLocationPlacedKindToAction**` passes it through.
- `**useLocationEditWorkspaceModel.ts`:** On place, appends draft objects with `**kind`** + optional `**authoredPlaceKindId**` so policy and persistence stay aligned.

### 2.3 Tests adjusted for new persistence shape

- `**resolveLocationPlacedKindToAction.test.ts`:** Floor **table** expects `**obstacle`** + `**authoredPlaceKindId: 'table'**`.
- `**buildEncounterSpaceFromLocationMap.test.ts**`, `**locationMapAuthoredObjectRender.helpers.test.ts**`, `**cellAuthoringMappers.test.ts`:** Fixtures use `**kind: 'obstacle', authoredPlaceKindId: 'table'`** where representing floor table props.

### 2.4 Server / legacy (unchanged in pass 1; still relevant)

- `**validateCellAuthoringPolicy**` (`locationMaps.service.ts`) validates against the **location row’s scale**. Maps keyed to `**building`** with cell objects conflict with `**building: []**` until migrated or API blocks such maps.
- `**inferAuthoredPlaceKindFromMapCellObject**` (`hydrateGridObjectsFromLocationMap.ts`): legacy `**marker**` / `**door**` branches without `authoredPlaceKindId` still return `**null**` for hydration; old floor `**marker**` rows may need a **data migration** (follow-up).

### 2.5 UI

- `**LocationCellAuthoringPanel`** uses `**getAllowedObjectKindsForHostScale(hostScale)**`; building workspace should pass `**floor**` as host scale so `**marker` does not appear** for interior maps.

## 3. Building vs floor semantics (product story)

- **Building:** floor-composing parent; **not** a persisted map-object host in this policy layer.
- **Floor:** tactical/interior persisted object host for obstacle, door, treasure, stairs.

**Editor behavior:** `useLocationEditWorkspaceModel` / `LocationEditRoute` resolve `**mapHostScaleResolved`** to `**floor**` and `**mapHostLocationIdResolved**` to the **active floor** when editing a building — maps are authored against the floor location, not the building row.

**Optional follow-up:** simulator copy (`SimulatorEncounterSetupSurface`, etc.) can stress “tactical map = first floor under selected building” (`resolveSimulatorMapHostLocationId`). **Optional API follow-up:** reject or relocate `**encounter-grid`** maps stored on `**building**` locations if product forbids it.

## 4. Future extensibility (out of scope for pass 1)

- **Editor-only or DM-only freeform floor annotations** → separate annotation system (not `marker` on floor).

---

## Appendix A: Post–pass 1 — remaining `marker` / floor touchpoints


| Area                                                            | Notes                                                                                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Legacy DB / saves**                                           | Old floor cells with `**kind: 'marker'`** may **fail validation** on re-save. **Migration** is a follow-up.                                                    |
| **Maps on `building` `locationId`**                             | Cell objects invalid under `**building: []**` until migrated or maps moved to floors.                                                                          |
| `**hydrateGridObjectsFromLocationMap**`                         | Still handles `**marker**` in `**inferAuthoredPlaceKindFromMapCellObject**` for legacy read paths.                                                             |
| `**LocationMapEditorPlacePanel**`                               | Fallback icon name `**marker**` only when a palette item omits `**iconName**` — not a policy exception for floor.                                              |
| **Generic tests**                                               | e.g. `**combatGridAuthoredObjects.test.ts`**, `**cellAuthoringMappers.test.ts**` use `**kind: 'marker'**` as arbitrary test data — not asserting floor policy. |
| `**.cursor/plans/map_editor_phase_1_toolbar_c2701fde.plan.md**` | Historical Phase-1 table/marker note; may still say **table → marker** — **stale** vs current bridge; update separately if desired.                            |


## Appendix B: Helpers / bridges (reference)

- `**mapPlacedObjectKindToPersistedMapObjectKind`** — `placeObjectBridge.ts`
- `**resolvePlacedKindToAction**`, `**resolveLocationPlacedKindToAction**` — `resolvePlacedKindToAction.ts`
- `**canPlaceObjectKindOnHostScale**`, `**getAllowedObjectKindsForHostScale**` — `locationMapPlacement.policy.ts`
- `**validateCellAuthoringPolicy**` — `locationMaps.service.ts` (server)
- `**inferAuthoredPlaceKindFromMapCellObject**`, `**buildGridObjectsFromLocationMapCellEntries**` — `hydrateGridObjectsFromLocationMap.ts`
- `**LOCATION_SCALE_MAP_CONTENT_POLICY**`, `**getAllowedPlacedObjectKindsForScale**` — `locationScaleMapContent.policy.ts` (editor palette vocabulary; keep consistent with bridge + placement policy)

## Appendix C: Risks — after pass 1

1. **Mitigated for new authoring:** Policy, bridge, and interactive placement **do not** persist `**marker`** for `**hostScale === 'floor'**`.
2. **Remaining:** **Legacy** floor `**marker`** cells and **building**-scoped maps with objects — **save failures** or manual fix until migration/API rules.
3. **Two vocabularies:** `**LOCATION_PLACED_OBJECT_KIND_IDS`** vs `**LOCATION_MAP_OBJECT_KIND_IDS**` — the **bridge** remains the translation layer; `**authoredPlaceKindId`** carries palette id when `**kind` differs (e.g. table).

---

## Completion criteria (pass 1)

- `building: []`, `floor: ['obstacle', 'door', 'treasure', 'stairs']` in placement policy.
- Tests updated; no test encodes **new** floor behavior as **marker** for table (table → **obstacle** + `**authoredPlaceKindId`**).
- **placeObjectBridge** updated so **floor** placement does not persist `**marker`** for table; resolver + workspace carry `**authoredPlaceKindId`** where needed.
- Implementer report captured in conversation + this doc’s Appendix A/C for follow-ups.

## Recommended follow-ups (not pass 1)

- Migrate or grandfather legacy floor `**marker**` (and `**marker` + `authoredPlaceKindId: 'table'**`) rows.
- Decide **map ownership** for buildings: API guard and/or migrate maps from building rows to floor rows.
- Optionally persist `**authoredPlaceKindId: 'tree'`** for city **tree → marker** for symmetric hydration.
- Refresh `**map_editor_phase_1_toolbar_c2701fde.plan.md`** if it still documents table → marker on floor.

