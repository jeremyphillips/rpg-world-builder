---
name: Location editor rail refactor
overview: Right-rail architecture only — Location / Map / Selection sections, derived lightweight LocationMapSelection, event-driven auto-switch, no hit-testing or selection-system expansion.
todos:
  - id: inspect-route-rail
    content: Inspect LocationEditorMapRailTabs + both LocationEditRoute right-rail sites
  - id: rail-section-state
    content: Replace mapRailTab with string railSection (LocationEditorRailSection) in route
  - id: types-derive
    content: Add LocationEditorRailSection, LocationMapSelection placeholders + deriveLocationMapSelection(selectedCellId)
  - id: rail-component-api
    content: Refactor rail tabs component to Location/Map/Selection API; map numeric AppTabs internally
  - id: selection-dispatcher
    content: Add LocationEditorSelectionPanel wrapping LocationCellAuthoringPanel for cell; placeholders for region/path/object
  - id: move-place-panel
    content: Move LocationMapEditorPlacePanel to Map section only; modest empty/hint when mode !== place
  - id: auto-switch
    content: Event-driven only — wrap setMode (Place→Map), cell callback→Selection; no useEffect sync
  - id: tests
    content: Focused tests for deriveLocationMapSelection + tiny auto-switch helper if extracted
---

# Location editor right rail: Location / Map / Selection (refined)

Baseline: separate **railSection** from **editorMode** (`useLocationMapEditorState`), move map-authoring UI out of Location metadata, future-ready **Selection** without implementing region/path/object behavior.

**Scope guard:** This slice is **structural only** — right-rail architecture cleanup. Do **not** drift into broader selection-system implementation, hit-testing, or new selection wiring.

---

## Principles (refinements)

1. **Structural, not feature-expanding** — Goals: rail vs mode separation, Metadata/Cell → Location/Map/Selection, Selection future-ready **without** implementing region/path/object selection.
2. **Lightweight derived `LocationMapSelection`** — UI-oriented union; derive **only** from `gridDraft.selectedCellId` → `none` | `cell`. **region** / **path** / **object** remain **structural placeholders** in the type only; no new hit-testing or selection wiring.
3. **Panel responsibility first** — Explicit in naming, props, and brief comments:
   - **Location** = location-level metadata only
   - **Map** = map authoring options / palette ( **`LocationMapEditorPlacePanel` lives here only** — never in Location stack )
   - **Selection** = inspector for selected map-authored entity (dispatcher)
4. **Auto-switch: event-driven only** — Strong actions: Place mode → **Map**; cell select → **Selection**. **No `useEffect`** that syncs `railSection` from `editorMode` or `selectedCellId`. Manual section choice persists until the next strong action.
5. **Minimal churn to cell inspector** — Reuse **`LocationEditorSelectionPanel`** as a thin dispatcher around existing **`LocationCellAuthoringPanel`** for `cell`; do not redesign the cell panel unless required.
6. **Naming** — `LocationEditorRailSection`, `LocationMapSelection`, `LocationEditorSelectionPanel`. No `metadata`/`cell` in public component APIs after refactor. If `AppTabs` needs numbers, map **inside** the rail component; **route state stays string `railSection`**.
7. **Map section modest** — Place panel + small empty/hint when `mode !== 'place'`. No full Draw/Paint/Erase rail design this pass.
8. **No duplicate state** — Prefer `railSection` in `LocationEditRoute` + small `deriveLocationMapSelection` helper. Avoid a heavy consolidated UI-state object unless it clearly simplifies the route.

---

## Current code touchpoints

- [`LocationEditorMapRailTabs.tsx`](src/features/content/locations/components/workspace/LocationEditorMapRailTabs.tsx) — rename/refactor API
- [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx) — `mapRailTab`, `focusCellRailTab`, two `LocationEditorMapRailTabs` usages (system + campaign branches); `LocationMapEditorPlacePanel` nested under metadata stack today

---

## Implementation order

1. Inspect current right-rail tab component and **both** route usage sites.
2. Replace numeric `mapRailTab` with string **`railSection: LocationEditorRailSection`**.
3. Introduce **`LocationEditorRailSection`** type.
4. Introduce lightweight **`LocationMapSelection`** + **`deriveLocationMapSelection(selectedCellId: string | null)`** (none + cell only; placeholders in union).
5. Refactor rail component: Metadata/Cell → **Location / Map / Selection** panels as props.
6. Create **`LocationEditorSelectionPanel`**: reuse **`LocationCellAuthoringPanel`** for `cell`; empty state for `none`; placeholder copy for `region` / `path` / `object`.
7. Move **`LocationMapEditorPlacePanel`** into **Map** section only.
8. Wire **event-driven** auto-switch:
   - Wrap `mapEditor.setMode`: when next mode is **`'place'`**, also `setRailSection('map')`.
   - Replace `focusCellRailTab` with `setRailSection('selection')` (same `onCellFocusRail` call sites).
9. Manually verify tab switching is not overridden by effects.
10. Add **focused tests** only where they protect structure (see below).

---

## Auto-switching (explicit)

| User action | Rail |
|-------------|------|
| Chooses **Place** in toolbar | `setRailSection('map')` inside wrapped `onModeChange` after `setMode` |
| Selects a cell (select mode, existing grid behavior) | `setRailSection('selection')` via callback currently `onCellFocusRail` |

**Do not** add effects that mirror `mode` or `selectedCellId` to `railSection`.

---

## Tests (focused)

Prioritize:

- **`deriveLocationMapSelection`** — unit tests for `null` / string id.
- Optional tiny pure helper for “should rail switch to map on this mode change?” if extracted to keep route readable — test that helper only.

Skip broad UI suites unless trivially cheap and idiomatic here.

**Do not** add tests that imply region/path/object selection behavior exists.

---

## Success criteria

- Right rail modeled as **Location / Map / Selection**.
- Map authoring controls **not** nested under Location metadata; **Place panel only in Map**.
- Selecting a cell **does not** block access to place options (user can open **Map** or enter **Place** → auto **Map**).
- **railSection**, **editorMode**, and **selection** (derived) are clearly separate.
- **Selection** structurally future-ready **without** extra selection features.

---

## Final deliverable (post-implementation)

1. Files changed
2. State/types introduced or updated
3. Where map authoring controls live
4. How auto-switching works
5. Which selection variants are **structural** only for later slices
6. One small follow-up recommendation for the **next** slice only

---

## Follow-ups (explicitly out of scope)

- Hit-testing, object/path/region selection wiring
- Paint/Erase/Draw rail content beyond modest hint
- Toolbar overhaul, persistence changes
