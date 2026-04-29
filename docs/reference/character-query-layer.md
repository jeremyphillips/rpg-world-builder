# Character query layer

This document describes **read-only character projections** used across the app: **what** belongs in the **query** layer, how it relates to the sibling **derived** layer, and how new features should adopt them without duplicating ad-hoc reads from raw `Character` or API payloads.

**Terminology:** The query layer **derives** `CharacterQueryContext` from persistence in the narrow sense (normalization into id sets and slots). The code path **`CharacterDerivedContext`** ([`domain/derived/`](../../src/features/character/domain/derived/)) is for **catalog-interpreted** effective facts (e.g. class-granted weapon/armor/tool proficiencies). Those concerns are **not** folded into `CharacterQueryContext`—see [Character derived layer](#character-derived-layer-characterderivedcontext).

---

## Purpose

The character query layer answers: *“Given this character (or several), what normalized facts do features need for lists, filters, badges, and eligibility without re-parsing equipment blobs everywhere?”*

It centralizes **one build path** from authoritative character state (`Character` / DTO → `CharacterQueryContext`) and **thin selectors** for common questions (owns item, knows spell, can afford, equipped, etc.). Questions that require **class definitions**, **equipment categories**, or merged **`classesById`** use [`buildCharacterDerivedContext`](../../src/features/character/domain/derived/buildCharacterDerivedContext.ts) instead—see below.

---

## Why this layer exists

Without it, features drift in parallel:

- Multiple hooks or components each call `GET /api/characters/:id` and interpret `equipment`, `spells`, and `proficiencies` differently.
- “Owned” vs “equipped” vs “known” get mixed up.
- **List membership** (content id in inventory) is reimplemented per screen.
- **Multi-character** viewers (several PCs) union inventory in inconsistent ways.

The query layer **does not** duplicate persistence; it **derives** a stable, testable snapshot for UI and gating.

---

## What drift / problems it solves

| Problem | How the layer helps |
|--------|---------------------|
| Duplicated fetch + merge logic | `useViewerCharacterQuery` (or successors) fetches once per character; `mergeCharacterQueryContexts` defines union semantics. |
| Inconsistent “owned” sets | `CharacterQueryContext.inventory.*` and `spells.knownSpellIds` / `proficiencies.skillIds` are the single shapes. |
| Confusing equipped vs owned | Inventory ids vs `combat` loadout slots are both on the same context; selectors document intent. |
| Future DM “by character” filter | Same `CharacterQueryContext` per id; no separate ownership model. |

---

## What it is not

### Not the source of truth for editing

Authoritative state lives in **character documents**, builder state, and APIs. The query context is a **read-only projection** for display and derived checks. Mutations go through existing services and mutations—not through `CharacterQueryContext`.

### Not the mechanics engine

[`buildCharacterContext`](../../src/features/character/domain/engine/buildCharacterContext.ts) (engine / `EvaluationContext`) is for **rules evaluation**. The query layer is for **UI and list semantics** (ids, sets, totals, simple booleans). They may share inputs (`Character`) but serve different purposes.

### Not a permissions / access system

Campaign visibility, DM vs PC, and `ViewerContext` / capabilities live in **`shared/domain/capabilities`** and AppDataGrid visibility. The query layer does **not** decide whether a user may **see** a row; it only describes **what a character owns or knows** for filters and adornments once data is already loaded.

---

## Core pieces

### `CharacterQueryContext`

Typed snapshot: identity, progression, **inventory** (id sets by category), **proficiencies** (**persisted skill ids only**—see derived layer for weapon/armor/tool proficiency), **spells**, **economy** (e.g. wealth totals), **combat** (equipped slot ids). Defined in [`characterQueryContext.types.ts`](../../src/features/character/domain/query/characterQueryContext.types.ts).

### `buildCharacterQueryContext`

Maps a **mechanics `Character`** (typically via `toCharacterForEngine` from a detail DTO) into [`CharacterQueryContext`](../../src/features/character/domain/query/buildCharacterQueryContext.ts). This is the single normalization boundary for “what’s on the sheet.”

### `buildCharacterQueryContextFromDetailDto`

Thin adapter: [`CharacterDetailDto`](../../src/features/character/read-model/character-read.types.ts) → `toCharacterForEngine` → `buildCharacterQueryContext`. Use wherever several call sites would otherwise repeat that chain for membership / id-set questions (e.g. character sheet, level-up, encounter combatant snapshot, [`useViewerCharacterQuery`](../../src/features/campaign/hooks/useViewerCharacterQuery.ts)). It does **not** add new membership semantics—only centralizes the conversion.

### Merge behavior

[`mergeCharacterQueryContexts`](../../src/features/character/domain/query/mergeCharacterQueryContexts.ts) unions multiple contexts (e.g. all viewer PCs): inventory sets union, class levels max per class, etc. **Merged** is a **convenience** for “everything my characters own,” not the only valid mode—see **Scope model**.

### Selector groups

Pure functions under [`src/features/character/domain/query/selectors/`](../../src/features/character/domain/query/selectors/) — inventory, spells, proficiency (skills), economy, combat, progression. They take `CharacterQueryContext` (or a slice) and answer one question each.

### Character derived layer (`CharacterDerivedContext`)

Sheet- and display-oriented read model for **resolved** facts that need interpretation beyond persisted id sets: **class-granted** weapon, armor, and tool proficiencies (category + explicit item grants), merged into **effective** [`EquipmentProficiency`](../../packages/mechanics/src/proficiencies/proficiency-adapters.ts) shapes and tool id sets.

| Piece | Location |
|-------|----------|
| Types + builder | [`characterDerived.types.ts`](../../src/features/character/domain/derived/characterDerived.types.ts), [`buildCharacterDerivedContext.ts`](../../src/features/character/domain/derived/buildCharacterDerivedContext.ts) |
| Grant helpers | [`domain/derived/grants/`](../../src/features/character/domain/derived/grants/) (catalog-aware class resolution: merged `classesById` first, then system class) |
| Selectors | [`domain/derived/selectors/`](../../src/features/character/domain/derived/selectors/) — `hasEffectiveWeaponProficiency`, `hasEffectiveArmorProficiency`, `hasEffectiveToolProficiency` |

**Inputs:** `CharacterQuerySource`, `CharacterQueryContext`, and optionally `catalogs.classesById` + `rulesetId`. Pass **campaign-merged** `classesById` when available so homebrew classes participate; otherwise resolution falls back to system classes only.

**Not in scope for the current derived phase:** AC, loadout option rows, per-weapon attack math, encounter combatant stats—those stay on [`useCombatStats`](../../src/features/character/hooks/useCombatStats.ts) / engine paths. **Gap:** class **subclass feature** `Effect` grants may add proficiencies not yet merged into `CharacterDerivedContext` (see drift table).

There is no dedicated viewer hook for derived context yet; build it at the call site next to `Character` + `query` + catalog when needed.

---

## Scope model

Features should be explicit about **which** context they use:

| Scope | Meaning | Typical use |
|-------|---------|-------------|
| **Single character** | One `CharacterQueryContext` for one `characterId` | Active PC, sheet, DM “owned by this character” |
| **Merged viewer characters** | `mergeCharacterQueryContexts` over the viewer’s campaign characters | Union of ownership (“anything my PCs own”) when product allows |
| **Selected character / target** | Same as single-character, but `characterId` is chosen by filter or URL | Future DM **owned-by-character** filter |

The hook layer should expose **`contextsById`** and optional **`mergedContext`** so callers do not bake “always merged” as the only API.

**Merged scope + derived (future):** `mergeCharacterQueryContexts` defines union semantics for **query** slices only. Union or merge rules for **`CharacterDerivedContext`** across multiple PCs (e.g. “would any of my characters be proficient?”) are **undefined** until product needs them—prefer **per-character** derived builds for now.

### Viewer ownership scope (campaign content lists)

When a user has **more than one** viewer character, equipment/spell/skill list routes use **`useCampaignViewerOwnedCharacterQuery`**, which wires **`useViewerOwnedCharacterQueryPreference`** (per-campaign localStorage: merged union vs one `characterId`) into **`useViewerCharacterQuery`**. The page header includes an **Owned as** control: **All my characters** or a specific PC by name. With **one** viewer PC, the control is hidden and that character is always used.

---

## Readiness model

### `loading` vs `ready`

- **`loading`**: network / fetch in progress.
- **`ready`**: safe to treat **query** (and any **derived** context you build from that data) as **authoritative for this request** (e.g. fetches finished for the current `viewerCharacterIds` set).

### Why empty context must not mean “owns nothing” before load

If the viewer has characters but results are not loaded yet, **`mergeCharacterQueryContexts([])`** behaves like an **empty** context (no ids). Consumers must **not** pass that to Owned filters or icons as if it were real. Gate on **`ready`** (or equivalent) before wiring `ownedIds` from the query layer.

---

## What belongs in the base context

**Normalized facts** suitable for many consumers:

- **Sets of ids** — weapons, armor, gear, magic items, **persisted** skill proficiency ids, known spells. (**Weapon / armor / tool** proficiency *grants* from class definitions belong in **`CharacterDerivedContext`**, not as extra sets on `CharacterQueryContext`.)
- **Progression** — levels, class ids, XP flags.
- **Economy** — e.g. total wealth in cp for consistent comparisons.
- **Combat** — equipped slot ids (resolved from loadout + equipment), not ad hoc parsing in each feature.

Keep the **shape stable**; add fields deliberately when multiple features need them.

---

## What belongs in selectors

**Query selectors:** questions built on **`CharacterQueryContext`** only—**not** duplicated fields unless necessary:

- **Ownership** — `ownsItem`, `getOwnedIdsForContentType` (inventory).
- **Affordability** — `canAffordCostCp` (economy + cost).
- **Skills (persisted)** — `isProficientInSkill` (membership in `proficiencies.skillIds`).
- **Equipped state** — `isEquipped`, `getEquippedWeaponIds` (combat vs inventory).
- **Later** — spell availability vs “known only,” level gates, class prerequisites—keep as selectors + small helpers rather than bloating the context.

**Derived selectors** ([`domain/derived/selectors/`](../../src/features/character/domain/derived/selectors/)): **effective** weapon/armor/tool capability. They are **catalog-aware**: pass `{ id, category }` for weapons and armor (not id alone) so category grants (`simple`, `martial`, `allArmor`, etc.) work; tool checks use **tool id** only.

---

## Current consumers

| Area | Role |
|------|------|
| **Content lists** | PC-only **Owned** filter + name icon via [`ownedMembershipFilter`](../../src/features/content/shared/domain/ownedMembershipFilter.ts) / [`contentListTemplate`](../../src/features/content/shared/components/contentListTemplate.tsx); `ownedIds` from the appropriate `CharacterQueryContext` slice. |
| **Future DM filter** | Pick `characterId` → use **`contextsById.get(characterId)`** (or fetch single) for membership—same model as PC. |
| **Snapshots** | Any read-only “what does this character have?” summary can use the same builder + selectors. |
| **Builder / loadout / affordability** | Should prefer `CharacterQueryContext` + selectors over re-reading raw equipment shapes where the same question is asked. |
| **Content delete/disable validators** | Party reference checks (`validateWeaponChange`, armor/gear/magic item, spell, skill proficiency, class, race) use `buildCharacterQueryContext` + selectors so “in use” matches **inventory / membership** semantics. **Proficiency** gating (e.g. “can use this weapon”) is **not** what those validators do; use **derived** selectors when product requires it. |

---

## Rollout guidance

### How new features should adopt it

1. Prefer **`buildCharacterQueryContext`** after you already have a `Character` (or DTO → `toCharacterForEngine`).
2. For **effective weapon/armor/tool proficiency** (class grants + categories), use **`buildCharacterDerivedContext`** with merged **`classesById`** when you have campaign catalog data.
3. Add **query** or **derived** **selectors** instead of inlining raw equipment / class reads in components.
4. For **campaign viewer** data, use **`useViewerCharacterQuery`** (or its refined successor) and respect **`ready`** + **scope** (single vs merged).

### What legacy direct character reads to avoid

- **Avoid** new parallel `GET /api/characters/:id` loops that only pull `equipment` for one concern—extend the shared hook or pass `CharacterQueryContext` down.
- **Avoid** interpreting raw `Character.equipment` in multiple UI layers when the same membership check exists in selectors.
- **Avoid** treating **pre-fetch empty** merged context as “owns nothing” for filters or icons.

---

## Related code

| Piece | Location |
|-------|----------|
| Types + builder + merge | [`src/features/character/domain/query/`](../../src/features/character/domain/query/) |
| Derived context (proficiencies, Phase 1A+) | [`src/features/character/domain/derived/`](../../src/features/character/domain/derived/) |
| Viewer hook | [`useViewerCharacterQuery.ts`](../../src/features/campaign/hooks/useViewerCharacterQuery.ts) |
| List route scope + preference | [`useCampaignViewerOwnedCharacterQuery.ts`](../../src/features/content/shared/hooks/useCampaignViewerOwnedCharacterQuery.ts), [`useViewerOwnedCharacterQueryPreference.ts`](../../src/app/providers/useViewerOwnedCharacterQueryPreference.ts) |
| DTO → engine character | [`toCharacterForEngine`](../../src/features/character/read-model/character-read.mappers.ts) |
| DTO → query context (adapter) | [`buildCharacterQueryContextFromDetailDto`](../../src/features/character/domain/query/buildCharacterQueryContextFromDetailDto.ts) |

For campaign content list composition (toolbar, filters), see [appdatagrid.md](./appdatagrid.md) and [forms.md](./forms.md).

---

## Remaining drift / cleanup later

This section is a **living checklist** of areas that intentionally still bypass the query layer or deserve follow-up. It is **not** a commitment to finish everything immediately—refresh when items close.

| Area | Status | Notes |
|------|--------|--------|
| **Mechanics engine** | Intentionally out of scope | [`useCombatStats`](../../src/features/character/hooks/useCombatStats.ts), loadout resolution, [`buildCharacterContext`](../../src/features/character/domain/engine/buildCharacterContext.ts) / `EvaluationContext` keep reading raw `Character` and equipment for **rules evaluation**—see [What it is not](#what-it-is-not). Do not route AC/HP/initiative math through `CharacterQueryContext`. |
| **Character builder local state** | Intentionally out of scope | [`CharacterBuilderState`](../../src/features/characterBuilder/) step visibility and partial equipment checks are not full `Character` documents; adopting the query layer here needs a deliberate mapper/design, not an incremental copy-paste. |
| **Class / race delete validators** | Aligned (when applicable) | [`validateClassChange`](../../src/features/content/classes/domain/validation/validateClassChange.ts) uses [`hasClass`](../../src/features/character/domain/query/selectors/progression.selectors.ts); [`validateRaceChange`](../../src/features/content/races/domain/validation/validateRaceChange.ts) compares `identity.raceId`. If API payloads ever diverge from `CharacterQuerySource`, document the gap here. |
| **Encounter combatants** | Aligned for gear + skill membership | [`buildCharacterCombatantInstance`](../../src/features/encounter/helpers/combatants/combatant-builders.ts) builds one `CharacterQueryContext` from the detail DTO for `gearIds` and perception/stealth proficiency levels; combat math and `useCombatStats` are unchanged. |
| **Skill proficiency depth (expertise)** | Watch | Detail DTO / query layer may not represent skill **expertise** (e.g. level 2) until the API carries it; encounter code may treat skills as proficient-or-not only. |
| **Equipment proficiency elsewhere** | Partial overlap | [`EquipmentStep`](../../src/features/characterBuilder/steps/EquipmentStep/EquipmentStep.tsx) uses [`collectIntrinsicEffects`](../../src/features/character/domain/engine/collectCharacterEffects.ts) + [`deriveEquipmentProficiency`](../../packages/mechanics/src/proficiencies/proficiency-adapters.ts) for gating; **`CharacterDerivedContext`** uses catalog-aware **class table** grants and may **not** yet include every subclass **Effect** grant—align over time if drift shows up. |
| **Combatant tool grants** | System-oriented helper today | [`collectGrantedToolProficienciesFromClassLevels`](../../packages/mechanics/src/rulesets/system/toolProficiencies.ts) in combatant build is system-class keyed; **derived** tool grants prefer **`classesById`**—future work may unify combatant snapshots with the same catalog-aware path. |
| **Payload-shape gaps** | Watch | If a future endpoint returns a partial character shape that cannot satisfy `buildCharacterQueryContext`, record the endpoint and fields here and add a narrow mapper or wait for API alignment. |
