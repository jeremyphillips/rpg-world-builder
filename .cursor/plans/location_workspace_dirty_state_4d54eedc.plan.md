---
name: Location workspace dirty state
overview: Phases 1–4 complete. Refactor follow-up A–B done; **Phase C done** (`campaignWorkspaceSaveGate`, `campaignWorkspaceCanSave`, header tooltip, docs). Phases D–E pending. Contributor detail in docs/reference/location-workspace.md.
todos:
  - id: snapshot-helper
    content: Add workspacePersistableSnapshot (form + normalized map + building stairs) aligned with save
    status: completed
  - id: baseline-lifecycle
    content: Set baseline on hydration + post-save; replace isDirty||isGridDraftDirty with isWorkspaceDirty in route
    status: completed
  - id: subscribe-form
    content: Ensure watch()/useWatch covers all saved form fields so header re-renders
    status: completed
  - id: tests
    content: Unit tests for snapshot equality across representative edits
    status: completed
  - id: docs-location-workspace
    content: Update docs/reference/location-workspace.md with dirty/save architecture and pointers
    status: completed
  - id: phase2-shared-payload
    content: Extract shared buildCampaignWorkspacePersistablePayload used by save + snapshot serialization
    status: completed
  - id: phase3-tests-matrix-docs-checklist
    content: Expand snapshot test matrix; add contributor checklist in location-workspace.md
    status: completed
  - id: phase3-nested-forms-ux
    content: Decide and document/implement nested submit-to-commit rail forms (e.g. region metadata)
    status: completed
  - id: phase4-system-patch-parity
    content: Document or unify system patch dirty rules vs campaign snapshot
    status: completed
  - id: phase4-perf-memo
    content: Profile and memoize workspace snapshot string if needed
    status: completed
  - id: refactor-phaseA-ownership-model
    content: "Refactor follow-up A: document workspace draft ownership; classify persistable vs ephemeral; migration list of nested inspectors"
    status: completed
  - id: refactor-phaseB-reference-inspector
    content: "Refactor follow-up B: migrate one representative nested inspector end-to-end to workspace draft"
    status: completed
  - id: refactor-phaseC-save-gate
    content: "Phase C: add campaignWorkspaceSaveGate helper; refactor handleCampaignSubmit to use it"
    status: completed
  - id: refactor-phaseC-can-save-wire
    content: "Phase C: expose canSave/reason in useLocationEditWorkspaceModel; wire LocationEditRoute saveDisabled"
    status: completed
  - id: refactor-phaseC-header-tooltip
    content: "Phase C: optional Tooltip on Save when dirty but save blocked (validation/floor)"
    status: completed
  - id: refactor-phaseC-docs
    content: "Phase C: Dirty vs saveable in location-workspace.md; Phase C status in this plan"
    status: completed
  - id: refactor-phaseD-migrate-rest
    content: "Refactor follow-up D: migrate remaining nested inspectors slice-by-slice"
    status: pending
  - id: refactor-phaseE-cleanup-guideline
    content: "Refactor follow-up E: remove transitional patterns; codify authoring guideline"
    status: pending
isProject: true
---

# Location map workspace: scalable dirty-state plan

## Phased roadmap

```mermaid
flowchart LR
  p1[Phase1_Shipped]
  p2[Phase2_SharedPayload]
  p3[Phase3_TestsUxDocs]
  p4[Phase4_ParityPerf]
  p1 --> p2
  p2 --> p3
  p3 --> p4
```

| Phase | Goal | Primary outcome |
| ----- | ---- | --------------- |
| **1** | Persistable snapshot + baseline | `isWorkspaceDirty`, [`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts), hydration/save baseline, [`location-workspace.md`](docs/reference/location-workspace.md) — **done** |
| **2** | Single source of truth | One builder for “what would be persisted” consumed by **both** dirty snapshot and `handleCampaignSubmit` — eliminates save vs dirty drift |
| **3** | Quality + rail UX | Table/matrix tests, contributor checklist in docs, explicit policy for nested **submit-to-commit** inspectors |
| **4** | Parity + polish | System patch rules documented or aligned; optional snapshot memoization if profiling says so |

---

## Current behavior (as implemented)

- **Campaign** edit header uses [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx): `dirty={isWorkspaceDirty}` (persistable snapshot vs baseline from [`useLocationEditWorkspaceModel.ts`](src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts), [`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts)).
- **System** patch branch: `dirty={isSystemLocationWorkspaceDirty(driver.isDirty(), isGridDraftDirty)}` ([`systemLocationWorkspaceDirty.ts`](src/features/content/locations/routes/locationEdit/systemLocationWorkspaceDirty.ts)) — patch JSON dirty **or** grid draft dirty; **not** the campaign persistable snapshot (intentional).
- **`isGridDraftDirty`** remains for the system branch; campaign Save no longer relies on RHF `formState.isDirty` alone.
- **Save path (campaign):** [`handleCampaignSubmit`](src/features/content/locations/routes/locationEdit/useLocationEditSaveActions.ts) builds payloads via **`buildCampaignWorkspacePersistableParts`** (same helper as [`serializeLocationWorkspacePersistableSnapshot`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts)).

Rail tabs (**Location / Map / Selection**) are not separate stores: they feed the same `FormProvider` form, `gridDraft`, and (for buildings) `buildingStairConnections`. Tab-specific dirty flags are unnecessary if the **aggregate snapshot** (campaign) or **patch + grid** (system) is correct.

## Root causes this design fixes

1. **Split sources of truth** — Anything that is **saved** but **not** reflected in RHF `isDirty` or in `gridDraftPersistableEquals` will keep Save disabled. The save path already uses `**buildingStairConnectionsRef`** for building saves; that state lives **outside** the current `dirty` expression and is a **concrete gap** for “rail changed but Save stays off” whenever connections and normalized grid data do not both move (or when only the ref-relevant slice changes). A **single snapshot** that mirrors submit inputs removes this class of bug for future parallel state too.
2. **RHF `isDirty` fragility** — Conditional fields, programmatic `setValue` without `shouldDirty`, or subscription quirks can miss edits. Comparing `**getValues()`-derived persistable input** (same shape as save) is more reliable than trusting `isDirty` alone.
3. **Map draft compare is already normalized** — `[gridDraftPersistableEquals](src/features/content/locations/components/locationGridDraft.utils.ts)` + `[normalizedAuthoringPayloadFromGridDraft](src/features/content/locations/components/locationGridDraft.utils.ts)` are the right building blocks; extend them into a **workspace-level** compare, not new per-field listeners.

## Shipped design (summary)

**Campaign:** `buildCampaignWorkspacePersistableParts` feeds both [`handleCampaignSubmit`](src/features/content/locations/routes/locationEdit/useLocationEditSaveActions.ts) and [`serializeLocationWorkspacePersistableSnapshot`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts); baseline string is set after successful map hydration and after successful campaign save. **Dirty:** `isWorkspaceDirty` compares current snapshot to baseline.

**System:** `isSystemLocationWorkspaceDirty(patchDriver.isDirty(), isGridDraftDirty)` in [`systemLocationWorkspaceDirty.ts`](src/features/content/locations/routes/locationEdit/systemLocationWorkspaceDirty.ts) — not the campaign snapshot.

Full architecture, nested-form policy, and pointers **#8–#9** live in [`location-workspace.md`](docs/reference/location-workspace.md).

## Remaining risks and gaps (post-ship)

### In good shape

- **Campaign save vs dirty drift** is largely mitigated by the shared **`buildCampaignWorkspacePersistableParts`** path.
- **Contributor-facing** detail: [`location-workspace.md`](docs/reference/location-workspace.md) (campaign snapshot, system two-rule dirty, nested rails, whitespace, performance).

### Risks

| Risk | Notes |
| ---- | ----- |
| **New persistence without updating the builder** | If a field is persisted outside `buildCampaignWorkspacePersistableParts` / `toLocationInput` / map bootstrap, expect **false negatives** (Save stays off) or inconsistent dirty behavior. Mitigation: extend the shared builder and the checklist in `location-workspace.md`; no automated lint today. |
| **Hydration / grid layout ordering** | **False positives** after prune or dimension changes if draft and baseline update in different orders. Mitigate with baseline only at hydration/save boundaries; add focused tests when changing [`useLocationMapHydration.ts`](src/features/content/locations/routes/locationEdit/useLocationMapHydration.ts) or grid reset. |
| **Post-save baseline uses `loc`, not `updated`** | After campaign save, baseline serialization uses `loc` from closure while the form was reset from `updated`. [`mergeBuildingProfileForSave`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) layers `loc.buildingProfile` under form input; **server-only** keys not in the form could theoretically skew the snapshot until the route refetches `loc`. Low risk if the form owns those fields. |
| **Whitespace / normalization** | Spacing-only edits may not dirty the snapshot if `toLocationInput` / normalization trims — documented in `location-workspace.md`. |
| **Performance** | Snapshot string is memoized in [`useLocationEditWorkspaceModel.ts`](src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts); broad `watch()` deps remain. Narrow only if profiling shows a hotspot. |

### Gaps (by design or follow-up)

| Gap | Notes |
| --- | ----- |
| **Nested submit-to-commit rails** | Edits that apply to `gridDraft` only on **panel Submit** are invisible to `isWorkspaceDirty` until then. **Target fix:** § [Refactor-first plan](#refactor-first-plan-make-workspace-draft-the-single-source-of-truth-for-persistable-edits) (Phases A–E): workspace-owned draft for persistable edits; avoid end-state “flush all panels on Save.” |
| **System vs campaign semantics** | Two models: **patch driver + grid draft** vs **full campaign persistable snapshot**. No unified “serialize like server” for system unless product requests a larger refactor. |
| **Test depth** | [`workspacePersistableSnapshot.test.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.test.ts) matrix + [`systemLocationWorkspaceDirty.test.ts`](src/features/content/locations/routes/locationEdit/systemLocationWorkspaceDirty.test.ts); **no E2E** for header Save across full flows. |
| **Optional automation** | CI guard if save and snapshot builders diverge — not implemented. |

### Process

- Keep **Pointers for the next agent** in [`location-workspace.md`](docs/reference/location-workspace.md) linked to [`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) and this plan.

## Key files (reference)

| Area | Files |
| ---- | ----- |
| Snapshot + builder | [`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) |
| Workspace model | [`useLocationEditWorkspaceModel.ts`](src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts) |
| Save + baseline | [`useLocationEditSaveActions.ts`](src/features/content/locations/routes/locationEdit/useLocationEditSaveActions.ts) |
| Hydration + baseline | [`useLocationMapHydration.ts`](src/features/content/locations/routes/locationEdit/useLocationMapHydration.ts), [`hydrateDefaultLocationMap.ts`](src/features/content/locations/routes/hydrateDefaultLocationMap.ts) |
| Route wiring | [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx) |
| System dirty helper | [`systemLocationWorkspaceDirty.ts`](src/features/content/locations/routes/locationEdit/systemLocationWorkspaceDirty.ts) |
| Tests | [`workspacePersistableSnapshot.test.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.test.ts), [`systemLocationWorkspaceDirty.test.ts`](src/features/content/locations/routes/locationEdit/systemLocationWorkspaceDirty.test.ts) |
| Docs | [`location-workspace.md`](docs/reference/location-workspace.md) |
| Re-exports | [`routes/locationEdit/index.ts`](src/features/content/locations/routes/locationEdit/index.ts) |

---

## Refactor-first plan: make workspace draft the single source of truth for persistable edits

Follow-up work after Phases 1–4. **Ownership refactor**, not a full workspace rewrite.

```mermaid
flowchart LR
  A[PhaseA_OwnershipModel]
  B[PhaseB_ReferenceInspector]
  C[PhaseC_HeaderContract]
  D[PhaseD_MigrateRest]
  E[PhaseE_CleanupGuideline]
  A --> B --> C --> D --> E
```

### Goal

Refactor the location workspace so any **persistable** edit made in nested inspectors or rail panels lands in **workspace-owned draft state** before header Save. The header dirty state and Save action must become truthful without relying on panel-local submit buttons.

### Core rule

Adopt this rule across the workspace:

- If a field affects saved location/workspace data, edits must flow into workspace draft state.
- Local component state is only for ephemeral UI concerns (open/closed panels, hover, search, picker visibility, temporary preview state).
- Header dirty/save must derive from workspace draft vs persisted snapshot, not from scattered child-local forms.

### Scope guardrails

Keep this pass intentionally narrow.

**Do:**

- Refactor persistable nested inspector edits into workspace-owned draft state.
- Preserve existing workspace UX where possible.
- Migrate incrementally by inspector/slice.
- Add small adapter helpers where needed to bridge old local panel code to new draft writes.

**Do not:**

- Redesign the entire location workspace.
- Rebuild all forms under one giant RHF tree unless already necessary for the targeted slice.
- Mix this pass with object palette, edge-authoring, or broader tool redesign.
- Change persistence contracts unless required by the draft ownership refactor.
- Introduce a large imperative “flush all child panels on Save” architecture as the end state.

### Phase A — establish the ownership model

**Status: completed** (ownership note + migration list below).

#### Canonical workspace draft sources (campaign edit)

Persistable authoring for the campaign snapshot in [`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) is assembled from:

| Source | Location | Serialized via |
| ------ | -------- | -------------- |
| **Location form** | `LocationFormValues` (React Hook Form in [`useLocationEditWorkspaceModel.ts`](src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts)) | `toLocationInput` |
| **Map draft** | `LocationGridDraftState` (`gridDraft` / `gridDraftRef`) | `normalizedAuthoringPayloadFromGridDraft` + `excludedCellIds` + region/path/edge/cell data |
| **Building stairs** | `buildingStairConnections` (state + ref) | Merged in `mergeBuildingProfileForSave` when `loc.scale === 'building'` |

**System location patch:** map side still uses `gridDraft` vs baseline; metadata uses [`patchDriver`](src/features/content/shared/editor/patchDriver.ts) — not the campaign snapshot string.

#### Ephemeral UI state (must stay local)

Examples: map editor **mode** and tool selection, **paint** `activePaint` / active region id for painting, **map selection** (`mapSelection`), rail **tab** (`railSection`), right-rail **open**, **zoom/pan**, async **picker loading** lists, **busy** flags on async actions. These are excluded from the persistable snapshot per [`locationGridDraft.utils.ts`](src/features/content/locations/components/locationGridDraft.utils.ts) / [`location-workspace.md`](docs/reference/location-workspace.md).

#### Nested inspectors — audit (submit-to-commit vs draft-sync)

| Inspector / area | Persistable path | Gap? |
| ------------------ | ---------------- | ---- |
| [`LocationMapRegionMetadataForm`](src/features/content/locations/components/workspace/LocationMapRegionMetadataForm.tsx) (Selection → **region**) | **`onPatchRegion`** → `onUpdateRegionEntry` → `gridDraft.regionEntries` (name/color immediate; description debounced) | **Migrated (Phase B)** — [`regionMetadataDraftAdapter.ts`](src/features/content/locations/components/workspace/regionMetadataDraftAdapter.ts). |
| [`LocationMapStairEndpointInspectForm`](src/features/content/locations/components/workspace/LocationMapSelectionInspectors.tsx) (stairs on floor) | `FormSelectField` **onAfterChange** → `onUpdateCellObjects` | No — updates `gridDraft` immediately. `AppForm` uses noop `onSubmit`; form is structural. |
| [`StairPairingLinkForm`](src/features/content/locations/components/workspace/LocationMapSelectionInspectors.tsx) (building pairing) | **Link endpoints** button → async `onLink` | No — commits without a “Save” panel step; nested form state is picker UX only. |
| [`LocationCellAuthoringPanel`](src/features/content/locations/components/LocationCellAuthoringPanel.tsx) | Callbacks → `onUpdateLinkedLocation` / `onUpdateCellObjects` | No — syncs to draft. |
| Path / edge / object / edge-run inspectors | Remove / metadata actions via callbacks | No — draft updates inline. |
| [`LocationMapEditorPaintMapPanel`](src/features/content/locations/components/mapEditor/LocationMapEditorPaintMapPanel.tsx) | Preset color / create region / navigate to edit | Color change uses handlers that update `gridDraft` (see route); full name/description intentionally deferred to Selection. |

**Rule for future panels:** persistable fields → **`gridDraft`**, **location form**, or **building stair connections** (or patch document for system metadata) — not isolated `AppForm` state without syncing.

#### Migration list (Phase B–D order)

1. **P0 — [`LocationMapRegionMetadataForm`](src/features/content/locations/components/workspace/LocationMapRegionMetadataForm.tsx)** — **done (Phase B)**; reference pattern for future panels.
2. *None others identified* in `components/workspace/` as of Phase A audit that buffer persistable data behind panel Submit only. Re-audit when adding new rail inspectors.

**Acceptance criteria (Phase A):** satisfied — shared rule and ordered migration list are documented above and in [`location-workspace.md`](docs/reference/location-workspace.md).

### Phase B — refactor one representative inspector end-to-end

**Status: completed** — [`LocationMapRegionMetadataForm`](src/features/content/locations/components/workspace/LocationMapRegionMetadataForm.tsx) + [`regionMetadataDraftAdapter.ts`](src/features/content/locations/components/workspace/regionMetadataDraftAdapter.ts); [`FormTextField`](src/ui/patterns/form/FormTextField.tsx) gained optional `onAfterChange`.

Choose the highest-value nested inspector that currently creates the dirty-state gap and use it as the reference implementation.

**Implementation goals:**

- Move its persistable fields to read/write through workspace draft.
- Keep ephemeral UI state local where appropriate.
- Remove dependence on panel-local Submit as the only way to commit persistable changes.
- Prefer immediate sync for discrete fields (toggle/select/choice).
- Prefer debounced sync for freeform text inputs if needed for ergonomics.

**Design guidance:**

- It is acceptable for workspace draft to temporarily contain incomplete or invalid in-progress values, as long as final save validation remains authoritative.
- If the inspector currently depends on a local “Cancel” model, redefine Cancel to discard only ephemeral unsaved UI changes, not revert already-applied workspace draft changes, unless there is a strong product reason to preserve full revert semantics.

**Acceptance criteria:**

- Editing this inspector updates workspace dirty state truthfully.
- Header Save reflects the current edited state without requiring panel Submit.
- Closing or switching away from the panel does not silently discard persistable work.

### Phase C — make header dirty/save depend on draft ownership only (refinement)

**Status: completed** — [`campaignWorkspaceSaveGate.ts`](src/features/content/locations/routes/locationEdit/campaignWorkspaceSaveGate.ts), `campaignWorkspaceCanSave` / `campaignWorkspaceSaveBlockReason` in [`useLocationEditWorkspaceModel.ts`](src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts), [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx) `saveDisabled` + `saveDisabledReason`, [`LocationEditorHeader.tsx`](src/features/content/locations/components/workspace/LocationEditorHeader.tsx) tooltip; docs **Dirty vs saveable**.

Campaign location edit already derives **dirty** from `serializeLocationWorkspacePersistableSnapshot` vs `workspacePersistBaseline` in [`useLocationEditWorkspaceModel.ts`](src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts). Phase B removed panel-local submit for region metadata. Phase C **tightens the contract**: name **dirty** vs **saveable** explicitly, centralize the same gates as the submit path, and wire the header so Save is disabled when save is blocked while **dirty** stays accurate.

#### Current state (audit)

| Concern | Where | Behavior today |
| -------- | ------ | ---------------- |
| **Dirty** | `useLocationEditWorkspaceModel` | `isWorkspaceDirty` = baseline ≠ `serializeLocationWorkspacePersistableSnapshot(watch(), gridDraft, buildingStairConnections, loc)`. |
| **Save** | [`useLocationEditSaveActions.ts`](src/features/content/locations/routes/locationEdit/useLocationEditSaveActions.ts) | `handleCampaignSubmit`: building floor gate, then `validateGridBootstrap` ([`bootstrapDefaultLocationMap.ts`](src/features/content/locations/domain/mapAuthoring/bootstrapDefaultLocationMap.ts)). |
| **Header Save** | [`LocationEditorHeader.tsx`](src/features/content/locations/components/workspace/LocationEditorHeader.tsx), [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx) | `disabled = busy \|\| saveDisabled \|\| (!dirty && !isNew)`. **`saveDisabled`** = `!campaignWorkspaceCanSave` ([`getCampaignWorkspaceSaveBlockReason`](src/features/content/locations/routes/locationEdit/campaignWorkspaceSaveGate.ts): floor + `validateGridBootstrap`). Tooltip when blocked via `saveDisabledReason`. |
| **System branch** | `LocationEditRoute` | `dirty` = `isSystemLocationWorkspaceDirty(patch, gridDraft)` — **out of scope** for this Phase C unless a follow-up adds parallel saveable for patch. |

**Gap:** **Dirty** and **saveable** are not **named** separately in the workspace API; saveability is implicit inside `handleCampaignSubmit`.

**Secondary audit:** `useEffect` resetting `gridDraft` / baseline when `gridColumns`/`gridRows` are invalid (~369–386 in `useLocationEditWorkspaceModel`) — document as stability behavior or follow-up if it ever fights “dirty + invalid” UX.

```mermaid
flowchart LR
  subgraph dirtyPath [Dirty path]
    draft[draft_form_grid_stairs]
    snap[serializeSnapshot]
    base[workspacePersistBaseline]
    cmp[isWorkspaceDirty]
    draft --> snap
    snap --> cmp
    base --> cmp
  end
  subgraph savePath [Save path]
    submit[handleCampaignSubmit]
    vg[validateGridBootstrap]
    floor[building_floor_gate]
    submit --> floor
    submit --> vg
  end
```

#### Target contract

- **Dirty** (unchanged): persistable snapshot differs from last baseline — keep centralized in [`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts).
- **Saveable / canSave**: same **logical** gates as a successful campaign save (building needs active floor when editing building maps; `validateGridBootstrap(getValues())` passes). **Independent** from dirty.
- **Header:** `dirty` = unsaved work; **Save disabled** when **not** saveable (structural + validation). **Do not** infer dirty from saveability.

**Recommended Save button:** `Save` enabled when `dirty && canSave && !saving` (plus existing flags). **Dirty && !canSave** → Save **disabled**, optional **Tooltip** with reason (grid bootstrap, add floor, etc.).

#### Implementation steps

1. **Extract shared “campaign save gate”** — new module e.g. [`campaignWorkspaceSaveGate.ts`](src/features/content/locations/routes/locationEdit/campaignWorkspaceSaveGate.ts): `getCampaignWorkspaceSaveBlockReason(params): string | null` or `{ canSave; reason }` using `getValues()`, `loc`, `activeFloorId` — **mirror** early returns in `handleCampaignSubmit`. Refactor `handleCampaignSubmit` to call this helper so validation cannot drift.
2. **Expose from `useLocationEditWorkspaceModel`** (memoized): `campaignWorkspaceCanSave` / `campaignWorkspaceSaveBlockReason` (or equivalent).
3. **Wire [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx):** replace `saveDisabled={isBuildingWorkspace && !activeFloorId}` with a single expression that includes **floor + grid bootstrap** (same as gate).
4. **Header (minimal):** optional `saveDisabledReason` + `Tooltip` on Save in [`LocationEditCampaignWorkspace.tsx`](src/features/content/locations/components/workspace/LocationEditCampaignWorkspace.tsx) / [`LocationEditorHeader.tsx`](src/features/content/locations/components/workspace/LocationEditorHeader.tsx) when `dirty && !canSave`.
5. **Docs:** “Dirty vs saveable” in [`location-workspace.md`](docs/reference/location-workspace.md). **Transitional:** system patch may still use `validationApiRef` — isolated from campaign snapshot dirty.

#### Acceptance mapping (Phase C)

| Criterion | How it is met |
| --------- | ---------------- |
| Dirty from draft vs snapshot | Already; document only if needed. |
| Dirty vs valid separate | New `canSave` / `saveBlockReason`; header uses both. |
| No hidden panel state for migrated slices | True post–Phase B; reaffirm in docs. |
| Centralized comparison | Snapshot in `workspacePersistableSnapshot.ts`; **save gate** in new module beside it. |

#### Out of scope (Phase C)

- Rebuilding inspectors, object/edge tools, imperative flush-all-panels.
- **System** patch `saveable` parity unless added as follow-up.

### Phase D — migrate remaining nested inspectors slice-by-slice

Apply the same ownership pattern to the rest of the affected rail inspectors.

**Implementation goals:**

- Migrate one inspector at a time.
- Reuse shared adapter/helpers for reading and writing draft slices.
- Reduce local form ownership to UI-only concerns.

**Suggested migration order:**

- Inspectors with the highest risk of silent data loss first.
- Then most frequently used authoring panels.
- Then lower-risk or more specialized panels.

**Acceptance criteria:**

- For each migrated inspector, persistable edits are visible to workspace dirty/save immediately or via intentional debounce.
- Panel-local submit buttons are removed, repurposed, or clearly no longer the only commit path.

### Phase E — remove transitional patterns and codify the standard

After the main inspectors are migrated, clean up any temporary compatibility logic.

**Implementation goals:**

- Remove stale “nested submit-to-commit” assumptions.
- Simplify panel APIs that existed only to support local commit workflows.
- Add a lightweight authoring guideline for future workspace panels.

**Authoring guideline should state:**

- Persistable field → workspace draft
- Ephemeral panel UI → local state
- Header dirty/save → workspace draft only
- Validation and dirty are separate concerns

**Acceptance criteria:**

- The workspace no longer has hidden persistable edits outside its canonical draft model.
- New panel work has a clear standard to follow.

### Transitional note during migration

During the migration window, not every inspector may be converted at once. For any still-unmigrated inspector:

- explicitly document that it still uses local commit semantics
- add temporary protection only if needed to prevent silent loss
- remove that protection once the inspector is migrated

**Important:** Treat such protections as temporary migration aids, not the target architecture.

### Success criteria for the overall refactor

This refactor is successful when all of the following are true:

- Header Save never misses meaningful persistable workspace edits for migrated panels.
- Dirty state is trustworthy because it is based on workspace-owned draft state.
- Nested inspectors are simpler in responsibility: they edit draft state rather than privately owning unsaved persistable data.
- The workspace has a durable state ownership rule that can support future richer tools (objects, edges, metadata, etc.) without reintroducing split dirty-state behavior.

