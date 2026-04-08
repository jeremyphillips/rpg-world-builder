/**
 * **Location workspace — shared authoring contract (editor-facing).**
 *
 * Unifies what the full-width location editor shell (header, workspace entry points, future
 * persistable tools) may rely on without branching on persistence mechanics. **System** locations
 * stay patch-based; **homebrew** (user-authored, `source === 'campaign'` in storage) stay
 * full-draft / snapshot-based. This module defines the *shape* only — adapters implement it.
 *
 * **Lifecycle (adapters):** hydrate/initialize (`useLocationMapHydration` and related), rebaseline after
 * successful save, and persistable updates must stay in workspace-owned state — not ad hoc panel state.
 *
 * @see `docs/reference/locations/location-workspace.md` — *Shared authoring contract*
 * @see `locationWorkspaceAuthoringAdapters.ts` — **system** / **homebrew** builders
 * @see `.cursor/plans/location-workspace/location_workspace_authoring_contract.plan.md` — Phase A–B
 */

/**
 * Workspace authoring mode for the location editor. Distinct from how data is stored on the wire.
 *
 * - **`system`** — patch driver + shared grid draft baseline semantics (`isSystemLocationWorkspaceDirty`).
 * - **`homebrew`** — campaign-owned location editing: snapshot string from
 *   `serializeLocationWorkspacePersistableSnapshot` vs `workspacePersistBaseline`.
 *
 * `homebrew` corresponds to persisted `source === 'campaign'`; the name reflects editor vocabulary,
 * not a storage rename.
 */
export type LocationWorkspaceAuthoringMode = 'system' | 'homebrew';

/**
 * Editor-facing surface shared by system and homebrew adapters. **Dirty** and **saveable** stay
 * separate: a draft may be dirty while save is blocked (validation / grid bootstrap / building floor rules).
 *
 * **Shared (this interface):** mode, dirty, save gating, optional projections for debugging or future
 * generic UI, and the invariant that save block reasons explain `!canSave`.
 *
 * **Mode-specific (implementations, not unified here):** patch JSON vs `HomebrewWorkspacePersistableParts`,
 * how baselines are recorded after hydrate/save, and the concrete save entry points
 * (`handlePatchSave` vs `handleHomebrewSubmit`).
 */
export interface LocationWorkspaceAuthoringContract {
  readonly mode: LocationWorkspaceAuthoringMode;

  /**
   * True when persistable workspace state differs from the last established baseline.
   * - **Homebrew:** `workspacePersistBaseline !== null` and current serialized snapshot !== baseline.
   * - **System:** `isPatchDriverDirty || isGridDraftDirty`.
   */
  readonly isDirty: boolean;

  /**
   * Whether save is allowed *given current validation gates*, independent of dirty/saving.
   * Mirrors the checks applied immediately before persistence for that mode.
   */
  readonly canSave: boolean;

  /**
   * Human-readable reason save is disabled, or `null` when `canSave` is true.
   * (E.g. homebrew: `getHomebrewWorkspaceSaveBlockReason`; system may use patch validation until wired.)
   */
  readonly saveBlockReason: string | null;

  /**
   * Comparable view of the current persistable draft. Intended for equality checks or tooling — not
   * a persisted API shape.
   * - **Homebrew:** typically the string from `serializeLocationWorkspacePersistableSnapshot`.
   * - **System:** implementation-defined (patch document + grid draft; often prefer `isDirty` on the adapter).
   */
  readonly draftProjection: unknown;

  /**
   * Comparable view of the last saved / hydrated baseline used for dirty detection.
   * - **Homebrew:** serialized snapshot string after hydrate or successful save.
   * - **System:** not a single merged snapshot today; may be a placeholder until the adapter exposes a stable token.
   */
  readonly persistedBaselineProjection: unknown;
}
