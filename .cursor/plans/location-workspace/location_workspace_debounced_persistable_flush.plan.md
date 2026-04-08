---
name: Location workspace debounced persistable flush
overview: Close the **debounced persistable-field flush gap** for region metadata (description) with a reusable **flush-on-boundary** pattern. Parent context — [Location workspace dirty state](location_workspace_dirty_state_4d54eedc.plan.md) (workspace draft ownership, header dirty/save). No DB/schema/save-contract changes.
todos:
  - id: debounce-flush-pattern
    content: Define reusable hook/controller for debounced persistable write + flush + optional cancel
    status: completed
  - id: region-description-migrate
    content: Migrate region metadata description to pattern; keep debounce UX
    status: completed
  - id: boundary-flush-integration
    content: Flush on Save, selection change, tab/inspector boundaries, unmount as needed
    status: completed
  - id: tests-debounced-flush
    content: Tests — debounce, save flush, selection, unmount, dirty truthfulness
    status: completed
  - id: docs-debounced-persistable
    content: Short doc note in location-workspace.md (debounced persistable fields)
    status: completed
isProject: true
---

# Debounced persistable flush (region metadata first)

### Parent plan

This work extends the architecture established in **[Location workspace dirty state](location_workspace_dirty_state_4d54eedc.plan.md)**:

- region metadata writes persistable edits into **workspace draft** ownership
- header **dirty** / **save** trust the workspace draft + snapshot

It does **not** supersede [Location workspace authoring contract](location_workspace_authoring_contract.plan.md); flush timing should remain compatible with `**authoringContract`** / homebrew snapshot semantics.

---

### Problem statement

Region metadata (including `**description`**) updates the workspace draft via `**onPatchRegion`** / adapters. `**description**` syncs on a **debounce** for typing ergonomics.

A **very fast destructive transition** can still drop the last buffered value before it reaches `**gridDraft.regionEntries`**, so the persistable snapshot never sees that edit.

**Examples of destructive / commit boundaries**

- Header **Save**
- **Panel close** (if it ends editing context)
- **Tab switch** (Location / Map / Selection)
- **Region selection change** (different region in inspector)
- **Route leave** / **unmount**

---

### Objective

Introduce a reusable **flush-on-boundary** pattern for debounced persistable fields, and apply it to **region description** first.

**Goals**

- Keep **debounce** ergonomics for freeform text
- Ensure the **last buffered persistable value** is flushed before any destructive workspace transition that could drop it
- Establish a pattern **future debounced persistable fields** can reuse

---

### Constraints

- Do **not** remove debounce entirely unless there is a strong architectural reason
- Do **not** reintroduce panel-local **submit-to-commit** semantics
- Do **not** change DB shape, persisted schema, or save contracts
- Do **not** broaden into unrelated workspace refactors
- Align with workspace ownership: persistable edits belong in **workspace draft**; header dirty/save trusts that draft

---

### Required design rule

Any **persistable** field that writes on debounce must participate in a **synchronous or guaranteed flush** before destructive boundaries.

For this pass: implement that rule for **region description** and shape the solution for reuse.

---

### Implementation goals

#### 1. Define a reusable flush pattern

Add a small, explicit pattern (hook, controller/helper, or draft-sync utility) that supports:

- Current **buffered** value
- **Debounced** write to workspace draft
- Explicit `**flush()`** for immediate commit to draft
- Optional `**cancel()`** if useful for cleanup only

Keep it **modest** — not a large framework.

#### 2. Apply to region metadata description

- Typing remains **debounced**
- Latest pending value can be **flushed immediately** when needed
- Persistable edits still land in **workspace draft**, not hidden local submit state

#### 3. Flush on destructive boundaries

Flush pending debounced region description before or during transitions where the buffered value could be lost, including (use judgment):

- Header **Save**
- **Region selection** change
- Inspector **close / collapse** if it ends editing context
- **Tab switch** if it ends editing context
- **Route leave** / **unmount**

Prefer **boundary flush** over making every keystroke immediate.

**Integration preference:** If `**useLocationEditWorkspaceModel`** (or a single workspace boundary module) already centralizes transitions, register flushes there instead of scattering ad hoc calls in leaf components — without duplicating domain rules.

#### 4. Preserve dirty / save semantics

- Workspace **dirty** reflects the **flushed** value
- Header **Save** must not miss the user’s most recent debounced region description
- **Dirty** vs **saveable** remain separate; only coordinate with save gate if flush ordering requires it

---

### Deliverables


| Deliverable                                         | Notes                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Reusable debounced-persistable flush helper/pattern | Hook or small module; documented API                                               |
| Region description migrated                         | Uses pattern end-to-end                                                            |
| Boundary flush wiring                               | Save, selection, tabs, unmount as justified                                        |
| Tests                                               | Edge cases listed below                                                            |
| Doc note                                            | `docs/reference/locations/location-workspace.md` — debounced persistable fields + flush rule |


---

### Suggested tests

- Region description **still debounces** during ordinary typing
- **Header Save** flushes the latest pending description **first** (or ordering guarantees equivalent outcome)
- **Changing region selection** does not lose the last pending debounced description
- **Unmount / route-leave** cleanup does not silently drop the last pending persistable edit
- **Dirty / save** behavior remains truthful after flush

---

### Acceptance criteria

- Region description still uses **debounce** for typing ergonomics
- Latest pending debounced persistable value is **flushed** before destructive boundaries that could drop it
- Header **Save** cannot miss the final buffered region description edit
- Changing selection / closing editing context does **not** silently lose the last pending persistable value
- Implementation leaves a **reusable pattern** for future debounced persistable fields

---

### Non-goals

- No DB migration
- No schema rename
- No wider workspace dirty/save redesign
- No conversion of **all** text fields away from debounce
- No unrelated object / edge / palette work

---

### Related code (starting points)

- Region metadata draft path: `**regionMetadataDraftAdapter.ts`**, `**LocationMapRegionMetadataForm`**, `**onPatchRegion**`
- Workspace model: `**useLocationEditWorkspaceModel**`, save handlers from `**useLocationEditSaveActions**`
- Reference doc: `**docs/reference/locations/location-workspace.md**` — state ownership, persistable checklist

