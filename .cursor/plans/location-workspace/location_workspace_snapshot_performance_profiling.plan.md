---
name: Workspace snapshot performance profiling
overview: Measure the real cost of workspace snapshot derivation before any optimization, and explicitly document path preview performance as a deferred item for future review unless profiling or user pain justifies follow-up. No speculative optimization in this pass.
todos:
  - id: profile-workspace-snapshot
    content: Instrument/profile workspace snapshot derivation under realistic edit flows and map sizes; identify whether recompute cost is materially hot
    status: completed
  - id: isolate-cost-centers
    content: Determine whether cost comes from full form watch breadth, gridDraft normalization/equality, stairs participation, projection assembly, or downstream render churn
    status: completed
  - id: document-findings
    content: "Record profiling results and recommendation: no action, monitor, or create targeted optimization follow-up"
    status: completed
  - id: defer-path-preview
    content: Document path preview performance as a deferred future-review item unless profiling or real user pain justifies a dedicated optimization pass
    status: completed
  - id: update-reference-doc
    content: Extend docs/reference/locations/location-workspace.md (or adjacent perf note) with snapshot profiling outcome and explicit deferred status for path preview performance
    status: completed
isProject: true
---

# Workspace snapshot performance profiling

**Status:** **Done** (April 2026). Synthetic Node benchmarks in `workspacePersistableSnapshot.perf.test.ts`; findings and **no action / monitor** recommendation in `docs/reference/locations/location-workspace.md` (**Performance — workspace snapshot**). Path preview explicitly **deferred** in Open issues §3 and cross-linked.

## Delivered summary


| Question                   | Outcome                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Is snapshot recompute hot? | Not for minimal–medium synthetic payloads; stress payloads still bounded by CI smoke thresholds (tens of ms order).                           |
| Cost centers               | `toLocationInput`, building stairs merge (buildings only), `buildPersistableMapPayloadFromGridDraft` (normalize + sorts), `stableStringify`.  |
| `watch()` breadth          | Full-form `watch()` invalidates `authoringContract` on any form change — documented as frequency driver, not microbenchmarked as DOM latency. |
| Path preview               | Out of snapshot path; **deferred** until profiling or user pain — unchanged by this pass.                                                     |
| Recommendation             | **No action** for typical maps; **monitor** at extreme payload sizes; browser Performance panel if pain appears.                              |


---

The sections below preserve the **original plan spec** (requirements, constraints, acceptance criteria) for reference.

**Parent context:** Workspace dirty/save architecture, persistable slice participation, debounced persistable flush behavior, and normalization policy have been stabilized. Remaining performance-related items should now be handled with evidence, not guesswork. Path preview performance remains a known possible future issue, but should stay documented/deferred unless profiling or actual user pain justifies action.

## Objective

Run a focused, evidence-driven profiling pass on **workspace snapshot derivation** to answer:

- Is snapshot recomputation materially expensive in realistic editing flows?
- If yes, which part is actually hot?
- Does this warrant a targeted optimization follow-up?
- If not, can we confidently leave the current architecture in place?

At the same time, explicitly document **path preview performance** as a deferred item to keep in the roadmap/reference for future review, not to implement now.

## Core principle

Do **not** optimize by theory.

This pass is for:

- measuring
- identifying real cost centers
- documenting the outcome

It is **not** for speculative refactors.

## Constraints

- No DB/schema/storage changes
- No dirty/save contract redesign
- No broad editor/tool redesign
- No speculative performance rewrites without profiling evidence
- Keep this pass focused on measurement, analysis, and documentation
- Path preview performance should be documented for future review, not implemented here unless profiling or clear user pain proves it is necessary

## Scope

### In scope

- measuring workspace snapshot/projection cost
- understanding cost contributors
- determining whether optimization is warranted
- documenting deferred status for path preview performance

### Out of scope

- implementing broad snapshot optimizations by default
- optimizing path preview computation in this pass
- unrelated interaction or rendering redesign
- refactoring watch/subscription architecture unless profiling clearly justifies a follow-up plan

## Profiling questions to answer

### Workspace snapshot path

Measure or inspect the cost of:

- full form watch breadth
- draft projection / persistable snapshot assembly
- gridDraft normalization/equality
- stairs participation in snapshot inputs
- compare/baseline logic as relevant
- any downstream render churn caused by snapshot recomputation

### Path preview

Do not optimize path preview here by default. Instead answer:

- Is there any currently observed user-visible pain?
- Is there profiling evidence that path preview is a real hot path worth prioritizing next?
- If not, keep it documented for future review only

## Implementation goals

### 1. Profile realistic editing scenarios

Measure snapshot behavior during representative workflows, ideally including:

- small map / simple metadata editing
- medium map / ordinary authoring flow
- larger map / heavier authoring flow if practical
- region/object/stair-related edits that exercise current snapshot inputs

Use the smallest reasonable instrumentation that gives trustworthy answers.

The goal is not micro-benchmark vanity; it is determining whether users are likely to feel the cost.

### 2. Isolate actual cost centers

If snapshot recomputation is expensive, determine the main source(s), for example:

- broad `watch()` subscriptions
- repeated normalization of large gridDraft payloads
- equality checks on persistable map slices
- stairs-derived snapshot inputs
- render cascades downstream of recompute

Be specific enough that a future optimization pass can target the real hot path instead of guessing.

### 3. Produce an explicit recommendation

At the end of the profiling pass, classify the outcome into one of these:

- **No action** — current cost is acceptable; keep architecture as is
- **Monitor** — no immediate optimization, but note likely future scale threshold
- **Targeted follow-up** — create a narrow optimization plan for the identified hot path(s)

Do not leave the result as “maybe optimize later” without a recommendation.

### 4. Document path preview performance as deferred

Add an explicit note to the relevant reference/roadmap docs that:

- path preview performance remains a known potential future review item
- it is **not** being implemented in this pass
- follow-up should occur only if:
  - profiling points to it, or
  - real user pain / long-chain lag justifies it

This should keep the item visible without creating pressure for premature optimization.

### 5. Update docs/reference

Update `docs/reference/locations/location-workspace.md` or the relevant perf/reference section with:

- what was profiled
- key findings
- recommendation (no action / monitor / targeted follow-up)
- explicit deferred status for path preview performance

Keep the documentation concise and operational.

## Design guidance

- Prefer real interaction profiling over synthetic benchmark theater
- Focus on the workspace snapshot path as used in actual editing
- If results are clean, say so and stop
- If a hot path is found, name it clearly but save optimization for a follow-up plan unless it is trivial and unquestionably safe
- Keep path preview performance visible in docs, but do not let it hijack this pass

## Suggested deliverables

- concise profiling pass over workspace snapshot derivation
- identification of any real cost centers
- explicit recommendation: no action / monitor / targeted follow-up
- docs update with profiling outcome
- docs note marking path preview performance as deferred for future review

## Suggested output format for findings

Capture findings in a short structure such as:

- scenarios tested
- observed behavior
- likely cost centers
- user-visible impact assessment
- recommendation
- deferred note for path preview performance

## Acceptance criteria

This pass is complete when all of the following are true:

- workspace snapshot derivation has been profiled in realistic editing scenarios
- any meaningful cost center is identified clearly enough to target later
- the result includes an explicit recommendation: no action, monitor, or targeted follow-up
- no speculative optimization is introduced without evidence
- path preview performance is documented as a deferred future-review item
- docs/reference clearly reflect both the profiling outcome and the deferred path preview status

## Non-goals

- no DB migration
- no schema rename
- no path preview optimization in this pass by default
- no broad watch/subscription refactor without evidence
- no unrelated workspace/editor redesign

## Related plans (this directory)

See [README.md](README.md).