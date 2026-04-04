# Location workspace — plan bundle

Related Cursor plans for the **location editor workspace** (dirty/save, authoring contract, persistable assembly, debounced flush, normalization policy, hex edges, Select mode, snapshot performance). All live in this directory so links stay stable.

| Plan | Role |
|------|------|
| [location_workspace_dirty_state_4d54eedc.plan.md](location_workspace_dirty_state_4d54eedc.plan.md) | Parent archive: persistable snapshot, baseline lifecycle, state ownership Phases A–E |
| [location_workspace_authoring_contract.plan.md](location_workspace_authoring_contract.plan.md) | Shared `LocationWorkspaceAuthoringContract`; system vs homebrew adapters |
| [location_workspace_debounced_persistable_flush.plan.md](location_workspace_debounced_persistable_flush.plan.md) | Debounced persistable fields; flush-on-boundary before save |
| [location_workspace_persistable_slice_participation.plan.md](location_workspace_persistable_slice_participation.plan.md) | Central map payload + `mapWorkspacePersistableTokenFromGridDraft`; cross-mode parity |
| [location_workspace_normalization_policy.plan.md](location_workspace_normalization_policy.plan.md) | Explicit normalization policy for dirty vs save semantics |
| [location_workspace_hex_edge_support.plan.md](location_workspace_hex_edge_support.plan.md) | **Child (done):** Option B constrained hex edges — alert + erase guard + selection clear; decision record filled |
| [location_workspace_select_mode_interaction_hardening.plan.md](location_workspace_select_mode_interaction_hardening.plan.md) | **Child (done):** Select mode — pan vs click, region vs cell chrome; interaction semantics only |
| [location_workspace_hex_hover_parity_followup.plan.md](location_workspace_hex_hover_parity_followup.plan.md) | **Child (done):** Hex `HexGridEditor` — mirror square suppressed-hover idle `:hover` parity |
| [location_workspace_snapshot_performance_profiling.plan.md](location_workspace_snapshot_performance_profiling.plan.md) | **Child (done):** Evidence-driven profiling of workspace snapshot derivation; path preview deferred unless justified |

**Canonical reference doc:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md).
