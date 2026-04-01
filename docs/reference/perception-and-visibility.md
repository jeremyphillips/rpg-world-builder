# Perception and Visibility

## Purpose

This layer answers **who can see what** on the tactical battlefield for **rules resolution** and **presentation**. Deferred non-visual awareness / sound roadmap: [Sound and awareness (roadmap)](./sound-and-awareness.md). It separates:

- **Objective** environment at a grid cell (`EncounterWorldCellEnvironment`)
- **Derived** viewer-relative perception at a cell (`EncounterViewerPerceptionCell`)
- **UI** mapping from perception to grid fills, token visibility, and veils (`perception.render.projection.ts`)

Combat mechanics that care about “seeing” a creature (targeting, attack modifiers, opportunity attacks, sight-gated checks, Hide attempt eligibility) should use **shared helpers** built on **`canPerceiveTargetOccupantForCombat`**, not ad hoc cell checks or a second visibility engine.

---

## Layer model

### Environment / world state

Baseline encounter defaults, environment zones, and **merged per-cell world** live on `EncounterState` and resolve to `EncounterWorldCellEnvironment` (lighting, obscurement, magical darkness flags, etc.). This is **not** “what the PC sees”; it is input to perception.

See [Encounter environment (layered model)](./environments.md) for baseline, zones, merge rules, and `resolveWorldEnvironmentFromEncounterState`.

### Pair visibility / perception

For **two combatants**, the domain asks whether an **observer** can perceive the **target’s occupant** for combat rules. The core function is **`canPerceiveTargetOccupantForCombat`** (`visibility/combatant-pair-visibility.ts`), which composes:

- Condition-based **can the observer see at all** (`canSee` / blinded, etc.)
- **Invisible** vs **See Invisibility** on the observer
- **Line of sight** and **line of effect** when space and placements exist
- **Battlefield perception** at the target cell via `resolveViewerPerceptionForCellFromState` (`perception.resolve.ts`)

Attack rolls use **`resolveCombatantPairVisibilityForAttackRoll`** → roll modifiers (unseen attacker / unseen target). Targeting uses **`canSeeForTargeting`** (same underlying seam).

### Render projection

**`perception.render.projection.ts`** maps domain perception types into **presentation-only** structures (`EncounterGridCellRenderState`, occupant token visibility, fill kinds). Combat rules live in `perception.resolve.ts`. **Cell tint** (`perceptionBaseFillKind` / `VisibilityFillKind`) comes only from **`resolvePresentationVisibilityFill`** in `visibility.presentation.ts` — merged world → (optional) `inferObscurationPresentationCausesWhenMissing` → contributors → `resolveCellVisibility` → `mapResolvedVisibilityToFillKind`. See the module JSDoc on `visibility.presentation.ts` and `visibility.presentation.compatibility.ts`.

**Grid occupant tokens (active viewer):** `selectGridViewModel` (when `GridPerceptionInput` is passed) sets **`viewerOccupantPresentationKind`** and **`viewerPerceivesOccupantToken`** per occupied cell via **`deriveViewerCombatantPresentationKind`** / **`shouldRenderOccupantTokenForEncounterViewer`** ([`rendering/grid-occupant-render-visibility.ts`](../../src/features/mechanics/domain/combat/space/rendering/grid-occupant-render-visibility.ts)). Presentation kinds are **`visible`** | **`out-of-sight`** | **`hidden`**. **Precedence (presentation only):** DM / self → **`visible`**; else **`isHiddenFromObserver`** → **`hidden`** (so successful Hide surfaces in UI even when pair perception would also fail); else **`!canPerceiveTargetOccupantForCombat`** → **`out-of-sight`**; else **`visible`**. Mechanics (`canPerceiveTargetOccupantForCombat`, stealth reconciliation) are unchanged. Under **strict POV**, **`viewerPerceivesOccupantToken`** is true only for **`visible`** (both **`hidden`** and **`out-of-sight`** suppress the normal token). Cell-level **`occupantTokenVisibility`** (blind veil, darkness, etc.) is still applied in **`EncounterGrid`** after the pair presentation. **Guessed-position** is not implemented; the type can be extended later without changing rule engines.

**Bookkeeping UI (initiative sidebar, turn order modal, next-actor header):** **`buildCombatantViewerPresentationKindById`** uses the same inputs as the grid. Non-grid surfaces **keep** rows in initiative and show **Out of sight** vs **Hidden** chips (and header badges for the next combatant) instead of a single generic “Unseen” label. **DM simulator mode** keeps **`visible`** for all combatants.

### Encounter UI: presentation modes

**What “works” in the encounter UI depends on which presentation layers are active** — this is not a second rules engine; it is how much surface area is shown.

| Layer | Effect |
|--------|--------|
| **Grid viewer + strict POV** | Under **strict** point-of-view, a **normal** occupant token is drawn only when pair presentation is **`visible`**. **`hidden`** and **`out-of-sight`** both **suppress** that token (strict POV does not draw a token for “I know they’re hidden” vs “I can’t see them” — both are non-visible tokens on the grid). Chips/labels elsewhere can still distinguish **Hidden** vs **Out of sight**. DM / self-view / non-strict paths behave as implemented in [`rendering/grid-occupant-render-visibility.ts`](../../src/features/mechanics/domain/combat/space/rendering/grid-occupant-render-visibility.ts). |
| **Combat log: Compact / Normal / Debug** | **`toCombatLogEntry`** assigns each event an **importance** (**`headline`**, **`supporting`**, **`debug`**). **`filterLogByMode`** keeps only certain importances per mode: **Compact** ≈ headlines only; **Normal** headlines + supporting; **Debug** all. Stealth **prune/reveal** uses **`stealth-reveal`** (**supporting**) so the readable **`summary`** appears in **Normal** and **Debug**; structured **`debugDetails`** (e.g. perception trace) appears **only** in **Debug**. Older stealth diagnostics remain **`note`** (**debug** importance) and show only in **Debug**. Implementation: **`combat-log-bridge.ts`**, **`CombatLogPanel`**. |

For stealth bookkeeping vs perception pruning, see [Stealth reference facts](./stealth.md#stealth-reference-facts).

---

## Key distinctions

### Cell visible vs occupant perceivable

`EncounterViewerPerceptionCell` distinguishes **`canPerceiveCell`** (there is a tactical location / outline) from **`canPerceiveOccupants`** (tokens / creatures in that cell). In **heavy obscurement** or some **darkness** cases, the cell may still be “there” for the viewer while **occupants** are not perceivable. Combat that must match “you can see the creature” must use **occupant** perception, not cell outline alone.

### Targeting legality vs attack roll visibility

- **Targeting** (`isValidActionTarget`, `requiresSight` on actions): can you **select** this creature for a sight-required effect? Uses **`canSeeForTargeting`** → `canPerceiveTargetOccupantForCombat`.
- **Attack roll**: after a valid target, **advantage/disadvantage** from unseen attacker/target uses **`resolveCombatantPairVisibilityForAttackRoll`** and `getAttackVisibilityRollModifiersFromPair`. Legality and roll modifiers both ultimately depend on the same occupant seam but serve different steps.

### Blinded condition vs heavy obscurement

- **Blinded** (and similar **cannot-see** consequences): enforced early via **`canSee(observer)`** in `canPerceiveTargetOccupantForCombat` — the observer fails all “see target” checks regardless of grid.
- **Heavy obscurement / darkness / magical darkness**: applied when resolving **per-cell** viewer perception at the **target cell** (after LoS/LoE when the grid exists). A blinded creature does not bypass blindness because a cell is bright; conversely, a sighted creature may fail occupant perception because the target cell is heavily obscured or magically dark.

---

## Shared helpers / seams

| Concern | Entry point | Notes |
|--------|-------------|--------|
| **Attack visibility relation** | `resolveCombatantPairVisibilityForAttackRoll`, `getAttackVisibilityRollModifiersFromPair` | `visibility/combatant-pair-visibility.ts`; feeds `resolveRollModifier` in action resolution. |
| **Can select sight-required target** | `canSeeForTargeting` | Alias of `canPerceiveTargetOccupantForCombat`; used with action targeting profiles. |
| **OA visibility gating** | `canReactorPerceiveDepartingOccupantForOpportunityAttack`, `getOpportunityAttackLegalityDenialReason` | `reactions/opportunity-attack.ts`; sight uses pre-move state and the same occupant seam. |
| **Sight-based check legality** | `getSightBasedCheckLegalityDenialReason`, `getEncounterAbilityCheckSightDenialReason` | `stealth/sight-hide-rules.ts` / `encounter-ability-check-resolution.ts`; check effects with `requiresSight` gate in `applyActionEffects`. Denial id: **`cannot-perceive-subject`**. |

Hide **attempt** eligibility (not a full Stealth contest) is in **`getHideAttemptEligibilityDenialReason`** (`stealth/sight-hide-rules.ts`): occupant seam plus merged **world** hide support at the hider’s cell — **concealment** (lighting/obscurement/magical darkness) **and/or** baseline **terrain cover** (three-quarters or full on `terrainCover`; half does not count unless a **`hideEligibility`** flag opts in). **Stealth sustain** after movement/zones uses the **same** **`cellWorldSupportsHideAttemptWorldBasis`** check with **`resolveHideEligibilityForCombatant`**, which layers persisted stealth, optional call-site overrides, and **`getCombatantHideEligibilityExtensionOptions`** from **`stats.skillRuntime.hideEligibilityFeatureFlags`**. See [Stealth — Hide attempt eligibility](./stealth.md#hide-attempt-eligibility).

### Stealth / hidden runtime (layer on top)

**Hidden state** is **not** the same as “not currently visible”: perception answers sight; **`CombatantInstance.stealth`** (`CombatantStealthRuntime` wrapper) stores **who the subject is hidden from**. Rules and mutations are centralized in **`stealth/stealth-rules.ts`**; reconciliation helpers keep hidden-from lists aligned when perception or concealment changes. See [Stealth and hidden state](./stealth.md).

**Attack rolls and targeting** still use **`resolveCombatantPairVisibilityForAttackRoll`** / **`canSeeForTargeting`** only — they do **not** read `hiddenFromObserverIds`. That avoids a second visibility engine and double-stacked advantage: when heavy obscurement (or similar) already makes a defender unable to perceive the attacker’s occupant, unseen-attacker advantage applies through the shared seam; **`breakStealthOnAttack`** clears stealth **after** the attack d20 is rolled. Details: **`stealth/stealth-attack-integration.ts`**, [Stealth — combat section](./stealth.md#combat-attacks-targeting-and-hidden-state).

### Guessed position / sound awareness (not sight)

**`CombatantInstance.awareness`** (`CombatantAwarenessRuntime`) holds **observer-relative** **`guessedCellByObserverId`** — a last attributed **grid cell** for observers who **do not** currently **`canPerceiveTargetOccupantForCombat`** the subject’s occupant. Rules live in **`awareness/awareness-rules.ts`**.

- **Does not** satisfy **`canSeeForTargeting`** or requires-sight checks.
- **Creature targeting** (`isValidActionTarget` in **`action-targeting.ts`**): for actions **without** **`requiresSight`**, a valid target needs **visible occupant** **or** (by default) a **guessed cell** — not **fully unknown**. **`requiresSight: true`** still uses only the visibility seam.
- **Coexists** with **`stealth`**: a subject can be **hidden** from an observer and still have a guessed cell for that observer.
- **Clears** when the observer **can** perceive the occupant (**`reconcileAwarenessGuessesWithPerception`**, also run at the end of **`reconcileStealthHiddenForPerceivedObservers`**).
- **Noise entry point:** **`applyNoiseAwarenessForSubject`** (e.g. after an attack resolves — see **`action-resolver.ts`**).

Full detail: [Awareness and guessed position](./awareness-and-guessed-position.md).

---

## Current rules supported

- **Blinded** — `canSee` / condition consequences block perception before grid-specific checks.
- **Invisibility / See Invisibility** — invisible target not perceived unless observer has See Invisibility state (`visibility/combatant-pair-visibility.ts`).
- **LOS / LoE** — `lineOfSightClear`, `lineOfEffectClear` (`visibility/visibility-los.ts`); binary geometry when space + placements exist.
- **Heavy obscurement** — merged world + `resolveViewerPerceptionForCell` → `canPerceiveOccupants` false when appropriate.
- **Darkness / magical darkness** — lighting and magical flags in world merge; perception resolution applies viewer **capabilities** (darkvision, Devil’s Sight, truesight, bypass flags) per `EncounterViewerPerceptionCapabilities`.

---

## Current fallbacks / assumptions

### Missing tactical data behavior

If **`space`** or **`placements`** is missing, or the target has **no resolved cell**, or battlefield perception **returns null**, **`canPerceiveTargetOccupantForCombat`** treats **occupant** visibility as **permissive (true)** after condition, invisibility, and LoS/LoE gates that still apply. This avoids over-blocking encounters without a full grid; **blinded** and **invisible** still block first.

### DM / debug viewer behavior

Perception resolution accepts **`viewerRole: 'dm' | 'pc'`** (e.g. `ResolveViewerPerceptionForCellParams`). When **`dm`**, perception is **not** restricted (tactical omniscience for that view). PC-facing rules use **`pc`** (combat resolution uses `viewerRole: 'pc'` in the shared seam).

### No full senses engine yet

**`EncounterViewerPerceptionCapabilities`** is optional and partially threaded (e.g. `ResolveCombatActionOptions.perceptionCapabilities` for check effects). Flags include darkvision range, blindsight, truesight, Devil’s Sight, magical darkness bypass. There is **not** a complete per-sense pipeline or automatic derivation from every stat and item. **Guessed-cell** awareness ([Awareness and guessed position](./awareness-and-guessed-position.md)) is a separate, lightweight seam — not a replacement for hearing range or sound propagation.

---

## Known limitations

- **Active opposed Stealth vs rolled Perception** — hide vs **passive** Perception is implemented; active opposed rolls are still TODO (see [stealth.md](./stealth.md)).
- **No observer aggregation API** — “who can see this creature” as a derived set is not a first-class helper yet (hidden-from is stored per subject).
- **Limited capability threading** — capabilities must be passed where supported; not every call site accepts or forwards them yet.

---

## Future work

- **Stealth contests** — opposed rolls and passive Perception feeding **`applyStealthHideSuccess`**.
- **Observer sets** — aggregate helpers for “all enemies that can see you” style rules.
- **Sense-specific bypasses** — consistent threading of blindsight, tremorsense, truesight, and table-specific rulings through all seams.
- **Rogue-in-shadows / feature hooks** — light obscurement only counts if the observer is in bright light (and similar feature-level rules), once base stealth and observers exist.

For how this ties into action resolution and check effects, see [Combat action resolution](./resolution.md) (LOS/visibility seams, OA, sight-based checks).
