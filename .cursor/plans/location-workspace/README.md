# Location workspace — plan bundle

Cursor plans for the **location editor workspace**: persistence/dirty state, shell contract, map authoring UX, hex constraints, and performance. Individual `.plan.md` filenames are stable — **prefer linking to files by name** rather than moving them.

**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md).

---

## Reading order (onboarding)

1. **Foundation** — how save/dirty/snapshot fit together (`dirty_state` archive, authoring contract, normalization).
2. **Reference doc** — `location-workspace.md` for runtime behavior, Open issues, and contributor pointers.
3. **Interaction & hex** — Select mode, hover parity, hex edge Option B (mostly done child plans).
4. **Performance** — snapshot profiling outcomes; path preview remains deferred in the reference doc.
5. **UX & shell** — [location_workspace_ux_refactor.plan.md](location_workspace_ux_refactor.plan.md) (placeholder parent — scope to be defined).

---

## Foundation (persistence & contracts)

| Plan | Status | Role |
|------|--------|------|
| [location_workspace_dirty_state_4d54eedc.plan.md](location_workspace_dirty_state_4d54eedc.plan.md) | Done (archive) | Persistable snapshot, baseline lifecycle, state ownership Phases A–E |
| [location_workspace_authoring_contract.plan.md](location_workspace_authoring_contract.plan.md) | Done | Shared `LocationWorkspaceAuthoringContract`; system vs homebrew adapters |
| [location_workspace_debounced_persistable_flush.plan.md](location_workspace_debounced_persistable_flush.plan.md) | Done | Debounced persistable fields; flush-on-boundary before save |
| [location_workspace_persistable_slice_participation.plan.md](location_workspace_persistable_slice_participation.plan.md) | Done | Central map payload + `mapWorkspacePersistableTokenFromGridDraft`; cross-mode parity |
| [location_workspace_normalization_policy.plan.md](location_workspace_normalization_policy.plan.md) | Done | Explicit normalization policy for dirty vs save semantics |

---

## Map interaction, chrome & hex geometry

| Plan | Status | Role |
|------|--------|------|
| [location_workspace_hex_edge_support.plan.md](location_workspace_hex_edge_support.plan.md) | Done | Option B constrained hex edges — alert + erase guard + selection clear |
| [location_workspace_select_mode_interaction_hardening.plan.md](location_workspace_select_mode_interaction_hardening.plan.md) | Done | Select mode — pan vs click, region vs cell chrome |
| [location_workspace_hex_hover_parity_followup.plan.md](location_workspace_hex_hover_parity_followup.plan.md) | Done | Hex `HexGridEditor` — suppressed-hover idle `:hover` parity with square |

---

## Performance & measurement

| Plan | Status | Role |
|------|--------|------|
| [location_workspace_snapshot_performance_profiling.plan.md](location_workspace_snapshot_performance_profiling.plan.md) | Done | Workspace snapshot derivation profiling; path preview deferred unless justified |

---

## UX & shell (planned parent)

| Plan | Status | Role |
|------|--------|------|
| [location_workspace_ux_refactor.plan.md](location_workspace_ux_refactor.plan.md) | **Placeholder** | Parent plan for workspace **UX refactor** (rail, header, canvas column, tool palettes, building/floor chrome, etc.). Scope, todos, and acceptance criteria TBD — replace placeholder content when work starts. |

**Intent:** UX refactors sit **beside** the foundation plans above; they should reference `location-workspace.md` and avoid changing dirty/save contracts unless explicitly in scope.
