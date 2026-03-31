---
name: Location map authoring follow-up
overview: Post-cutover cleanup—remove deprecated shared *_FEATURE_* aliases, normalize pathEntries/edgeEntries to empty arrays at API boundaries and tighten types, and define the next geometry pass as pure authored→render-data helpers while keeping pathEntriesToSvgPaths as an explicit temporary seam.
todos:
  - id: remove-feature-aliases
    content: Remove LOCATION_MAP_PATH_FEATURE_* / LOCATION_MAP_EDGE_FEATURE_* aliases from shared constants; migrate LocationGridAuthoringSection (and any remaining imports) to LocationMapPathKindId / LOCATION_MAP_PATH_KIND_IDS; verify grep clean
    status: completed
  - id: normalize-empty-arrays
    content: "Normalize pathEntries/edgeEntries to [] in server toDoc and client map load; then make pathEntries + edgeEntries required on LocationMapBase (or document NormalizedLocationMap) and delete redundant ?? [] at call sites"
    status: completed
  - id: protect-render-seam
    content: "Add file/function JSDoc on pathOverlayRendering: pathEntriesToSvgPaths is temporary bridge; extract pathEntriesToCenterlinePoints (cellIds→points, no SVG) in shared or domain; keep Catmull-Rom only in feature layer"
    status: completed
  - id: geometry-pass-spec
    content: "Document next pass deliverables—pathEntries→segment pairs or polyline points; edgeEntries→boundary segment descriptors; shared cell-center + edge-boundary lookup; pathEntriesToSvgPaths calls shared helpers only"
    status: completed
isProject: false
---

# Location map authoring — follow-up plan

**Status: implemented** (alias removal, `LocationMapBase` required `pathEntries`/`edgeEntries`, `toDoc` + merge + create validation normalization, shared `pathEntriesToCenterlinePoints`, `pathEntriesToSvgPaths` documented as temporary seam, docs updated).

---

## 1. Deprecated `*_FEATURE_*` aliases (temporary churn reducer)

Removed from [`locationMapPathFeature.constants.ts`](shared/domain/locations/map/locationMapPathFeature.constants.ts) and [`locationMapEdgeFeature.constants.ts`](shared/domain/locations/map/locationMapEdgeFeature.constants.ts). [`LocationGridAuthoringSection`](src/features/content/locations/components/LocationGridAuthoringSection.tsx) uses `LocationMapPathKindId`.

Feature-layer palette types (`LocationPathFeatureKindId` in `locationPathFeature.types.ts`, etc.) remain for UI metadata—separate from shared persisted kinds.

---

## 2. `pathEntries` / `edgeEntries` optionality vs empty arrays

- [`LocationMapBase`](shared/domain/locations/map/locationMap.types.ts): `pathEntries` and `edgeEntries` are **required** (always arrays from API).
- [`toDoc`](server/features/content/locations/services/locationMaps.service.ts): missing/non-array → `[]`.
- Create validation payload and [`mergeMapPayload`](server/features/content/locations/services/locationMaps.service.ts): normalized to `[]`.
- [`LocationEditRoute`](src/features/content/locations/routes/LocationEditRoute.tsx): `def.pathEntries` / `def.edgeEntries` without `?? []`.

---

## 3. Protect `pathEntriesToSvgPaths` as the temporary rendering seam

- Shared: [`locationMapPathCenterline.helpers.ts`](shared/domain/locations/map/locationMapPathCenterline.helpers.ts) — `pathEntryToCenterlinePoints`, `pathEntriesToCenterlinePoints` (pixel centerlines, no SVG).
- Feature: [`pathOverlayRendering.ts`](src/features/content/locations/components/pathOverlayRendering.ts) — module doc + `pathEntriesToSvgPaths` calls shared centerline then `chainToSmoothSvgPath`.

---

## 4. Next pass — authored → render-data helpers (not full components)

See docs paragraph in [`location-workspace.md`](docs/reference/location-workspace.md): edge/boundary segment helpers, unified cell-center lookup for editor + detail views, keep `pathEntriesToSvgPaths` thin.

---

## 5. Tests

- [`locationMapPathCenterline.helpers.test.ts`](shared/domain/locations/map/__tests__/locationMapPathCenterline.helpers.test.ts)
