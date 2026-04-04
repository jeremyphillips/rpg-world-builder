# Stealth and hidden state

## Boundary: perception vs hidden state

- **Perception** (`canPerceiveTargetOccupantForCombat`, `canSeeForTargeting`, pair visibility for attack rolls) answers whether an observer **currently** sees a subject’s **occupant**. That seam is **unchanged** and remains the authority for sight.
- **Hidden state** (`CombatantInstance.stealth`) records **observer-relative** stealth bookkeeping **on top of** perception. It is **not** a second visibility engine.
- **Guessed position / sound awareness** (`CombatantInstance.awareness`, **`awareness/awareness-rules.ts`**) stores **observer-relative** last attributed **grid cells** when an observer does **not** see the occupant. It is **not** stealth and **not** sight — see [Awareness and guessed position](./awareness-and-guessed-position.md).
- **Targeting** continues to use **`canSeeForTargeting`**. **Attack-roll modifiers** continue to use **`resolveCombatantPairVisibilityForAttackRoll`**. Stealth rules live in **`stealth/stealth-rules.ts`** and layer semantics (lifecycle, future advantage hooks) without duplicating LOS/perception math.
- **Encounter grid (active viewer):** normal **tokens** are suppressed under strict POV when **`deriveViewerCombatantPresentationKind`** is not **`visible`** (equivalently: need **`canPerceiveTargetOccupantForCombat`** and not **`isHiddenFromObserver`** for a normal token). **Labels** use hidden-before-out-of-sight precedence so Hide stays distinct in UI. DM view (`viewerRole: 'dm'`) still shows all tokens. **Guessed-position** UI on the grid is deferred; see [Perception and visibility — render projection](./perception-and-visibility.md#render-projection).
- **Initiative sidebar / turn order / header:** the same seam feeds **`buildCombatantViewerPresentationKindById`** (`visible` / `out-of-sight` / `hidden`). **Presentation precedence** checks **`isHiddenFromObserver`** before generic **`!canPerceiveTargetOccupantForCombat`** so **Hidden** can show even when LOS/lighting would also deny perception. Combatants **remain** in the list with distinct chips; not removed from initiative. Presentation-only; reconciliation unchanged.

### Stealth reference facts

These are **rules / UX facts**, not TODOs:

1. **Hidden-from is pruned when observer perception becomes true** — an observer id is removed from **`hiddenFromObserverIds`** when **`canPerceiveTargetOccupantForCombat(observer, subject)`** is true (**`reconcileStealthHiddenForPerceivedObservers`**). That is the **only** automatic “reveal” path from perception; it tracks the shared occupant-perception seam.
2. **Losing hide basis alone does not remove hidden** — after movement or environment changes, **sustain** does **not** drop **`hiddenFromObserverIds`** just because **`getHideAttemptEligibilityDenialReason`** would now fail for a **new** Hide attempt. Optional combat-log lines (**`hide-basis-lost-context`**) describe that situation **without** mutating stealth.
3. **Strict POV still suppresses both “hidden” and “out-of-sight” tokens** — under strict point-of-view, the normal occupant token is shown only when presentation resolves to **`visible`**; **`hidden`** and **`out-of-sight`** both suppress it (chips/labels can still distinguish). See [Perception and visibility — render projection](./perception-and-visibility.md#render-projection).
4. **No guessed-position or sound-driven encounter gameplay yet** — on-grid **guessed-cell** presentation and **sound propagation / hearing** as a play loop are not built out; see [Perception and visibility](./perception-and-visibility.md#render-projection), [Awareness and guessed position](./awareness-and-guessed-position.md), and [Sound and awareness (roadmap)](./sound-and-awareness.md). Narrow **rules** for **`guessedCellByObserverId`** (e.g. noise hooks, some targeting) exist; they are **not** a substitute for full grid/sound UX.
5. **Viewer and log presentation modes materially affect the UI** — which combatants/tokens “count” as visible on the **grid** depends on **active viewer**, **DM vs PC**, and **strict POV** (see [Perception and visibility — Encounter UI](./perception-and-visibility.md#encounter-ui-presentation-modes)). The **combat log** **Compact / Normal / Debug** filter also changes which entries appear and whether **`debugDetails`** lines show; see [Combat log (stealth)](#combat-log-stealth) below.

---

## Runtime shape

- **`stealth?: CombatantStealthRuntime`** on the **subject** combatant — always an **object wrapper** (not a bare `hiddenFromObserverIds` on `CombatantInstance`) so metadata can grow without reshaping combatants.
- Stored fields:
  - **`hiddenFromObserverIds: string[]`** — combatant ids of observers for whom the subject is treated as hidden (subject to reconciliation below).
  - **`hideEligibility?: CombatantHideEligibilityExtension`** — optional extension flags (e.g. **`allowHalfCoverForHide`**, **`allowDimLightHide`**, **`allowMagicalConcealmentHide`**) persisted when hide resolution applies them so **stealth sustain** uses the **same** world-basis rules as hide entry. Type: [`combatant.types.ts`](../../packages/mechanics/src/combat/state/types/combatant.types.ts). See **`resolveHideEligibilityForCombatant`** in [`sight-hide-rules.ts`](../../packages/mechanics/src/combat/state/stealth/sight-hide-rules.ts).

---

## Single rules owner

All stealth **rules and mutations** live in:

**[`stealth-rules.ts`](../../packages/mechanics/src/combat/state/stealth/stealth-rules.ts)**

Other modules (**`action-resolver.ts`**, **`useEncounterState`**) call exported helpers only; they do not reimplement stealth logic.

---

## Hide attempt eligibility

**`getStealthHideAttemptDenialReason`** delegates to **`getHideAttemptEligibilityDenialReason`** in [`sight-hide-rules.ts`](../../packages/mechanics/src/combat/state/stealth/sight-hide-rules.ts): **occupant** perception (`canPerceiveTargetOccupantForCombat`) plus a **merged-world** hide basis **per observer–hider pair** when a tactical grid exists.

**Concealment and feature-flag branches** still use the **hider’s merged cell** only (same as before):

- **Baseline concealment** — [`cellWorldSupportsHideConcealment`](../../packages/mechanics/src/combat/state/stealth/sight-hide-rules.ts): heavy obscurement; **non-magical** light obscurement; darkness lighting; **magical darkness**. Dim-only and magical light obscurement need the feat/runtime flags below.
- **Feature-flag branches** (OR-merge, **hider cell only** — entry + sustain): **`allowDimLightHide`**, **`allowMagicalConcealmentHide`**, **`allowDifficultTerrainHide`** (merged **`terrainMovement`** **`difficult`** or **`greater-difficult`**), **`allowHighWindHide`** (merged **`atmosphereTags`** includes **`high-wind`**). See [`environment.resolve.ts`](../../packages/mechanics/src/environment/environment.resolve.ts) for `world.magical` and atmosphere merge.

**Terrain cover for hide** (when concealment/flags do not already allow the attempt):

- **With grid** — [`pairSupportsHideWorldBasisFromObserver`](../../packages/mechanics/src/combat/state/stealth/sight-hide-rules.ts) uses [`resolveTerrainCoverGradeForHideFromObserver`](../../packages/mechanics/src/combat/state/environment/observer-hide-terrain-cover.ts): **maximum** merged `terrainCover` along the same **supercover segment** as line-of-sight (`traceLineOfSightCells` in [`sight/space.sight.ts`](../../packages/mechanics/src/combat/space/sight/space.sight.ts)), from the **observer’s cell** through the **hider’s cell** (observer endpoint excluded from the max; hider cell included). Half cover only counts with **`allowHalfCoverForHide`**; three-quarters/full baseline.
- **Without grid / placements** — **fallback:** [`cellWorldSupportsHideAttemptWorldBasis`](../../packages/mechanics/src/combat/state/stealth/sight-hide-rules.ts) on the hider’s cell only (cell-local `terrainCover`), so behavior matches the legacy permissive tactical gap.

**Combatant-sourced feature flags:** **`getCombatantHideEligibilityExtensionOptions`** ([`combatant-hide-eligibility.ts`](../../packages/mechanics/src/combat/state/stealth/combatant-hide-eligibility.ts)) merges **one boolean seam** from:

1. **Authored snapshot** — **`stats.skillRuntime.hideEligibilityFeatureFlags`**, which **`buildCharacterCombatantInstance`** / **`buildMonsterCombatantInstance`** populate from data:
   - **Characters:** persisted **`Character.feats`** (string ids) → **`CharacterDetailDto.feats`** → **`deriveHideEligibilityFeatureFlagsFromCharacterDetail`** ([`derive-hide-eligibility-from-authored.ts`](../../src/features/encounter/helpers/combatants/derive-hide-eligibility-from-authored.ts)) → feat ids in **`FEAT_IDS_ALLOW_HALF_COVER_FOR_HIDE`** ([`hide-eligibility-feat-sources.ts`](../../packages/mechanics/src/combat/state/stealth/hide-eligibility-feat-sources.ts)) set **`allowHalfCoverForHide`** (e.g. **`skulker`**).
   - **Monsters:** optional **`mechanics.hideEligibilityFeatureFlags`** on the stat block (homebrew / special creatures).

2. **Temporary runtime** — same flags, **union (OR)** with the snapshot (see below), from [`hide-eligibility-runtime-sources.ts`](../../packages/mechanics/src/combat/state/stealth/hide-eligibility-runtime-sources.ts):
   - **`activeEffects`:** structured **`kind: 'hide-eligibility-grant'`** effects ([`HideEligibilityGrantEffect`](../../packages/mechanics/src/effects/effects.types.ts)) on the combatant stack, including nested payloads (e.g. **`aura.effects`**, **`state.ongoingEffects`**). Spell application can attach these via **`applyActionEffects`** in [`action-effects.ts`](../../packages/mechanics/src/combat/resolution/action/action-effects.ts).
   - **`conditions` / `states`:** **`RuntimeMarker`** ids/classifications (see [`hide-eligibility-runtime-sources.ts`](../../packages/mechanics/src/combat/state/stealth/hide-eligibility-runtime-sources.ts)): `hide-eligibility:allow-half-cover`, `hide-eligibility:allow-dim-light`, `hide-eligibility:allow-magical-concealment`, `hide-eligibility:allow-difficult-terrain`, `hide-eligibility:allow-high-wind`.

**Merge rule:** for each boolean, **true if any** source is true — authored snapshot **or** any qualifying active effect **or** marker.

That output feeds **`resolveHideEligibilityForCombatant`** after call-site / persisted layers.

**Optional overrides:** **`hideEligibility`** on **`StealthRulesOptions`** / **`GetHideAttemptEligibilityDenialReasonOptions`** — for tests or tools; normal encounter flow does **not** need to pass flags when they exist on the combatant. **`resolveHideEligibilityForCombatant`** precedence: **hide-attempt** — call-site → **`stealth.hideEligibility`** → **combatant-derived**; **stealth-sustain** — **`stealth.hideEligibility`** → call-site → **combatant-derived**. Reconciliation passes **`hideEligibilityResolveMode: 'stealth-sustain'`** on **`GetHideAttemptEligibilityDenialReasonOptions`**.

**Entry** uses **`getHideAttemptEligibilityDenialReason`** (pair-aware cover when gridded). **Sustain / reveal** after movement or environment changes is **not** driven by eligibility alone: losing cover/concealment basis for a **new** Hide attempt does **not** prune **`hiddenFromObserverIds`**. Observer-relative hidden state drops when the observer **can perceive** the subject’s occupant (**`reconcileStealthHiddenForPerceivedObservers`**) or when an explicit rule applies (e.g. **`breakStealthOnAttack`**). Optional combat-log lines may note “hide basis gone but still unseen” as **diagnostic context** (`hide-basis-lost-context`).

Eligibility answers **whether a hide attempt may be attempted** vs a given observer. It does **not** roll Stealth or compare to passive Perception.

**Remaining gaps:** richer **content** wiring (feats → new flags); deeper magical concealment than **`world.magical` + light obscurement**; underwater / extreme-cold atmosphere tags as hide bases; deeper **hearing** / propagation beyond the narrow guessed-cell seam — see [Awareness and guessed position](./awareness-and-guessed-position.md) and [TODO / future work](#todo--future-work).

---

## Hide resolution vs passive Perception (baseline)

**Flow:**

1. **Candidate observers:** **`resolveDefaultHideObservers`** lists other-side combatants for whom **`getStealthHideAttemptDenialReason`** is **`null`** (hide **eligibility** only — includes **observer-relative** terrain cover when gridded). Baseline observer set is **the opposing side**; distance and sense-specific filters beyond shared perception are **not** applied yet (see TODOs).
2. **No eligible observers:** if the candidate list is **empty**, **`resolveCombatAction`** logs the outcome and performs **no d20 Stealth roll** (nothing to compare against). Eligibility is evaluated **before** rolling.
3. **Stealth total:** when there is at least one candidate, **`action-resolver.ts`** rolls **d20 + Stealth modifier** for **`resolutionMode === 'hide'`**. Modifier comes from **`hideProfile.stealthModifier`** or **`getStealthCheckModifier(actor)`** (runtime snapshot: Dex + proficiency when threaded — see [`passive-perception.ts`](../../packages/mechanics/src/combat/state/awareness/passive-perception.ts)).
4. **Comparison:** **`resolveHideWithPassivePerception(state, hiderId, stealthTotal, options)`** compares that total to each **candidate** observer’s **passive Perception** via **`getPassivePerceptionScore(observer)`**.
5. **Threshold:** **`stealthBeatsPassivePerception(total, passive)`** — Stealth must be **strictly greater than** passive Perception (**`>`**). A **tie** (**`==`**) does **not** count as hidden from that observer (observer wins ties). This matches the strict-greater tests in **`action-resolution.hide.test.ts`** and **`stealth-rules.test.ts`**.
6. **Storage (partial success):** For each **candidate**, **beat** → observer id is **on** **`hiddenFromObserverIds`**; **fail or tie** → that id is **removed** if it was only in the candidate set. Observer ids **not** in the candidate list for this attempt are **unchanged** (so prior hidden-from state can persist for observers you did not re-contest). **`stealth.hideEligibility`** is set from the **effective** merged eligibility (**`resolveHideEligibilityForCombatant`** in **`hide-attempt`** mode), so call-site overrides, prior stealth snapshot, and **`skillRuntime.hideEligibilityFeatureFlags`** are reflected for later sustain.

**Passive Perception source:** authoritative runtime seam **`getPassivePerceptionScore`** — prefers **`stats.skillRuntime`** (explicit passive, PB × Perception proficiency, etc.) and legacy **`stats.passivePerception`**, then derived **`10 + Wisdom`** as in [`passive-perception.ts`](../../packages/mechanics/src/combat/state/awareness/passive-perception.ts). Populated from character/monster builders ([`combatant-builders.ts`](../../src/features/encounter/helpers/combatants/combatant-builders.ts)).

**Standard Hide action:** **`DEFAULT_HIDE_COMBAT_ACTION`** in [`combat-action.types.ts`](../../packages/mechanics/src/combat/resolution/combat-action.types.ts) (`resolutionMode: 'hide'`, `targeting: self`).

**Separation of concerns:** **Eligibility** (can you try?) ≠ **resolution** (did your Stealth beat their passive?) ≠ **visibility** (can they see your occupant right now?) ≠ **stored hidden state** (runtime bookkeeping). Rules do **not** conflate “currently unseen” with “hidden.”

**Not implemented:** active **opposed** Stealth vs **rolled** Perception (passive-only baseline). **`applyStealthHideSuccess`** remains for tests/manual/DM tooling and future active-contest output.

### Encounter UI: Hide from the current cell (no extra grid steps)

Hide is a normal **`CombatActionDefinition`** on the combatant’s action list (e.g. skill affordance → `id: 'hide'`, `resolutionMode: 'hide'`, `targeting: self`, `cost: { action: true }`). Execution uses **only** the hider’s **current** placement and merged environment — there is **no** destination cell, cover object, or move-and-hide step in this baseline.

- **Eligibility (disabled rows / Resolve):** **`getHideActionUnavailableReason`** in [`stealth-rules.ts`](../../packages/mechanics/src/combat/state/stealth/stealth-rules.ts) mirrors whether **`resolveDefaultHideObservers`** would be non-empty. If it returns a string, the Hide row is treated as invalid with that reason (`invalidActionReasons` in the action drawer), and **`getActionResolutionReadiness`** adds a **`hide-eligibility`** gate so Resolve stays off until the situation changes (e.g. concealment/cover). Same rules as the resolver — no duplicate stealth math in React.
- **Action economy:** Hide consumes the **standard Action** via **`spendActionCost`** in **`resolveCombatActionInternal`** (same path as other actions). Bonus-action Hide is not implemented.
- **Feedback:** Outcomes appear in the combat log (and encounter toast pipeline) via existing **`action-resolved`** entries; no separate stealth-only feedback channel.

**TODO (not in current UI baseline):** move then hide as one flow; bonus-action Hide (e.g. Cunning Action); choosing a **different** cell or **object** anchor to hide behind; richer “already hidden” / sound-driven UX.

---

## Reconciliation helpers (consistency with perception)

These keep stored **`hiddenFromObserverIds`** aligned with the **shared perception seam** so stealth does not become a divergent truth source:

| Helper | Purpose |
|--------|---------|
| **`reconcileStealthAfterMovementOrEnvironmentChange`** | **`reconcileStealthHiddenForPerceivedObservers`**, then optional **`appendStealthHideBasisLostContextNote`** diagnostics (combat log only — no stealth mutation). Use after movement, placement, zone, or baseline changes. |
| **`reconcileStealthHiddenForPerceivedObservers`** | Drop an observer from the subject’s list when that observer **can** perceive the subject’s occupant (observer-relative; partial lists preserved). |
| **`applyEncounterEnvironmentBaselinePatchAndReconcileStealth`** | **`updateEncounterEnvironmentBaseline`** + full reconcile (baseline-only callers; avoids circular imports). |

**Runtime integration (deterministic order):**

1. **`reconcileBattlefieldEffectAnchors`** (placement mutations, grid-object moves, aura anchor refresh) ends with **`reconcileStealthAfterMovementOrEnvironmentChange`** after environment-zone projection — covers **`placeCombatant`**, **`moveGridObjectInEncounterState`**, and any path that runs this anchor pass.
2. **`useEncounterState` `handleMoveCombatant`** — after **`moveCombatant`**, runs **`reconcileBattlefieldEffectAnchors`** (so creature-anchored zones + stealth stay aligned), then **`resolveAttachedAuraSpatialEntryAfterMovement`** when spell context is present.
3. **`resolveCombatActionInternal`** — still runs **`reconcileStealthHiddenForPerceivedObservers`** **before** resolving the declared action (unchanged).

**Pure baseline patch:** **`updateEncounterEnvironmentBaseline`** does **not** run stealth (keeps tests and imports simple). For runtime lighting/obscurement changes that should affect hidden state, use **`applyEncounterEnvironmentBaselinePatchAndReconcileStealth`**.

### Combat log (stealth)

Prune/reveal events are logged as **`type: 'stealth-reveal'`** (**`appendStealthPrunedObserverCanPerceiveNote`** in **`stealth-debug-log.ts`**):

- **`summary`** — plain-language sentence(s) per observer–subject pair, derived from the same perception breakdown as **`canPerceiveTargetOccupantForCombat`** (e.g. “clear line of sight … and can perceive the occupant” when grid + LOS/LOE + battlefield perception resolve; alternate wording for permissive / unresolved perception paths). Shown in **Normal** and **Debug** modes (importance **`supporting`**).
- **`debugDetails`** — semicolon-separated structured trace (**`reason=observer-can-perceive-target`**, **`traceKind=observer-perceive-prune-breakdown`**, compact **`perceive`** / **`perceiveIds`** pipes) for diagnosis. Shown only when the combat log is in **Debug** mode (see **`filterLogByMode`** / **`CombatLogPanel`**).

Hide-success, movement-reconcile headers, hide-basis-lost-context, and attack-break notes remain **`type: 'note'`** (debug importance in the combat-log bridge).

**TODO (still):** feat **display** names from a content catalog (today DTO uses id as name); observer-relative cover rays; sense-specific exceptions; richer “who counts as an observer” than passive hide resolution.

---

## Combat: attacks, targeting, and hidden state

**Design rule:** hidden state **does not** replace the shared visibility/perception seam. It **layers** bookkeeping (who you beat on Hide) on top; **attack rolls** and **sight targeting** still use **`canPerceiveTargetOccupantForCombat`** / **`canSeeForTargeting`** only.

| Concern | Source of truth | Uses `stealth` / `hiddenFromObserverIds`? |
|--------|-----------------|-------------------------------------------|
| Unseen attacker / unseen target (adv/dis on attack) | **`resolveCombatantPairVisibilityForAttackRoll`** → **`getAttackVisibilityRollModifiersFromPair`** | **No** — avoids double-counting when obscurement already denies occupant perception. |
| “Creature you can see” / sight-required targets | **`canSeeForTargeting`** | **No** |
| Hide vs passive Perception, hidden-from lists | **`stealth/stealth-rules.ts`**, **`resolveHideWithPassivePerception`** | **Yes** |
| Align hidden lists when perception changes | **`reconcileStealthHiddenForPerceivedObservers`** | **Yes** |

Contract constant: **`ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE`** (`stealth/stealth-attack-integration.ts`) is **`false`** — attack-roll code must stay free of stealth-based modifier branches.

**Gameplay benefit today:** “Hidden from observer X” lines up with hide resolution and reconciliation. **Combat advantage** from being hard to see flows through the **same** unseen-attacker / unseen-target rules as other cases (e.g. heavy obscurement), not a parallel “hidden = advantage” engine.

**Not modeled:** guessed location, sound-only detection, partial reveal per observer, Skulker-style exceptions.

---

## Break on attack (baseline)

**`breakStealthOnAttack`** clears the attacker’s entire **`stealth`** wrapper **after** the attack **d20 roll** is computed in **`action-resolver.ts`** (immediately after hit/miss is determined, before logging). That ordering keeps “reveal on attack” after the roll step; modifiers still come **only** from pair visibility (not from reading `stealth`).

**Semantics:** **global** reveal — all **`hiddenFromObserverIds`** cleared for the attacker. **TODO:** observer-relative reveal, location-only reveal, or feature-specific behavior.

---

## API summary

| Export | Role |
|--------|------|
| `getCombatantHideEligibilityExtensionOptions` | Derive hide flags from **snapshot + `activeEffects` + markers** (OR merge; see [`hide-eligibility-runtime-sources.ts`](../../packages/mechanics/src/combat/state/stealth/hide-eligibility-runtime-sources.ts)). |
| `getStealthHideAttemptDenialReason` | Hide **attempt** eligibility (delegates). |
| `getHideActionUnavailableReason` | UI/readiness: short reason when a Hide attempt is not allowed from the current cell (same basis as `resolveDefaultHideObservers`); `null` when allowed. |
| `getPassivePerceptionScore` | Passive Perception for hide comparison. |
| `getStealthCheckModifier` | Dex-based Stealth modifier for the Hide action roll. |
| `resolveHideWithPassivePerception` | Apply hide outcome vs passive Perception (after total is known). |
| `stealthBeatsPassivePerception` | Strict **`>`** threshold helper. |
| `applyStealthHideSuccess` | Merge **observerIds** (manual / future active contest); optional **`hideEligibility`** for tests/DM tooling. |
| `resolveHideEligibilityForCombatant` | Effective extension flags for hide attempt vs sustain (`stealth/sight-hide-rules.ts`). |
| `resolveDefaultHideObservers` | Candidate observers (eligibility only). |
| `reconcileStealthAfterMovementOrEnvironmentChange` | Perceived-again pruning + optional hide-basis diagnostic notes (see `stealth-debug-log.ts`). |
| `applyEncounterEnvironmentBaselinePatchAndReconcileStealth` | Baseline patch + full reconcile. |
| `reconcileStealthHiddenForPerceivedObservers` | Align hidden-from with perception. |
| `appendStealthHideBasisLostContextNote` | Combat-log diagnostic when hide world basis is gone but observers still cannot perceive (does not change stealth). |
| `breakStealthOnAttack` | Clear attacker stealth after attack roll (global reveal). |
| `ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE` | Contract flag (`false`) — attack modifiers must not read `stealth`. |
| `isHiddenFromObserver` | Read helper (bookkeeping only). |

---

## TODO / future work

- **Move-and-hide**, **bonus-action Hide** (e.g. Cunning Action), **grid/object selection** for hiding in a chosen cell or behind a cover object — not implemented; current Hide is a single **Action** from the **current** cell only.
- **Finer cover than merged `terrainCover` per cell** — e.g. edge/corner rules, size, true 3D LOS.
- **Observer-relative or partial break** on attack (vs global `breakStealthOnAttack`).
- **Narrow guessed-cell / noise seam** — implemented in **`awareness/awareness-rules.ts`** (see [Awareness and guessed position](./awareness-and-guessed-position.md)); full hearing propagation and attack-at-square remain TODO.
- **Active opposed** Stealth vs **rolled** Perception (contested check path; keep passive baseline as fallback).
- **Cell-local cover** is merged on the world cell; **per-observer** cover from geometry is still TODO.
- **Broader stealth feature catalog** — additional flags (e.g. other **`EncounterAtmosphereTag`** ids, slip-only terrain), content/feat wiring for **`allowDifficultTerrainHide`** / **`allowHighWindHide`**, subclass-specific rules.
- **Deeper magical concealment** — e.g. per-spell nuance not captured by **`world.magical` + visibilityObscured** alone.
- **Sense-specific** break and bypass threading consistent with **`EncounterViewerPerceptionCapabilities`** (blindsight vs hidden, etc.).
- **Richer observer sets** — e.g. allies in range, line-of-sight, or “aware” subsets instead of only all opposing combatants passing eligibility.
- Further **skill/item** bonuses on snapshots if not already covered by **`CombatantSkillRuntimeSnapshot`**.

See also [Perception and visibility](./perception-and-visibility.md) and [Sound and awareness (roadmap)](./sound-and-awareness.md) (future hearing / awareness; current guessed-cell behavior remains in [Awareness and guessed position](./awareness-and-guessed-position.md)).
