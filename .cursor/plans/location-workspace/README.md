# Location workspace — plan bundle

Related Cursor plans for the **location editor workspace** (dirty/save, authoring contract, persistable assembly, debounced flush, normalization policy). All live in this directory so links stay stable.

| Plan | Role |
|------|------|
| [location_workspace_dirty_state_4d54eedc.plan.md](location_workspace_dirty_state_4d54eedc.plan.md) | Parent archive: persistable snapshot, baseline lifecycle, state ownership Phases A–E |
| [location_workspace_authoring_contract.plan.md](location_workspace_authoring_contract.plan.md) | Shared `LocationWorkspaceAuthoringContract`; system vs homebrew adapters |
| [location_workspace_debounced_persistable_flush.plan.md](location_workspace_debounced_persistable_flush.plan.md) | Debounced persistable fields; flush-on-boundary before save |
| [location_workspace_persistable_slice_participation.plan.md](location_workspace_persistable_slice_participation.plan.md) | Central map payload + `mapWorkspacePersistableTokenFromGridDraft`; cross-mode parity |
| [location_workspace_normalization_policy.plan.md](location_workspace_normalization_policy.plan.md) | **Child (planned):** explicit normalization policy for dirty vs save semantics |

**Canonical reference doc:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md).
