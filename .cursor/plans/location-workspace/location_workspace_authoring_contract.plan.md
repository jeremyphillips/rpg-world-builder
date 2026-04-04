---
name: Location workspace authoring contract
overview: Shared **editor-facing** workspace contract; **system** (patch) + **homebrew** (full-draft) **thin adapters**. Unify contract only — not persistence. Vocabulary `campaign`→`homebrew` where safe; explicit internal vs storage compatibility boundaries. **No** DB/API/storage migration. Prerequisite — [Location workspace dirty state](location_workspace_dirty_state_4d54eedc.plan.md).
todos:
  - id: authoring-contract-phaseA-surface
    content: "Phase A: define shared contract (types/interface + shared vs mode-specific note)"
    status: completed
  - id: authoring-contract-phaseB-adapters
    content: "Phase B: thin system + homebrew adapters; same editor surface"
    status: completed
  - id: authoring-contract-phaseC-wire-ui
    content: "Phase C: header/workspace entry points consume contract; reduce mode leakage"
    status: completed
  - id: authoring-contract-phaseD-vocabulary
    content: "Phase D: internal campaign→homebrew renames; preserve storage-facing stability"
    status: completed
  - id: authoring-contract-phaseE-docs
    content: "Phase E: docs — contract, adapters, vocabulary, contributor rules"
    status: completed
  - id: authoring-contract-tests
    content: "Tests: contract shape per adapter; dirty/saveability; header via contract; no-regression"
    status: pending
isProject: true
---

# Location workspace: shared authoring contract (homebrew + system adapters)

### Prerequisite / context

The [Location workspace dirty state](location_workspace_dirty_state_4d54eedc.plan.md) work established:

- persistable snapshot alignment
- baseline lifecycle
- state ownership for persistable edits (**persistable → workspace draft**)

This plan builds on that foundation and focuses on **editor-facing unification**:

- one shared workspace authoring contract
- two different persistence strategies hidden behind adapters

### Core principle

**Unify the editor contract, not the persistence model.**

- **System** location editing remains patch-based
- **Homebrew** location editing remains full-document / owned-draft based

The header, workspace shell, and future editor features should speak to one shared contract, while the adapter layer hides the mode-specific persistence semantics.

---

## Objective

Refactor the location workspace so the **editor-facing contract is shared**, while the underlying persistence strategy remains mode-specific:

- **system locations** remain patch-based
- **homebrew locations** remain full-document / owned-draft based

This pass is primarily a **code vocabulary and architecture refactor**. It should migrate code references from **campaign** to **homebrew** where that improves clarity, without changing persisted database shape or disrupting existing data.

---

## Important constraints

### Must not change

- database schemas
- stored field names
- persisted document shapes
- existing DB data
- public-facing API/storage contracts where a rename would break existing reads/writes

### Must not do

- any DB migration
- any storage migration
- any “fake unification” that forces system patch persistence to look like full-document persistence internally
- any broad editor/tool redesign unrelated to the workspace contract

### Allowed

- internal aliases / wrappers
- compatibility shims at module boundaries
- internal vocabulary cleanup from `campaign` to `homebrew` where safe and accurate

This is a **codebase vocabulary + editor architecture** refactor only.

---

## Non-goals

This plan is **not**:

- a DB migration
- an API rename pass
- a route reorganization pass
- a persistence unification pass
- an object-tool / palette redesign
- a full workspace rewrite
- a “put everything into one giant form tree” refactor

---

## Architectural goal

Standardize the workspace around a shared authoring contract so the UI/header/editor logic does not need to know whether it is editing:

- a patch-backed **system** location
- a full-draft **homebrew** location

The shared contract should become the single editor-facing integration point for:

- dirty state
- saveability
- baseline projection
- draft projection
- persistable update actions
- initialization / rebaseline lifecycle

Mode-specific persistence logic must stay behind adapters and should not leak throughout the workspace UI.

---

## Shared workspace authoring contract

Introduce or formalize a mode-aware workspace authoring contract with a compact, explicit surface.

### Required shared surface

Each adapter should expose the same editor-facing concepts, along these lines:

- `mode`
- `draftProjection`
- `persistedBaselineProjection`
- `isDirty`
- `canSave`
- `saveBlockReason`
- persistable update actions
- initialize / hydrate
- rebaseline after successful save
- save entry point or the inputs needed by the save action layer

### Contract rules

- Header dirty/save must talk to this shared contract
- Future workspace features should extend this contract intentionally
- Dirty and saveability must remain separate concepts
- Persistable edits must not live only in hidden panel-local state
- The contract may be implemented differently by system vs homebrew modes

### Important distinction

The contract standardizes **editor behavior**, not **storage structure**.

That means:

- system mode may derive dirty via patch semantics
- homebrew mode may derive dirty via draft-vs-baseline projection comparison

Both are valid as long as the editor-facing contract remains consistent.

---

## Mode-specific implementations

### System location adapter

System editing remains patch-based.

**Responsibilities:**

- derive draft projection from patch-driven state plus any workspace draft slices
- derive baseline / comparison semantics according to patch-driven editing
- compute dirty according to patch semantics
- expose the shared workspace contract without pretending system mode is full-document persistence

### Homebrew location adapter

Homebrew editing remains full-draft / full-document oriented.

**Responsibilities:**

- derive draft projection from current homebrew workspace state
- derive baseline from persisted homebrew location state
- compute dirty by comparing current draft projection to persisted baseline
- expose the same shared workspace contract shape as system mode

---

## Vocabulary migration requirement

For clarity, prefer **homebrew** instead of **campaign** in code where the meaning is really:

- user-authored
- non-system
- full-document / owned-draft editing

### Do

- rename local variables, helper names, hook names, selector names, comments, and docs where the concept is truly “homebrew authoring”
- improve terminology in workspace architecture docs to distinguish:
  - system
  - homebrew
  - shared workspace contract

### Do not

- rename persisted DB fields
- rename stored schema keys
- rename risky API request/response fields
- change storage semantics
- introduce breaking public-facing contract changes in this pass

If an identifier is tied to current route/API/storage contracts, keep compatibility and use a clearer internal alias or wrapper rather than forcing a risky rename.

---

## Compatibility boundary rule

Keep compatibility boundaries explicit.

### Internal / editor-facing code

May adopt:

- `homebrew`
- shared adapter terminology
- clearer workspace contract naming

### External / storage-facing code

Should remain stable unless a rename is provably internal and safe:

- persisted fields
- DTOs
- route shapes
- storage mappers
- DB documents

If bridging is needed, isolate it at the module boundary rather than letting mixed vocabulary spread everywhere.

---

## Preferred refactor shape

### Phase A — define the shared authoring contract

Audit the current location workspace logic and write down the exact editor-facing contract surface.

#### Shared concerns to capture

- dirty
- canSave / saveBlockReason
- draft projection
- persisted baseline projection
- update actions for persistable state
- initialization / hydration
- rebaseline lifecycle after save

#### Mode-specific concerns to keep behind adapters

- patch handling
- full-document baseline comparison
- mode-specific normalization / projection details
- mode-specific save wiring

#### Deliverables

- a compact interface / type / architectural note defining the shared contract
- a short note explaining which parts are shared vs mode-specific

#### Acceptance criteria

- there is one clear editor-facing contract shape
- contributors can tell where new workspace behavior should be added

---

### Phase B — implement thin mode adapters

Create two explicit adapters:

- `system` location workspace authoring adapter
- `homebrew` location workspace authoring adapter

#### Guidance

- keep the adapter surface modest
- avoid building a large generic framework
- prefer explicit, readable adapter code over clever indirection
- do not hide meaningful semantic differences between modes; isolate them

#### Acceptance criteria

- both adapters present the same editor-facing surface
- system remains patch-based internally
- homebrew remains full-document based internally

---

### Phase C — route header/workspace entry points through the shared contract

Update workspace/header entry points so they consume the shared contract rather than directly branching through scattered mode-specific dirty/save semantics.

#### Goals

- header logic becomes mode-agnostic
- dirty/saveability vocabulary becomes consistent
- future workspace features target one editor contract
- mode-specific persistence semantics stop leaking across the workspace shell

#### Acceptance criteria

- header dirty/saveability logic reads from the shared contract
- scattered mode-specific branching is reduced or eliminated from workspace UI entry points
- no actual persistence unification is introduced

---

### Phase D — migrate internal vocabulary from campaign to homebrew

After the shared contract and adapters are working, rename internal code-level terminology that currently says `campaign` but really means homebrew / user-authored location editing.

#### Likely candidates

- hook names
- helper names
- selector names
- doc sections
- local prop names
- comments
- internal type names where safe

#### Guidance

- prefer incremental renames with compatibility wrappers where useful
- keep externally risky renames out of scope
- make sure final naming clearly separates:
  - system editing
  - homebrew editing
  - shared workspace behavior

#### Acceptance criteria

- code vocabulary prefers `homebrew` where that is the real concept
- external/storage-facing compatibility is preserved

---

### Phase E — document the standard

Update workspace docs to explain:

- the shared location workspace authoring contract
- why system and homebrew intentionally use different persistence strategies
- which vocabulary is preferred in code
- what contributors should extend when adding new persistable state

#### Contributor rules

- extend the shared authoring contract intentionally
- implement mode-specific behavior in the appropriate adapter
- keep persistable data in canonical workspace draft/projection ownership
- do not leak hidden persistable state outside the contract
- do not assume system and homebrew persistence work the same way internally
- keep dirty and saveability separate

#### Acceptance criteria

- docs reflect the new architecture clearly
- future contributors have a short, actionable rule set to follow

---

## Testing strategy

Add focused tests to prove the contract, not just the structure.

### Contract-level tests

- system adapter exposes the expected shared shape
- homebrew adapter exposes the expected shared shape
- dirty/saveability semantics are correct for each mode

### Header/workspace tests

- header reads dirty/saveability through the shared contract
- mode-specific internals do not need to leak into header behavior
- save block reasons remain truthful in both modes

### Compatibility / no-regression tests

- no DB/storage shape changes are introduced
- existing save flows continue to work
- vocabulary migration does not break existing route/API/storage behavior

---

## Guardrails

### Do

- keep this refactor architecture-focused
- improve clarity and reduce mode leakage in UI/workspace code
- preserve current DB/storage behavior
- preserve current runtime behavior unless a change is required to honor the shared contract
- keep adapters explicit and understandable

### Do not

- perform a DB migration
- change persisted schema names
- merge patch-based and full-document persistence into one fake model
- broaden into unrelated tool or editor redesign work
- let naming cleanup drive risky boundary changes

---

## Acceptance criteria

This refactor is complete when all of the following are true:

- The location workspace uses a **shared authoring contract** for editor-facing behavior
- System and homebrew locations each implement that contract through **mode-appropriate adapters**
- Header/workspace code no longer relies on **deeply scattered** mode-specific dirty/save assumptions
- Code vocabulary prefers **homebrew** over **campaign** where that is the real concept
- **No** database data, stored schema, or persisted records are disrupted by this pass
- Docs clearly explain that this was a **codebase vocabulary/architecture cleanup**, not a storage migration
- Future workspace work has **one clear extension point**: the shared authoring contract plus the appropriate mode adapter
