# Location workspace — plan bundle

Cursor plans for the **location editor workspace**: persistence/dirty state, shell contract, map authoring UX, hex constraints, and performance. Individual `.plan.md` filenames are stable — **prefer linking to files by name** rather than moving them.

**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md).

**Note:** Older plans in this bundle may still cite legacy `src/features/content/locations/domain/` paths (`mapEditor/`, `mapContent/`, `mapPresentation/`, …). Prefer [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) and [docs/reference/locations.md](../../../docs/reference/locations.md) for current folder names (`model/`, `authoring/`, `presentation/`, …).

---

## Reading order (onboarding)

1. **Foundation** — how save/dirty/snapshot fit together (`dirty_state` archive, authoring contract, normalization).
2. **Reference doc** — `location-workspace.md` for runtime behavior, Open issues, and contributor pointers.
3. **Workspace structure** — [location_workspace_ownership_reorg.plan.md](location_workspace_ownership_reorg.plan.md): ownership subtrees under `components/workspace/` (`header/`, `setup/`, `canvas/`, `leftTools/`, `rightRail/`); **`LocationGridAuthoringSection`** stays workspace-level (not under `canvas/`). Subtree `__tests__/` and further rail internals are optional follow-ups. See `docs/reference/location-workspace.md` § Workspace layout.
4. **Interaction & hex** — Select mode, hover parity, hex edge Option B (mostly done child plans).
5. **Performance** — snapshot profiling outcomes; path preview remains deferred in the reference doc.
6. **Object authoring** — shared prefix `location_workspace_object_authoring_*`: **roadmap** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md); **Phase 1** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md); **Phase 2** [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md); **Phase 3** [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md); **Phase 4** [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md).

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
| [location_workspace_ownership_reorg.plan.md](location_workspace_ownership_reorg.plan.md) | Active / incremental | Folder ownership (`header`, `leftTools`, `rightRail`, `canvas`), layout tokens in domain, plan-bundle README |
| [location_workspace_hex_edge_support.plan.md](location_workspace_hex_edge_support.plan.md) | Done | Option B constrained hex edges — alert + erase guard + selection clear |
| [location_workspace_select_mode_interaction_hardening.plan.md](location_workspace_select_mode_interaction_hardening.plan.md) | Done | Select mode — pan vs click, region vs cell chrome |
| [location_workspace_hex_hover_parity_followup.plan.md](location_workspace_hex_hover_parity_followup.plan.md) | Done | Hex `HexGridEditor` — suppressed-hover idle `:hover` parity with square |

---

## Performance & measurement

| Plan | Status | Role |
|------|--------|------|
| [location_workspace_snapshot_performance_profiling.plan.md](location_workspace_snapshot_performance_profiling.plan.md) | Done | Workspace snapshot derivation profiling; path preview deferred unless justified |

---

## Object authoring UX (parent + child plans)

| Plan | Status | Role |
|------|--------|------|
| [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) | **Parent (roadmap)** | **Object authoring modernization** — registry-driven palette (toolbar drawer), loaded placement state, variants, edge placement for doors/windows, rail-heavy inspection/editing. Phases 1–4, layer boundaries, risks, guardrails. |
| [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md) | **Child (Phase 1)** | **Palette foundation** — central registry, toolbar drawer palette, loaded object state, click-to-place continuity; **not** variants, edge placement, or deep inspector redesign. |
| [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md) | **Child (Phase 2)** | **Variants** — registry variant/family model, palette affordances, popover vs modal picker rules, registry-driven tooltips, loaded-object integration; **not** edge placement or deep rail editing. |
| [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md) | **Child (Phase 3)** | **Edge placement** (placeholder) — mode, hit-testing/snapping, doors/windows off Draw, selected-edge rail; refine after Phases 1–2. **Not** full Phase 4 config depth. |
| [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md) | **Child (Phase 4)** | **Config and editing** (placeholder) — rail inspector depth, door/window states, stairs linking, richer metadata; refine after Phases 1–3. **Not** full workspace/runtime redesign. |

**Intent:** Sits **beside** foundation and interaction plans; must reference `location-workspace.md` and **must not** change dirty/save or authoring-contract semantics unless a child plan explicitly scopes persistence work.
