---
name: Map authoring model split
overview: "Introduce canonical shared types with cellEntries, pathEntries (ordered cellIds), and edgeEntries (edgeId + kind); replace pathSegments/edgeFeatures in persistence, validation, and client draft. **Status: cutover implemented.** Follow-up cleanup and geometry helpers — see location_map_authoring_followup.plan.md."
todos:
  - id: shared-types
    content: Add LocationMapAuthoringContent, pathEntries/edgeEntries types; canonical kind constant names + deprecate aliases; locationMap.types LocationMapBase fields
    status: completed
  - id: shared-helpers
    content: path chain surgery (removePathChainSegment); no legacy path migration per product decision
    status: completed
  - id: shared-validation
    content: validatePathEntriesStructure + validateEdgeEntriesStructure; wire validateLocationMapInput
    status: completed
  - id: server-schema
    content: Mongoose pathEntries/edgeEntries schemas + locationMaps.service create/update/merge
    status: completed
  - id: client-draft
    content: LocationGridDraftState, bootstrap, LocationEditRoute, handlePlaceCell chain merge, edgeAuthoring, erase, pruning, gridDraftPersistableEquals
    status: completed
  - id: render-adapter
    content: pathOverlayRendering pathEntriesToSvgPaths + chainToSmoothSvgPath
    status: completed
  - id: docs-tests
    content: docs/reference/locations/location-workspace.md + focused tests
    status: completed
isProject: false
---

# Location map authoring model refactor (paths/edges canonical split)

**Implemented.** Product chose a **clean cutover** (no legacy `pathSegments` migration). Persisted model is `pathEntries` / `edgeEntries`.

**Next steps:** [.cursor/plans/location_map_authoring_followup.plan.md](location_map_authoring_followup.plan.md) — remove shared `*_FEATURE_`* aliases, normalize empty arrays at API boundaries, extract authored→points helpers, and keep `pathEntriesToSvgPaths` as an explicit temporary seam.

---

## Historical target (achieved)

- `LocationMapPathAuthoringEntry`: `{ id, kind, cellIds[] }`
- `LocationMapEdgeAuthoringEntry`: `{ edgeId, kind }`
- `LocationMapBase.pathEntries` / `edgeEntries`
- Validation, Mongoose, draft round-trip, editor UX (chain extend, erase surgery)

---

## Original diagram (conceptual)

```mermaid
flowchart LR
  subgraph before [Before]
    CE[cellEntries]
    PS[pathSegments]
    EF[edgeFeatures with id]
  end
  subgraph after [After]
    CE2[cellEntries]
    PE[pathEntries]
    EE[edgeEntries]
  end
  CE --> CE2
  PS --> PE
  EF --> EE
```



