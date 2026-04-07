---
name: Linked place flow — rail-first (remove modal)
overview: Replace cell-click → linked-location modal with immediate marker placement and OptionPickerField on the object inspector (Selection rail). Aligns map rendering and selection with other placed objects; drops pending-placement modal and legacy dual-path (linked icon vs object). No backward-compat migration.
isProject: false
implementationStatus: not-started
---

# Bugfix plan: Linked city / site / building — placed-object branch + rail link picker

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)

**Status:** **Not implemented** — `LocationMapEditorLinkedLocationModal`, `pendingPlacement`, and `kind: 'link'` are still present (`placementRegistryResolver.ts`, `resolvePlacedKindToAction.ts`, `useLocationEditWorkspaceModel.ts` ~809, `LocationEditRoute.tsx` modal wiring).

---

## Problem statement

Placing a **linked-content** registry family (`city`, `site`, families with `linkedScale`) uses `resolvePlacementCellClick` → **`kind: 'link'`** → **`pendingPlacement`** → **`LocationMapEditorLinkedLocationModal`**. On confirm, only **`linkedLocationByCellId[cellId]`** is set; **no** `objectsByCellId` entry is created. The map renders the **linked-location** icon branch instead of the **placed-object** branch (`data-map-object-id`, tooltip, object select).

**Target behavior:** Cell click **always** appends a **real cell object** (marker + `authoredPlaceKindId`). The user picks the campaign location in **Selection → object inspector** via **`OptionPickerField`** (`maxItems={1}`), updating **`linkedLocationByCellId`**.

**Picker field labels** (from registry **`linkedScale`**, not palette titles):

| `linkedScale` | Label |
|---------------|--------|
| `city` | Linked city |
| `building` | Linked building |
| `site` | Linked site |

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Remove modal + `pendingPlacement` link flow | Migrating old saved maps |
| Persistence: `city` / `site` → `marker` + `authoredPlaceKindId` via shared helpers | `linkedLocationId` on `LocationMapCellObjectEntry` (keep cell-level `linkedLocationByCellId`) |
| `OptionPickerField` on **`LocationMapObjectInspector`** (`LocationMapSelectionInspectors.tsx`) | Link UI on **`LocationCellAuthoringPanel`** (empty / fill-only cell) |
| Controlled **`OptionPickerField`** unless RHF is required | Broad changes to global link policy beyond existing filters |
| **`docs/reference/location-workspace.md`** updated for the new flow | — |

**Workspace rules:** Persistable edits go through **`gridDraft`** and explicit callbacks ([`location-workspace.md`](../../../docs/reference/location-workspace.md) — state ownership). Do not add a second hidden source of truth.

---

## Target architecture

1. **Cell click:** Only **`append-object`**. Remove **`kind: 'link'`** from `PlacementCellClickResult` and from `handleAuthoringCellClick` paths that call **`setPendingPlacement`**.
2. **`resolvePlacedKindToAction`:** No **`type: 'link'`** for `linkedScale` families — only **`type: 'object'`** via **`buildPersistedPlacedObjectPayload`** after persistence maps **`city` / `site`** → **`marker`** and **`getAuthoredPlaceKindIdForPersistedPayload`** returns the authored kind ids.
3. **Draft:** **`linkedLocationByCellId`** is edited in the rail; clear it when the linked marker is removed or erased (same update as object removal where applicable).
4. **Options:** Extract shared **`getLinkedLocationPickerOptions(...)`** from today’s **`buildLocationEditLinkModalSelectOptions`** / `locationEditLinkModalOptions.ts` so campaign scoping and **`getAllowedLinkedLocationOptions`** behavior match the modal.

---

## Execution order (do in this order)

### 1. Persistence (unblocks resolver)

- [ ] `src/features/content/locations/domain/model/placedObjects/locationPlacedObject.persistence.ts` — `mapPlacedObjectKindToPersistedMapObjectKind` / `getAuthoredPlaceKindIdForPersistedPayload`: support **`city` / `site`** (→ `marker` + authored kind) for relevant host scales.

### 2. Placement domain — remove `link` outcome

- [ ] `src/features/content/locations/domain/authoring/editor/placement/resolvePlacedKindToAction.ts` — Remove **`type: 'link'`** branch and downstream handling (`r.type === 'link'`).
- [ ] `src/features/content/locations/domain/authoring/editor/placement/placementRegistryResolver.ts` — Remove **`kind: 'link'`** from union and implementation; **`resolvePlacementCellClick`** returns object-append only for linked families.

### 3. Session + route — drop modal pipeline

- [ ] `src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts` — Remove **`outcome.kind === 'link'`** / **`setPendingPlacement`** for links; remove or repurpose **`linkModalSelectOptions`** if only used for the modal (rail may need options from a new helper).
- [ ] `src/features/content/locations/domain/authoring/editor/state/useLocationMapEditorState.ts` — Remove **`pendingPlacement`** / **`setPendingPlacement`** if unused after grep (confirm no other features).
- [ ] `src/features/content/locations/routes/LocationEditRoute.tsx` — Remove modal props assembly (`open` / `pending` / confirm handlers tied to **`pendingPlacement`**).
- [ ] `src/features/content/locations/components/workspace/LocationEditHomebrewWorkspace.tsx` — Remove **`linkedLocationModal`** prop and **`<LocationMapEditorLinkedLocationModal />`**.
- [ ] Delete `src/features/content/locations/components/workspace/rightRail/linkedLocation/LocationMapEditorLinkedLocationModal.tsx`; trim `rightRail/linkedLocation/index.ts`, `rightRail/index.ts`, `components/index.ts` exports.
- [ ] `src/features/content/locations/routes/locationEdit/locationEditLinkModalOptions.ts` — Move option-building into a shared **`getLinkedLocationPickerOptions`** (or similar); delete modal-only types if nothing else needs them.

### 4. Map overlay

- [ ] `src/features/content/locations/components/mapGrid/LocationMapCellAuthoringOverlay.tsx` — For cells that have the placed-object marker for linked families, rely on **object** rendering; remove redundant **linked-only** icon path when the object is present. (No migration: orphan link-without-object is acceptable per prior plan.)

### 5. Selection rail

- [ ] `src/features/content/locations/components/workspace/rightRail/selection/LocationEditorSelectionPanel.tsx` → **`LocationMapObjectInspector`**: pass **`onUpdateLinkedLocation`**, option list inputs (or memoized options), and **`linkedScale`**-derived label.
- [ ] `LocationMapSelectionInspectors.tsx` — **`OptionPickerField`**: `maxItems={1}`, value as `string[]` length 0–1 ↔ **`linkedLocationByCellId[cellId]`**; empty state when non-campaign matches modal (**[]** options).
- [ ] Wire remove-object / erase paths to clear **`linkedLocationByCellId[cellId]`** when the linked marker goes away (avoid stale links).

### 6. Tests

- [ ] `src/features/content/locations/domain/authoring/editor/__tests__/placement/placementRegistryResolver.test.ts` — expect **object** append, not **`kind: 'link'`**.
- [ ] `src/features/content/locations/domain/authoring/editor/__tests__/placement/resolveLocationPlacedKindToAction.test.ts` — expect **`type: 'object'`** for linked families.
- [ ] `shared/domain/locations/__tests__/map/locationMapPlacement.policy.test.ts` — adjust if policy assertions referenced link placement.
- [ ] Add or extend tests for object inspector picker + callback (colocate with existing Selection / inspector tests if present).

### 7. Docs

- [ ] `docs/reference/location-workspace.md` — Replace any **modal / pending placement** description with **immediate marker + Selection rail `OptionPickerField`**; note `LocationEditRoute` / workspace wiring changes.

---

## Deferred (explicit)

**One link per `cellId` vs multiple objects:** `linkedLocationByCellId` is keyed by cell, not object id. This work keeps a **single** link per cell; per-object links need a model change later.

---

## Risks (verify before merge)

1. **Erase / delete** — Clearing **`linkedLocationByCellId`** when the marker is removed.
2. **Non-campaign** — Empty options + copy, same as modal.
3. **`pendingPlacement`** — Grep repo-wide before deleting state.
4. **Naming** — Palette **building** (map-object family) ≠ label **“Linked building”** (**`linkedScale === 'building'`** only).

---

## Acceptance criteria

1. Placing linked families **never** opens a modal; a **marker** object appears on first click.
2. **Selection → object inspector** shows **`OptionPickerField`** with the **Label mapping** table; **`maxItems={1}`**; updates **`linkedLocationByCellId`**.
3. Map uses **object** hit-testing / tooltip / **`data-map-object-id`** like other markers.
4. Modal, **`kind: 'link'`**, and link-specific **`pendingPlacement`** removed; tests and **`docs/reference/location-workspace.md`** updated.
