# Emanation and attached battlefield effects

This document is the **navigation hub** for how **emanations** and **persistent battlefield sphere effects** work across spells, monster special actions, and monster traits in encounter combat.

- **Field-level authoring rules** for the `emanation` effect kind: [effects.md § `emanation`](../reference/effects.md#emanation)
- **Monster trait patterns** (pairing `emanation` with `interval`, save DC, triggers): [monster-authoring.md § Traits: emanations and attached battlefield](../reference/monster-authoring.md#traits-emanations-and-attached-battlefield)
- **Turn/movement resolution** (intervals, spatial entry, speed): [resolution.md](../reference/resolution.md) (attached-aura notes; see §4.4 and tactical bullets around attached auras)

## 1. Purpose and scope

In this codebase, “emanation” refers to a chain of concepts:

1. **Authored content:** a root effect with **`kind: 'emanation'`** (`EmanationEffect` in [`effects.types.ts`](../../src/features/mechanics/domain/effects/effects.types.ts)).
2. **Combat adapter output:** optional **`CombatActionDefinition.attachedEmanation`** built by the spell or monster combat adapter (radius, `selectUnaffectedAtCast`, **`anchorMode`**, and a **`AttachedBattlefieldEffectSource`** identity).
3. **Runtime state:** **`BattlefieldEffectInstance`** rows on **`EncounterState.attachedAuraInstances`**, keyed by caster + source, with a spatial **`BattlefieldEffectAnchor`** and shared interval/overlap/speed resolution.

**Source vs caster vs anchor**

| Concept | Role |
| --- | --- |
| **`AttachedBattlefieldEffectSource`** | Which authored rules package the effect comes from (`spell` / `monster-action` / `monster-trait`). |
| **`casterCombatantId`** | Combatant who cast/owns the row (concentration for spells, synthetic “actor” for `applyActionEffects`, same-side suppression where used). |
| **`BattlefieldEffectAnchor`** | Where the sphere is centered on the grid. **`kind`:** **`place`** (fixed cell), **`object`** (obstacle id + snapshot cell), **`creature`** (combatant id — caster, explicit target, or trait host). Authored **`EmanationEffect.anchorMode`** (optional, defaults to **`caster`**) is copied to **`attachedEmanation.anchorMode`** and drives cast-time selection + resolver mapping. |

## 2. Authored content shape

Author **`EmanationEffect`** with:

- **`attachedTo: 'self'`** — required by the type; adapters only promote to **`attachedEmanation`** when this is satisfied and the area is a sphere. (The type name is legacy; semantic anchor is **`anchorMode`**, not “self-only.”)
- **`area: { kind: 'sphere', size: <feet> }`**
- **`anchorMode`** (optional) — **`caster`** \| **`place`** \| **`creature`** \| **`object`**. Omitted → adapters treat as **`caster`** (sphere follows the casting combatant).
- **`selectUnaffectedAtCast`** (optional) — omit or **`false`** unless the rules match Spirit Guardians–style “creatures that **ignore** this harmful aura.” Adapters default omitted to **`false`**. See [effects.md](../reference/effects.md#emanation).

**Adapter gate**

- Spells: **`deriveAttachedEmanation`** in [`spell-combat-adapter.ts`](../../src/features/encounter/helpers/spell-combat-adapter.ts)
- Monster special actions: **`deriveMonsterAttachedEmanation`** in [`monster-combat-adapter.ts`](../../src/features/encounter/helpers/monster-combat-adapter.ts)

If **`attachedTo !== 'self'`** or the area is not a sphere, **`attachedEmanation`** is omitted (no persistent attached row from that path).

Pair **`emanation`** with a **`targeting`** effect whose **`area`** matches the sphere for consistent templates and audits (see [effects.md](../reference/effects.md#emanation)).

## 3. Source identity (`AttachedBattlefieldEffectSource`)

Defined in [`attached-battlefield-source.ts`](../../src/features/mechanics/domain/encounter/state/auras/attached-battlefield-source.ts):

| `kind` | Payload | Typical use |
| --- | --- | --- |
| `spell` | `spellId` | PC/NPC casts a spell with `emanation` |
| `monster-action` | `monsterId`, `actionId` | Special action whose effects include `emanation` |
| `monster-trait` | `monsterId`, `traitIndex` | Trait-sourced persistent aura |

**Stable instance ids:** **`attachedAuraInstanceId(source, actorId)`** — unique per source + casting combatant.

**Spell concentration:** **`concentrationLinkedMarkerIdForSpellAttachedEmanation(spellId)`** links concentration cleanup to the attached row; dropping concentration calls **`removeAttachedAurasForSpell`** ([`concentration-mutations.ts`](../../src/features/mechanics/domain/encounter/state/effects/concentration-mutations.ts)).

## 4. Spells

- **Adapter:** [`buildSpellCombatActions`](../../src/features/encounter/helpers/spell-combat-adapter.ts) attaches **`attachedEmanation`** when **`deriveAttachedEmanation`** succeeds. Root **`targeting`** plus **`deriveSpellHostility`** determine whether combat targeting is **`self`** (non-hostile auras) vs **`all-enemies`** (hostile emanations); see **`buildSpellTargeting`** and [`spell-hostility.ts`](../../src/features/encounter/helpers/spell-hostility.ts).
- **Resolvable effects:** `targeting` and `emanation` are stripped from immediate resolution; **`interval`** / **`modifier`** may be deferred for specific spells (e.g. Spirit Guardians) while the grid aura is active.
- **Resolve:** [`resolveCombatAction`](../../src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts) calls **`addAttachedAuraInstance`** with an **`anchor`** derived from **`attachedEmanation.anchorMode`** and [`ResolveCombatActionSelection`](../../src/features/mechanics/domain/encounter/resolution/action-resolution.types.ts): **`place`** ← **`aoeOriginCellId`**; **`creature`** ← **`targetId`**; **`object`** ← **`objectId`** (+ obstacle lookup / snapshot cell); **`caster`** (default) ← **`{ kind: 'creature', combatantId: selection.actorId }`**. **`unaffectedCombatantIds`** and optional **`saveDc`** are passed through as today.
- **Concentration:** spell-sourced rows are removed when concentration on that spell ends (same file family as `removeAttachedAurasForSpell`).

## 5. Monster special actions

- Only **`MonsterSpecialAction`** builds that include **`emanation`** get **`deriveMonsterAttachedEmanation`** ([`monster-combat-adapter.ts`](../../src/features/encounter/helpers/monster-combat-adapter.ts)). Weapon and natural attack branches do not.
- **`source`** is **`{ kind: 'monster-action', monsterId, actionId }`** with **`actionId`** from the runtime action id for that special action.
- **`monsterSpecialResolvableEffects`** removes **`interval`** and **`modifier`** from immediate resolution when an emanation is present (aligned with spell behavior: grid handles overlap).

## 6. Monster traits

- **Builders:** [`buildAttachedAuraInstancesFromMonsterTraits`](../../src/features/mechanics/domain/encounter/runtime/monster-runtime.ts) / **`collectMonsterTraitAttachedAuras`** scan traits for **`emanation`** + trigger gating (same context rules as other trait effects).
- **Source:** **`{ kind: 'monster-trait', monsterId, traitIndex }`**.
- **Anchor:** creature on the monster combatant (**`combatantInstanceId`**).
- **When instances appear:** merged in **`mergeCombatantsIntoEncounter`** when **`monstersById`** and **`monsterRuntimeContext`** are provided ([`runtime.ts`](../../src/features/mechanics/domain/encounter/state/runtime.ts)). Save DC for the row can come from **`resolveTraitSaveDcFromEffects`**.

## 7. Runtime resolution and grid (shared)

All sources share the same pipeline once **`BattlefieldEffectInstance`** exists.

| Concern | Primary modules |
| --- | --- |
| Origin cell | [`resolveBattlefieldEffectOriginCellId`](../../src/features/mechanics/domain/encounter/state/battlefield/battlefield-effect-anchor.ts) |
| Turn-boundary intervals | [`battlefield-interval-resolution.ts`](../../src/features/mechanics/domain/encounter/state/battlefield/battlefield-interval-resolution.ts) |
| Movement entry (`spatialTriggers: ['enter']`) | [`battlefield-spatial-entry-resolution.ts`](../../src/features/mechanics/domain/encounter/state/battlefield/battlefield-spatial-entry-resolution.ts) |
| Spatial speed multipliers | [`battlefield-spatial-movement-modifiers.ts`](../../src/features/mechanics/domain/encounter/state/battlefield/battlefield-spatial-movement-modifiers.ts) |
| Shared helpers (sphere check, synthetic actions, DC injection) | [`battlefield-attached-aura-shared.ts`](../../src/features/mechanics/domain/encounter/state/auras/battlefield-attached-aura-shared.ts) |
| Loading spell/trait effects by source | [`battlefield-attached-source-effects.ts`](../../src/features/mechanics/domain/encounter/state/auras/battlefield-attached-source-effects.ts) |

## 8. Encounter UI (high level)

- **Selection:** Readiness and resolve wiring live in [`action-resolution-requirements.ts`](../../src/features/mechanics/domain/encounter/resolution/action/action-resolution-requirements.ts) and encounter runtime context.
  - **`anchorMode === 'place'`** — uses the shared **AoE origin** flow (**`aoe-place`**): user confirms a grid point; **`aoeOriginCellId`** is required to resolve. Same pipeline as other area templates on the action, not [`SingleCellPlacementPanel`](../../src/features/encounter/components/active/drawers/drawer-modes/SingleCellPlacementPanel.tsx) (that panel is for spawn / single-cell requirements from **`getActionRequirements`**).
  - **`anchorMode === 'object'`** — grid **object-anchor** selection; **`objectId`** on the resolve payload.
  - **`anchorMode === 'creature'`** — standard combatant target selection (**`targetId`**).
  - **`anchorMode === 'caster'`** (default) — anchor follows the caster; no separate anchor pick beyond normal hostile/target rules.
  - **`AttachedEmanationSetupPanel`** (unaffected creatures) when **`selectUnaffectedAtCast`** is true — typically **caster**-anchored harmful auras (e.g. Spirit Guardians). **Place**-anchored spells usually omit this (`false`); if both **place** and **`selectUnaffectedAtCast`** were ever authored, the drawer can show unaffected setup **alongside** AoE placement ([`CombatantActionDrawer.tsx`](../../src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx)).
- **Grid:** Active instances are resolved to **`originCellId` + radius** in [`EncounterRuntimeContext.tsx`](../../src/features/encounter/routes/EncounterRuntimeContext.tsx) via **`resolveBattlefieldEffectOriginCellId`**, then passed into [`selectGridViewModel`](../../src/features/encounter/space/space.selectors.ts) as **`persistentAttachedAuras`**; cell styling uses **`persistentAttachedAura`** via [`cellVisualState.ts`](../../src/features/encounter/components/active/grid/cellVisualState.ts).

## 9. End-to-end flow (diagram)

```mermaid
flowchart LR
  authored["Authored emanation effect"]
  attachedDef["CombatActionDefinition.attachedEmanation"]
  resolve["resolveCombatAction / mergeCombatants"]
  instance["BattlefieldEffectInstance"]
  grid["Grid overlay plus interval and spatial modules"]
  authored --> attachedDef
  attachedDef --> resolve
  resolve --> instance
  instance --> grid
```

## 10. Current coverage and high-impact modeling next

**In place today**

- **`attachedEmanation.anchorMode`** on [`CombatActionDefinition`](../../src/features/mechanics/domain/encounter/resolution/combat-action.types.ts) and authored **`EmanationEffect.anchorMode`**.
- Cast-time selection + resolver mapping for **`caster`**, **`place`**, **`creature`**, and **`object`** anchors ([`action-resolver.ts`](../../src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts), [`battlefield-effect-anchor.ts`](../../src/features/mechanics/domain/encounter/state/battlefield/battlefield-effect-anchor.ts)).
- Example **place**-anchored authored spell: **Darkness** (sphere at a point) — validates content → adapter → UI → resolver → runtime → grid for non-caster anchoring ([`darkness-place-anchor.test.ts`](../../src/features/mechanics/domain/encounter/tests/darkness-place-anchor.test.ts)).
- **Single-cell vs AoE** remains a separate concept: [`SingleCellPlacementPanel`](../../src/features/encounter/components/active/drawers/drawer-modes/SingleCellPlacementPanel.tsx) is for **`getActionRequirements`** spawn/single-cell rules ([`action-requirement-model.ts`](../../src/features/mechanics/domain/encounter/resolution/action/action-requirement-model.ts)), not emanation. Point-based emanations use the **AoE origin** path.

**Highest impact before “full” SRD-style emanation support**

| Priority | Modeling | Why it matters |
| --- | --- | --- |
| **1** | **Object anchor lifecycle** — obstacle moves, removal, carried vs fixed object; snapshot vs live cell in [`resolveBattlefieldEffectOriginCellId`](../../src/features/mechanics/domain/encounter/state/battlefield/battlefield-effect-anchor.ts). | Completes the anchor matrix (place/creature/caster already exercised); unlocks “cast on object” spheres without a new pipeline. |
| **2** | **Mobile / re-anchorable zones** — bonus or magic action to move the area (e.g. Moonbeam, Flaming Sphere patterns) on the **same** `BattlefieldEffectInstance`. | Many emanations are not static after cast; same data model should accept anchor updates with explicit action + range rules. |
| **3** | **Zone semantics: obscurement, light, vision** — sphere membership driving heavily obscured, advantage/disadvantage, darkvision limits, light/dispel overlap. | Footprint alone is insufficient for Darkness, fog, and similar; largest *play* gap once anchors work. |
| **4** | **Cast-time beneficiary semantics** — distinguish Spirit Guardians **“unaffected”** from **chosen allies / willing targets** (may need more than `selectUnaffectedAtCast`: a small enum or structured field + UI copy). | Avoids misusing one boolean for different SRD patterns (Pass without Trace, Holy Aura, etc.). |
| **5** | **Deferral cleanup** — stop stripping **`interval`** / **`modifier`** where the shared battlefield modules can apply them ([`battlefield-interval-resolution.ts`](../../src/features/mechanics/domain/encounter/state/battlefield/battlefield-interval-resolution.ts), spatial entry, speed). | Finishes automation for spells already modeled in data (e.g. Spirit Guardians) using existing infrastructure. |

**Polish (non-blocking)**

- Per-spell labels on the grid, pre-cast footprint preview, monster-action duration tied to attached-row removal analogous to concentration.
- Broader **content** pass: spells whose rules still exceed the engine should keep honest **`resolution.caveats`** until the rows above land.

## See also

- [effects.md § `emanation`](../reference/effects.md#emanation) — authoritative effect fields and limitations
- [monster-authoring.md § Traits: emanations](../reference/monster-authoring.md#traits-emanations-and-attached-battlefield)
- [resolution.md](../reference/resolution.md) — attached aura interval, movement entry, spatial speed
- [space.md § Movement](../reference/space.md) — movement budget and spatial presentation
