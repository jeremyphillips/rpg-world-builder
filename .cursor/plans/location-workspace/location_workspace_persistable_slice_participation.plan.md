---
name: Location workspace persistable slice participation
overview: Centralize map persistable assembly for homebrew save/dirty and system workspace projections; document participation checklist; add cross-mode parity tests. No DB or schema changes.
todos:
  - id: map-payload-helper
    content: Extract buildMapWorkspacePersistablePayloadFromGridDraft + mapWorkspacePersistableTokenFromGridDraft; wire adapters
    status: completed
  - id: tests-docs
    content: Tests + docs/reference/location-workspace.md + this plan file
    status: completed
isProject: true
---

# Location workspace: persistable slice participation

**Parent:** [location_workspace_dirty_state_4d54eedc.plan.md](location_workspace_dirty_state_4d54eedc.plan.md).

## Shipped

- **Single map assembly** — [`buildMapWorkspacePersistablePayloadFromGridDraft`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) and [`mapWorkspacePersistableTokenFromGridDraft`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) in [`workspacePersistableSnapshot.ts`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts); [`buildHomebrewWorkspacePersistableParts`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) uses it; [`buildSystemLocationWorkspaceAuthoringContract`](../../../src/features/content/locations/routes/locationEdit/locationWorkspaceAuthoringAdapters.ts) uses the token for `grid` in projections.
- **Tests** — Map token parity in [`workspacePersistableSnapshot.test.ts`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.test.ts); system vs shared token in [`locationWorkspaceAuthoringAdapters.test.ts`](../../../src/features/content/locations/routes/locationEdit/locationWorkspaceAuthoringAdapters.test.ts).
- **Docs** — [`docs/reference/location-workspace.md`](../../../docs/reference/location-workspace.md) **Adding persisted workspace state (participation checklist)** and pointer **#13**.

## Non-goals

- No migration or persisted schema change.
- No unification of system patch semantics with the homebrew snapshot string.
