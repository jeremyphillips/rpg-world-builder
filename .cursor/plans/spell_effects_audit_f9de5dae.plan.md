---
name: Spell effects audit
overview: Audit ~338 system spells in `rulesets/system/spells/data` against [docs/reference/effects.md](docs/reference/effects.md) and [docs/reference/resolution.md](docs/reference/resolution.md), using a three-tier effect taxonomy, shared classification logic, targeting-complexity flags, and a lightweight Phase 1—prioritizing classifier fixes and multi-target work over expanding the report into a static analyzer.
todos:
  - id: extract-classifier
    content: Extract `classifySpellResolutionMode` (minimal deps) to a shared module used by spell-combat-adapter and Phase 1 audit; avoid duplicating classification logic
    status: completed
  - id: inventory-script
    content: Lightweight report—merged spells, effect kinds, buckets, mechanicalSupportLevel, targeting flags, stranded + ambiguous-delivery lints; optional CSV or docs audit snapshot (not CI-gated)
    status: completed
  - id: broaden-classify
    content: Broaden classifier; permanent behavioral tests (effects vs log-only examples); stranded count as PR/report metric only—not a CI gate
    status: completed
  - id: authoring-lint
    content: Grep/script—save.dc, damage vs save branches, deliveryMethod for spell attacks, ambiguous delivery shape flag
    status: completed
  - id: phase3-triage
    content: "Remaining: area semantics (all-enemies vs allies-in-area) — needs targeting model work"
    status: pending
isProject: false
---

# Spell catalog audit (effects + resolution) — revised

## Context

- **Catalog:** [src/features/mechanics/domain/rulesets/system/spells/index.ts](src/features/mechanics/domain/rulesets/system/spells/index.ts)
- **Authoring:** [docs/reference/effects.md](docs/reference/effects.md)
- **Runtime:** [docs/reference/resolution.md](docs/reference/resolution.md) §8 + [src/features/encounter/helpers/spell-combat-adapter.ts](src/features/encounter/helpers/spell-combat-adapter.ts)

## Critical discovery (unchanged)

`[classifySpellResolutionMode](src/features/encounter/helpers/spell-combat-adapter.ts)` today only routes to `effects` for `save`, healing `hit-points`, `modifier`, or `immunity`. Spells with other **fully actionable** kinds (e.g. `damage`, `roll-modifier`) can still land in `log-only`. Examples: Magic Missile, Protection from Evil and Good in [level1-m-z.ts](src/features/mechanics/domain/rulesets/system/spells/data/level1-m-z.ts).

---

## Effect kinds — three buckets (audit output)

Avoid a single flat “resolvable” set; it **overclaims** relative to resolution.md §8 and user-visible outcomes.

### Fully actionable now

Kinds where `applyActionEffects` already has **meaningful mechanical** behavior for typical spells—good candidates to **route to `effects`** once targeting is expressible:

- `damage`
- `save`
- `condition`
- `state`
- `hit-points`
- `roll-modifier`
- `modifier`
- `immunity` — **only when** the authored scope is one the engine actually applies (per matrix: `spell` / `source-action`; other scopes degrade to log—treat those as **partial** in the report if you can detect scope, else default immunity to partial for honesty)

### Partially actionable

Kinds that may justify `effects` mode for **registration** (hooks, markers) but have **caveats** or incomplete semantics:

- `interval` — turn hooks work; area/point truth may be coarse
- `immunity` — depends on `scope`
- selected `state` subcases if any diverge from “full” in practice (cross-check [action-effects.ts](src/features/mechanics/domain/encounter/resolution/action/action-effects.ts) when auditing)

### Non-mechanical / support-only (for classification reporting)

- `note`
- `targeting` — consumed upstream for targeting shape, not applied as payload in `applyActionEffects`

**Per-spell `mechanicalSupportLevel`:** `none` | `partial` | `full`

- Derive from presence of kinds in the buckets above (full = any fully-actionable kind present without relying only on partial; partial = only partial-bucket kinds or mixed marginal cases—keep the rule **simple** in code, e.g. “full if any fully-actionable kind; partial else if any partial-bucket kind”).
- `**stranded`:** `mechanicalSupportLevel !== 'none' && adapterMode === 'log-only'`

This keeps the report **trustworthy** and avoids implying every flagged spell will fully “work” in combat.

---

## Shared classifier (no drift)

**Strong preference:** do **not** reimplement `classifySpellResolutionMode` in the audit script.

- **Preferred:** extract classification into a small module (e.g. `spell-resolution-classifier.ts` next to the adapter) that depends only on `Spell` + minimal types, then:
  - `spell-combat-adapter.ts` imports and calls it
  - Phase 1 script or Vitest helper imports the **same** function
- **Alternative:** direct import of the adapter module from the audit if tree-shaking/deps stay acceptable—usually heavier in a Node script.

**Pushback:** pure duplication is worse than a **short** extraction; the extraction should be thin (move the function + nothing else if possible).

---

## Phase 1 — intentionally lightweight

**Scope ceiling:** merged catalog load, effect kind multiset, buckets + `mechanicalSupportLevel`, **shared** `adapterMode`, stranded flag, targeting-complexity flags, a **small** set of lints. **Not** a mini static analyzer.

### Rows and columns

Per spell (CSV or table):

- Identity: `id`, `level`, `deliveryMethod` (from spell container)
- Effect kinds present (multiset or sorted unique)
- `mechanicalSupportLevel`, `adapterMode`, `stranded`
- **Targeting / delivery complexity (booleans or scalars)** — triage after classifier changes:
  - `hasInstances` — any `damage.instances` (or spell-level pattern you standardize on)
  - `hasChosenCreatures` — targeting `chosen-creatures`
  - `hasSequenceSteps` — if you have sequence fields on actions/spells, else omit until typed
  - `hasCreaturesInArea` / `hasAreaTargeting` — e.g. `creatures-in-area` or `targeting.area`
  - `hasMultipleTargets` — derived from `count` > 1, `canSelectSameTargetMultipleTimes`, area, etc. (define one conservative rule)
  - `requiresTargetSelection` — heuristic: not pure `self` range **or** explicit targeting that implies picker
  - `rangeFeet` — from `targeting.rangeFeet` or spell `range` when `distance` (optional column)
- **Lint flags (separate from stranded):**
  - Existing: explicit `save.dc` where caster-derived expected; damage placement vs save branches; missing `deliveryMethod` for obvious spell-attack shapes (heuristic/grep)
  - **New — `ambiguousDelivery`:** structured mechanical effects exist, but delivery path is unclear:
    - top-level `damage` (or mechanical kinds implying HP change)
    - no `save`
    - no `deliveryMethod`
    - no explicit auto-hit / special resolution hook in data (e.g. if you later add `spell.resolution` / `auto-hit` authoring—today **absent** in system spells)
    - not classified as `attack-roll`
    This is **orthogonal** to `stranded`: a spell can be stranded (classifier bug) **or** ambiguous (authoring/semantics), **or** both.

### Deliverable

- One runnable output (script or Vitest helper) for the table + lints.
- **Stranded count:** use only as a **reporting metric** during the work (before/after Phase 2 delta, PR summary, temporary script output, optional audit markdown snapshot). **Do not** add a permanent CI gate such as “stranded count must never increase” or “must stay below N”—that fights catalog growth and new stubs.

---

## Phase 2 — broaden classifier + permanent behavioral tests

1. **Broaden `classifySpellResolutionMode`** so spells with **fully actionable** kinds route to `effects` instead of `log-only`, subject to the targeting expressibility guardrail below.
2. **Permanent tests** (stable contracts) in [encounter-helpers.test.ts](src/features/encounter/helpers/encounter-helpers.test.ts) — exercise the **shared classifier** (or adapter using it), with minimal synthetic spells:
  - **Route to `effects`:** damage-only; roll-modifier-only; condition-only; state-only (each a dedicated case).
  - **Stay `log-only`:** note-only; targeting-only (no other mechanical kinds).
   These examples are **more stable** than a global stranded count and document intended behavior for authors.
3. **Condition-only (and similar) guardrail:** Prefer routing to `effects` when **at least one** fully actionable kind exists **and** the spell’s targeting/delivery shape is **currently expressible** by `buildSpellTargeting` + action resolution (single-target, self, single-creature, dead-creature, all-enemies, etc.). If a spell is **only** mechanically interesting under `chosen-creatures` / multi-instance flows you do not support yet, consider **leaving** it `log-only` **or** routing with documented “degraded” behavior—**audit mindset:** flag these via targeting columns **before** flipping the classifier so you do not ship silent no-ops.
4. **Stranded count as metric (not CI):** Run Phase 1 report before and after Phase 2; record delta in PR description or audit notes. Optional: paste counts into `docs/` audit snapshot if useful—still not a merge gate.
5. **Doc touch:** One paragraph in effects.md or resolution.md stating when the adapter routes to `effects` vs `attack-roll` vs `log-only`.

---

## Phase 3 — reordered by likely spell volume / user pain

Triage **remaining** stranded or mis-behaving spells using Phase 1 **targeting** columns:

1. **Instances / `chosen-creatures` / multi-step selection** — highest impact on “spell does wrong thing or nothing” once classification widens.
2. **Area semantics** — `creatures-in-area` → `all-enemies` and ally/exclusion gaps (resolution.md §9).
3. `**hpThreshold` / explicit auto-hit authoring** — important but **lower volume** until spells define `spell.resolution` (currently sparse/absent in system data).
4. **Concentration + duration injection** — correctness for sustained effects; often less visible than wrong targets.

**Progress:** (1) **Shipped** — multi-instance `effects` sequence (Magic Missile). (2) Area ally/foe — still open. (3) `**resolution.hpThreshold`** + `aboveThresholdEffects` on `CombatActionDefinition` and Power Word Kill data — shipped. (4) **Timed spell duration** → `fixed` turn effect duration for inject — shipped; concentration/dispel edge cases may still need follow-up.

---

## Execution order (table)


| Priority | Work                                                                                                           | Effort     |
| -------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| 1        | Extract shared classifier + Phase 1 lightweight report (buckets, targeting flags, stranded, ambiguousDelivery) | Low        |
| 2        | Phase 2 broaden classifier + tests + stranded count before/after                                               | Low–medium |
| 3        | Phase 3 triage by targeting flags: instances/chosen-creatures → area → hpThreshold → concentration/duration    | Medium     |


---

## Canonical files

- [spell-combat-adapter.ts](src/features/encounter/helpers/spell-combat-adapter.ts) (after extraction: + small classifier module)
- [action-effects.ts](src/features/mechanics/domain/encounter/resolution/action/action-effects.ts)
- [resolution.md](docs/reference/resolution.md) §8
- [effects.md](docs/reference/effects.md) §§3, 5, 7
- [system/spells/data/*.ts](src/features/mechanics/domain/rulesets/system/spells/data)

