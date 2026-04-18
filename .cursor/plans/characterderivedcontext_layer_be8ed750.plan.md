---
name: CharacterDerivedContext layer
overview: Audit of how weapon/armor/tool proficiencies, AC, and combat display are derived today, plus a recommendation to add `CharacterDerivedContext` under `src/features/character/domain/derived/` as a sheet-oriented read model that composes `CharacterQueryContext` + catalogs + existing resolution helpers—without moving encounter engine math into the query layer.
todos:
  - id: phase1-types
    content: Add domain/derived types (CharacterDerivedContext, option breakdowns, GrantSource) and buildCharacterDerivedContext args
    status: pending
  - id: phase1-grants
    content: Implement class weapon/armor/tool grant extraction + effective sets + selectors (category-aware)
    status: pending
  - id: phase1-loadout
    content: Implement current AC + per-owned-armor (with current shield) + per-owned-weapon attack rows using resolution helpers
    status: pending
  - id: phase1-wire-tests
    content: Wire 1–2 UI consumers; add unit/golden tests and AC parity test vs computeCombatStatsFromCharacter
    status: pending
isProject: false
---

# CharacterDerivedContext — audit and phased plan

## 1. Audit: weapon proficiencies

**Where stored (persisted)**  
PCs do **not** persist weapon proficiency as a separate field. [`CharacterProficiencies`](src/features/character/domain/types/character.types.ts) only has `skills`. Inventory weapon ids live on `Character.equipment.weapons` and in [`CharacterQueryContext.inventory.weaponIds`](src/features/character/domain/query/buildCharacterQueryContext.ts).

**Class-granted definitions**  
System (and merged campaign) class documents define flat entries under `proficiencies.weapons` (`categories`, `items`) per [`ClassProficiencyWeapon`](src/features/content/classes/domain/types/proficiencies.types.ts). These are read at runtime from `getSystemClass` in [`collectBaseProficiencyEffects`](src/features/character/domain/engine/collectCharacterEffects.ts), which emits `Effect` grants (`grantType: 'proficiency'`, `target: 'weapon'`, `source: class:${classId}`).

**Where checks / derivation happen**  
- **Builder equipment gating:** [`EquipmentStep`](src/features/characterBuilder/steps/EquipmentStep/EquipmentStep.tsx) builds `collectIntrinsicEffects(characterLike)` → [`deriveEquipmentProficiency(effects, 'weapon')`](packages/mechanics/src/proficiencies/proficiency-adapters.ts) → [`evaluateEquipmentEligibility`](packages/mechanics/src/proficiencies/proficiency-adapters.ts) per catalog item.  
- **Validators:** [`validateWeaponChange`](src/features/content/equipment/weapons/domain/validation/validateWeaponChange.ts) only tests **ownership** via `buildCharacterQueryContext` + `ownsItem` — **not** proficiency.  
- **Character sheet attacks:** [`useCombatStats` → `getCharacterAttacks`](src/features/character/hooks/useCombatStats.ts) calls [`resolveWeaponAttackBonus`](packages/mechanics/src/resolution/resolvers/attack-resolver.ts) with **`proficiencyLevel: 1` for every wielded weapon**, so the sheet currently treats all wielded weapons as proficient for attack bonus unless something else overrides (it does not pass per-weapon proficiency today).  
- **Monsters:** separate path in [`monster-combat-adapter`](src/features/encounter/helpers/monsters/monster-combat-adapter.ts) using `monster.mechanics.proficiencies.weapons`.

**Data path summary**  
Raw character → **no** stored weapon prof list; class grants → **effects** (`collectIntrinsicEffects`); eligibility UI → **effects + catalog**; sheet attacks → **EvaluationContext + effects** but **hardcoded proficiency level**.

---

## 2. Audit: armor proficiencies

**Persisted**  
Same as weapons: **no** `proficiencies.armor` on `Character`. Armor ownership is `equipment.armor` / `inventory.armorIds`.

**Class-granted**  
`proficiencies.armor` on class defs → `collectBaseProficiencyEffects` → grant effects with `target: 'armor'`.

**Checks**  
- **EquipmentStep:** `deriveEquipmentProficiency(..., 'armor')` + `evaluateEquipmentEligibility`.  
- **validateArmorChange:** ownership only ([`validateArmorChange`](src/features/content/equipment/armor/domain/validation/validateArmorChange.ts)).  
- **Loadout / AC:** armor proficiency is **not** surfaced as a separate boolean in [`CombatStatsCard`](src/features/character/components/views/CharacterView/sections/CombatStatsCard.tsx); AC comes from engine resolution (below).

**Display**  
No dedicated “armor proficiency” row on the sheet today; loadout picker shows AC options, not proficiency warnings.

---

## 3. Audit: tool proficiencies

**Persisted**  
No first-class `Character.proficiencies.tools`. Gear entries may declare a `proficiency` string (e.g. thieves’ tools) in gear types, but character “known tools” are **not** mirrored in `CharacterQueryContext`.

**Class-granted (today)**  
[`collectGrantedToolProficienciesFromClassLevels`](packages/mechanics/src/rulesets/system/toolProficiencies.ts) reads **fixed** `proficiencies.tools.items` when class level ≥ `tools.level`. Used when building combatants: [`combatant-builders.ts`](src/features/encounter/helpers/combatants/combatant-builders.ts) sets `grantedToolProficiencies`.

**Checks**  
[`resolve-pick-lock-availability`](packages/mechanics/src/combat/availability/resolve-pick-lock-availability.ts) requires thieves’ tools proficiency (from `grantedToolProficiencies` + other combatant fields). This is **encounter/combat** eligibility, not the query layer.

**Relation to lockpicking**  
Yes — tool proficiency gates **Pick Lock** via combatant snapshot, not via `CharacterQueryContext`.

---

## 4. Audit: armor class

**Character sheet**  
[`CombatStatsCard`](src/features/character/components/views/CharacterView/sections/CombatStatsCard.tsx) uses [`useCombatStats`](src/features/character/hooks/useCombatStats.ts) → `resolveStatDetailed('armor_class', ...)` with full effect list (intrinsic + enchantments + **selected** magic item effects).  
[`calculateArmorClass`](src/features/character/domain/combat/calculateArmorClass.ts) is a thin wrapper around [`resolveCharacterStat`](src/features/character/domain/engine/resolveCharacterStat.ts) → `buildCharacterResolutionInput` + `resolveStat` (simpler effect set than `useCombatStats`).

**DTO / stored AC**  
[`toCharacterDetailDto`](src/features/character/read-model/character-read.mappers.ts) exposes `armorClass.current` from the document (defaults10). **Sheet display** uses **calculated** AC from `useCombatStats`, not the stored field, for the main shield value.

**Combatants / encounters**  
[`buildCharacterCombatantInstance`](src/features/encounter/helpers/combatants/combatant-builders.ts) sets `stats.armorClass` from `combatStats.armorClass` (same pipeline as the hook). Monsters use [`calculateMonsterArmorClass`](src/features/content/monsters/domain/mechanics/calculateMonsterArmorClass.ts) + catalog.

**Ingredients**  
AC uses **equipped** armor/shield from loadout (via [`resolveEquipmentLoadoutDetailed`](src/features/mechanics/domain/equipment/loadout)), **DEX** (and other modifiers), **class/race effects** in `collectIntrinsicEffects`, **equipment effects** from armor catalog, plus **magic items / enchantments** in `computeCombatStatsFromCharacter`. So: not a single stored scalar for PCs.

**Breakdown / explanation**  
Yes: `resolveStatDetailed` returns `BreakdownToken[]`; `CombatStatsCard` uses `formatBreakdown` / tooltips. [`getLoadoutPickerOptions`](src/features/character/domain/engine/getLoadoutPickerOptions.ts) precomputes AC + breakdown **per armor×shield combination** for owned inventory.

---

## 5. Audit: weapon / armor “option” breakdowns

| Concern | Current behavior |
|--------|-------------------|
| **All owned weapons** | [`getWeaponPickerOptions`](src/features/character/domain/engine/getWeaponPickerOptions.ts) lists **every owned** weapon with catalog metadata only — **no** attack/damage/proficiency math per row. |
| **Attack rows** | [`getCharacterAttacks`](src/features/character/hooks/useCombatStats.ts) only resolves **wielded** weapons (`resolveWieldedWeaponIds`). |
| **All owned armor AC** | [`getLoadoutPickerOptions`](src/features/character/domain/engine/getLoadoutPickerOptions.ts) builds a **full Cartesian product** of owned non-shield armors × owned shields (plus unarmored / no-shield), each with AC + breakdown — **already richer than** “each armor with current shield only.” |
| **Warnings / penalties** | EquipmentStep shows “Not proficient”; sheet attacks do not show non-proficiency on the attack line today. |

**Loadout picker**  
[`LoadoutStep`](src/features/characterBuilder/steps/LoadoutStep/LoadoutStep.tsx) is **selection UI only** (no AC preview). Sheet loadout editing is **CombatStatsCard** + `getLoadoutPickerOptions`.

---

## 6. Engine / mechanics paths to keep separate

These should **not** be folded into `CharacterQueryContext` and should remain the **authoritative rules/combat** pipeline:

- [`useCombatStats`](src/features/character/hooks/useCombatStats.ts) / [`computeCombatStatsFromCharacter`](src/features/character/hooks/useCombatStats.ts) — full effect assembly (magic items, enchantments), proficiency bonus, attacks for **wielded** weapons, initiative, HP max.  
- [`resolveEquipmentLoadoutDetailed`](src/features/mechanics/domain/equipment/loadout) — slot resolution.  
- [`buildCharacterContext`](src/features/character/domain/engine/buildCharacterContext.ts) / [`buildCharacterResolutionInput`](packages/mechanics/src/resolution/builders/buildCharacterResolutionInput.ts) — `EvaluationContext` + baseline effects.  
- [`collectIntrinsicEffects`](src/features/character/domain/engine/collectCharacterEffects.ts) — class/race/feature effects (engine input).  
- Encounter resolution, [`buildCharacterCombatantInstance`](src/features/encounter/helpers/combatants/combatant-builders.ts), monster adapters, Pick Lock availability.

**Intended split:** `CharacterDerivedContext` is a **read model for sheet/UI** that may **call the same pure resolvers** (`resolveStatDetailed`, `resolveWeaponAttackBonus`, etc.) with explicit inputs — but it does **not** replace combatant build or action resolution.

---

## 7. Catalog availability (today)

[`CampaignCatalogAdmin`](packages/mechanics/src/rulesets/campaign/buildCatalog.ts) (from [`CampaignRulesProvider`](src/app/providers/CampaignRulesProvider.tsx)) exposes merged maps such as: `classesById`, `racesById`, `weaponsById`, `armorById`, `gearById`, `magicItemsById`, `spellsById`, `skillProficienciesById`, etc., plus admin `*AllById` variants. Content is **system + campaign overrides** via `buildCampaignCatalog`.

**Phase 1 needs:** `classesById` (or system class access consistent with `collectBaseProficiencyEffects`), `weaponsById`, `armorById` (type aligns with `CreatureArmorCatalogEntry` / AC resolution), and the existing **tool grant** helper (already class-def-based).  
**Defer:** full `magicItemsById` effect modeling if you first mirror `useCombatStats` without duplicating magic-item selection logic — or explicitly import the same `selectActiveMagicItemEffects` path as a **shared helper** invoked from the derived builder.

There is **no** dedicated `backgroundsById` on the character model in-repo from this audit; `GrantSource.kind: 'background'` can be reserved.

---

## 8. Fit of the proposed `CharacterDerivedContext` shape

**Strengths**  
- Separates **base** (persisted skill ids from query context) vs **granted** (class/tools) vs **effective** — matches how data actually works (weapon/armor grants are not persisted).  
- `loadout.current` vs **option arrays** matches the requirement for **equipped summary + all owned options**.

**Adjustments recommended**  
- **Weapon/armor proficiency** is naturally **`categories` + `item ids`**, not only `Set<string>` — mirror [`EquipmentProficiency`](packages/mechanics/src/proficiencies/proficiency-adapters.ts) in the derived model (or store both: derived sets for “explicit item ids” plus category lists). Pure id sets alone lose “simple weapons” style grants.  
- **Tool grants:** align ids with [`ToolProficiencyItem`](src/features/content/classes/domain/types/proficiencies.types.ts) / gear `proficiency` strings; effective tool set = granted ∪ (optional future persisted choices).  
- **Skills:** `base.skillIds` = query context; **granted** skills from effects are **not** consistently persisted today — either keep Phase 1 skills **query-only** or add a follow-up to merge skill grants from `collectIntrinsicEffects` (risk: divergence from sheet chips unless API stores them).  
- **Naming:** keep **`CharacterQueryContext` selectors** for membership; add **`derived/selectors/`** with names like `hasEffectiveWeaponProficiency(derived, weaponCatalogEntry)` (needs catalog row for category match).

**Grant/source tracking**  
Low-risk: reuse existing effect `source` strings from `collectBaseProficiencyEffects` (`class:${classId}`). Optional `Map<itemId, GrantSource[]>` for explicit **item** grants; category-only grants may map to a synthetic key or `label` on the grant bucket. Defer rich labels until class names are threaded from `classesById`.

---

## 9. Recommended module placement

**Preferred:** [`src/features/character/domain/derived/`](src/features/character/domain/derived/) — sibling to [`query/`](src/features/character/domain/query/) and [`engine/`](src/features/character/domain/engine/).

- **`query/`** = normalized persisted/id sets (`CharacterQueryContext`).  
- **`derived/`** = resolved capabilities + sheet options (catalog-aware).  
- **`engine/`** = effects collection + `EvaluationContext` mappers (shared **inputs**, not the derived read model itself).

Avoid `query/derived/` to reduce ambiguity (“is this persisted or resolved?”).

Suggested layout:

- `characterDerived.types.ts`, `buildCharacterDerivedContext.ts`  
- `grants/classWeaponArmorGrants.ts`, `classToolGrants.ts` (thin wrappers around existing collectors)  
- `loadout/resolveArmorOptions.ts`, `resolveWeaponOptions.ts` (or single `resolveLoadoutDisplay.ts`)  
- `selectors/*.ts`

---

## 10. Phased implementation plan

### Phase 1 (suggested scope)

1. **Types** for `CharacterDerivedContext` + option rows (`ArmorOptionBreakdown`, `WeaponOptionBreakdown`) with `isEquipped` / `isMainHand` / `isOffHand`, warnings array (e.g. not proficient).  
2. **Proficiencies:**  
   - `base`: skill ids from `query.proficiencies.skillIds`; weapon/armor/tool base empty unless you later add persisted sources.  
   - `granted`: weapon/armor from the same logical data as `collectBaseProficiencyEffects` (reuse `collectIntrinsicEffects` + `deriveEquipmentProficiency` **or** extract a small pure “grants” builder from class defs for clearer source maps).  
   - `granted` tools: `collectGrantedToolProficienciesFromClassLevels` + ruleset id param.  
   - `effective`: union; expose selectors `hasEffectiveWeaponProficiency`, etc., delegating to `isItemProficient` with catalog row.  
3. **Optional source map:** `Map` from explicit item id → `{ kind: 'class', id: classId }[]` where items are listed on the class def; category-only grants documented as aggregate without per-weapon sources in Phase 1.  
4. **AC:**  
   - `loadout.current`: reuse `computeCombatStatsFromCharacter`-level resolution **or** factor a shared pure function both call — same effects list as today so values match the sheet.  
   - `armorOptions`: **each owned body armor** (exclude shields) with **current equipped shield** (and unarmored row): one `resolveStatDetailed('armor_class', ...)` per hypothetical loadout — **avoid** full armor×shield grid in Phase 1 **unless** you explicitly want parity with `getLoadoutPickerOptions` (which already does the full grid).  
5. **Weapon options:** for **each owned weapon**, compute attack + damage with **correct proficiency level** (0 vs 1) using effective proficiency — fixes the current sheet inconsistency for optional comparison rows; mark which are main/off from `query.combat`.  
6. **Wire1–2 consumers:** e.g. add a narrow hook `useCharacterDerivedContext(character, catalog, ruleset)` used by **CombatStatsCard** only for a **secondary** “All weapons” expandable table or proficiency chips — **or** a **LevelUpWizard** panel if that’s higher priority — without deleting `useCombatStats` yet.  
7. **Tests:** pure unit tests for grant merging, proficiency selector edge cases (category vs item), and golden tests for option rows on a fixture character + minimal catalog; keep **one** integration-style test that derived **current AC** matches `computeCombatStatsFromCharacter` for the same inputs.

### Explicitly defer

- Full **armor × shield** matrix in derived (unless re-exporting `getLoadoutPickerOptions` results as a field).  
- Race / background / item proficiency sources beyond what effects already encode (`collectRaceEffects` is currently empty).  
- Migrating encounter combatants off `useCombatStats`.  
- Replacing loadout picker UX or `LoadoutStep`.  
- Skill **grants** from features if not stored on the character document.

### Conflict avoidance vs engine

- Document **`CharacterDerivedContext` as sheet/display**; encounters keep **`combatStats`**.  
- Prefer **importing shared pure functions** from `packages/mechanics` / existing resolution modules rather than copying formulas.  
- Do **not** add catalog fields to `CharacterQueryContext`; pass catalogs only into `buildCharacterDerivedContext`.

---

## 11. Risks and open questions

1. **Attack proficiency hardcoding** — today’s sheet likely **overstates** attack bonus for non-proficient weapons; Phase 1 weapon options should use real proficiency, which may **change displayed numbers** vs current `CombatStatsCard` until the main attack block is wired.  
2. **Skill grants vs persisted skills** — merging class feature skill grants into `effective.skillIds` may disagree with `ProficienciesCard` until the API persists them.  
3. **Magic items / attunement** — if derived AC/attacks must always match the sheet, the builder must share the same magic-item effect selection as `computeCombatStatsFromCharacter`; factor that deliberately.  
4. **Multiclass / custom classes** — tool grants use `getSystemClass`; campaign-only class ids must follow the same merge rules as the rest of the app.  
5. **Two sources of armor options** — `getLoadoutPickerOptions` already enumerates all combos; decide whether Phase 1 **replaces** it internally or **coexists** to avoid duplicate maintenance.
