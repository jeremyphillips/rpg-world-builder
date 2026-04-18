# Content vs mechanics boundaries

## 1. Purpose

This document defines **where CMS / content logic ends** and **mechanics / runtime logic begins**, so new features (shared senses vocabulary, character vs monster derivation, encounter adapters) do not scatter responsibilities across `features/content/**`, `features/character`, `packages/mechanics`, and encounter/session builders.

It helps answer:

| Question | Short answer (details below) |
| --- | --- |
| Where should shared senses vocabulary live? | Small neutral module under [`src/features/content/shared/domain/vocab/`](../../../src/features/content/shared/domain/vocab/)—see §4. |
| Should character and monster derived facts share one resolver? | **No**—not as a single mega-pipeline yet. Share **output vocabulary** (`CreatureSenses`), not one unified derivation layer (§3, §5). |
| What belongs in content shared vs mechanics? | Shared **nouns, labels, selectors** that both domains need; mechanics owns **rules, algorithms, encounter snapshots** (§2, §7). |
| When should something become a mechanics primitive? | When it is **runtime resolution** (effects, stat math, combat/perception state), not presentation or authoring schema (§6). |
| How should data flow from CMS/authored records into encounter runtime? | **Explicit adapters** (e.g. combatant builders, perception capabilities)—not by collapsing authored and runtime into one type (§6). |

**Product note:** **CMS** (content routes, detail specs, authoring) is the current **MVP priority**. Mechanics and encounter work should plug in through **clear adapter seams** and shared vocabulary—not by embedding combat rules or perception math inside list/detail route code.

**Related docs:** [Content routes architecture](./content-routes-architecture.md) · [Monster authoring](./monster-authoring.md) · [Character query layer](../character-query-layer.md)

---

## 2. Layer ownership summary

| Layer | Owns | Should not own | Examples |
| --- | --- | --- | --- |
| **`features/content/shared`** | Reusable content route/detail/list primitives; content detail spec types/builders; content image resolver/fallback policy; shared CMS metadata components; **shared content vocab** when it is presentation/content-facing neutral language | Encounter rules; combat stat formulas; character class/race grant derivation; monster-specific stat block semantics | `ContentDetailScaffold`, detail spec builders, `creatureSenses.*` **vocabulary** (types + display labels + pure selectors) |
| **`features/content/monsters`** | Monster stat block **content**; monster forms/details/display; **authored** senses/traits/actions; monster→display normalization | Character race-derived darkvision; generic encounter perception rules; character sheet derived state | `Monster`, `mechanics.senses`, monster detail sections, `formatMonsterSensesLine` |
| **`features/character`** | Player character records/state; **`CharacterQueryContext`**; **`CharacterDerivedContext`**; sheet/domain logic; class/race/item-derived **character** grants; inventory/loadout ownership | Monster stat block modeling; generic content route primitives; encounter runtime rules **except** thin adapters/snapshots into mechanics | `buildCharacterQueryContext`, `buildCharacterDerivedContext`, `raceSenseGrants` |
| **`packages/mechanics`** | Rules/resolution primitives; stat/effect/proficiency **algorithms**; encounter/combat/perception **runtime** logic; pure helpers consumed by app domains | React/CMS presentation; image fallback; content metadata badges; patched/system/homebrew UI policy; route specs/forms | `getCombatantDarkvisionRangeFt`, condition rules, `CombatantInstance` |
| **Encounter/session builders** (e.g. `buildCharacterCombatantInstance`, `buildCharacterCombatantForGameSession`) | Converting character/monster/content data into **runtime encounter snapshots**; threading **ruleset/catalog/system** context into mechanics where needed | Authoring schema; CMS display decisions; system/homebrew route metadata | `CombatantInstance.senses`, optional `systemRulesetId` for `getSystemRace` fallback |

---

## 3. Shared vocabulary vs shared derivation

**Principle:** Shared **vocabulary** is a common language—not a new mega-domain and not automatic ownership of **derivation**.

**Example (darkvision / senses):**

| Good | Rationale |
| --- | --- |
| `CreatureSense`, `CreatureSenses` | Neutral nouns both characters and monsters can emit |
| `getDarkvisionRange`, `hasCreatureSense` | Pure, UI-agnostic selectors |

| Avoid | Rationale |
| --- | --- |
| One giant `CreatureDerivedContext` owning both PC and monster derivation | Premature; pipelines differ (persisted character + catalog vs authored stat block) |
| Moving monster + character logic into `features/content/shared/creatures/**` “because senses are shared” | Creates a fourth ownership bucket before the model justifies it |

**Recommended model:**

1. **Monster** authored senses → normalized **`CreatureSenses`** (aliases acceptable at the monster type boundary).
2. **Character** race/class/item grants → **`CharacterDerivedContext.senses`** → **`CreatureSenses`**.
3. **Mechanics / perception** consumes **`CreatureSenses`** (or equivalent snapshot fields) via shared **selectors** and combatant snapshots—not by re-deriving from prose.

---

## 4. Current recommended location for creature senses vocabulary

**Decision (current):**

```text
src/features/content/shared/domain/vocab/
  creatureSenses.types.ts
  creatureSenses.selectors.ts
  creatureSenses.vocab.ts   # display names (e.g. getCreatureSenseTypeDisplayName)
  index.ts
```

**Why not** `src/features/content/shared/creatures/domain/vocab/`?

- Senses are **shared vocabulary**, not enough to justify a **`creatures` ownership domain** yet.
- Avoid introducing a **fourth mega-domain** parallel to content monsters, character, and mechanics.
- If `packages/mechanics` later needs package-local primitives for headless testing or engine-only builds, you can **promote or mirror** minimal types—without moving presentation vocabulary prematurely.

**Conventions:**

- Prefer **`truesight`** over ambiguous “truesense” in type ids.
- **`source.label`** should not duplicate the sense **type** label; resolve sense type labels via **vocab metadata** / helpers (e.g. `getCreatureSenseTypeDisplayName`), not ad-hoc duplication on every row.

### Race ancestry vs shared senses

- **Race-specific** types (`RaceGrants`, `RaceDefinitionGroup`, lineage options, trait grants) live under **`src/features/content/races/domain/types/`**. Field names align with class **`SubclassSelection`** / **`Subclass`** (`selectionLevel`, `options`, per-option `features`) using **separate** TypeScript types—no shared generic with classes.
- **Shared** creature sense **vocabulary** (`CreatureSense`, selectors, display names) stays under **`src/features/content/shared/domain/vocab/`**—do not add a broad “race vocab” there.
- **Lineage / ancestry / ancestor** are modeled as **`RaceDefinitionGroup.kind`** on a single group model (not separate `lineageOptions` / `ancestryOptions` fields).
- **`race.grants`** are **ongoing** capabilities (senses, traits, …), not character-creation-only **`generation`** data on the race document.
- Persisted picks: **`Character.raceChoices`** maps stable **group id → option id** for selected definition rows.

---

## 5. Character vs monster derivation

**Do not** share a **full** derived pipeline between characters and monsters yet.

| Side | Inputs | Typical outputs |
| --- | --- | --- |
| **Character** | Persisted character record; race/class/item grants; inventory/loadout; `CharacterQueryContext` → `CharacterDerivedContext` | Effective proficiencies, **`CharacterDerivedContext.senses`** (`CreatureSenses`), sheet-facing facts |
| **Monster** | Authored stat block; `mechanics` blobs; traits/actions/senses | Display facts, normalized senses for adapters, **no** `CharacterDerivedContext` |

**Shared output:** small **neutral** shapes—start with **`CreatureSenses` only**. **`CreatureArmorClassSummary`**-style sharing is **future**; do **not** generalize AC/proficiencies across characters and monsters in the same pass as senses.

**Rule:** **Share output vocabulary before sharing derivation pipelines.**

---

## 6. Authored shape vs derived shape vs runtime shape

Three shapes should stay **distinct** and connected by **adapters**, not one collapsed model.

| Kind | Meaning | Examples |
| --- | --- | --- |
| **Authored** | How content is **stored or edited** | `monster.mechanics.senses.special`; `race.grants.senses`; class proficiencies in class docs; character inventory blobs |
| **Derived** | How the app **resolves** facts for sheet, display, or downstream **non-encounter** consumers | `CharacterDerivedContext.senses`; effective proficiency sets; normalized `CreatureSenses`; display formatters |
| **Runtime** | What **encounter / perception / combat** reads | Darkvision range ft; passive Perception number; AC; movement speeds; `CombatantInstance`; `EncounterViewerPerceptionCapabilities` |

**Corollary:** Do not store encounter-only optimizations inside authoring documents; do not run CMS formatters inside the perception engine. **Builders** (e.g. `buildCharacterCombatantInstance`) map derived/authored → **runtime** snapshot fields.

---

## 7. Ruleset / system context boundary

| Rule | Detail |
| --- | --- |
| **`RulesetLike` does not own `systemId`** | It is `Pick<Ruleset, 'meta' \| 'content' \| 'mechanics'>`—no campaign system identity. |
| **Campaign system identity** | Comes from **campaign ruleset patch / resolution context**, e.g. **`CampaignRulesetPatch.systemId`**, not from `RulesetLike`. |
| **Encounter/session builders** | Should receive **`systemRulesetId`** (or equivalent) **explicitly** when they need fallback lookups such as **`getSystemRace`** after catalog merge. |
| **Do not** add **`systemId` to `RulesetLike`** | Only to satisfy a builder convenience—use parallel context instead. |
| **Defaulting to `DEFAULT_SYSTEM_RULESET_ID`** | **Single-system compatibility**; document at **fallback** sites (e.g. combatant builder when `systemRulesetId` is omitted). |

**Future direction (not required now):** a small resolution bundle such as:

```ts
// Illustrative — not necessarily implemented
type CampaignRulesetResolutionContext = {
  systemRulesetId: SystemRulesetId
  ruleset: RulesetLike
  catalog: CampaignCatalogAdmin
}
```

…reduces ad-hoc parameter threading; treat as **optional consolidation** when multi-system campaigns mature.

---

## 8. Practical placement rules

**Quick decision guide:**

| Question | Place |
| --- | --- |
| Is it list/detail/create/edit **presentation** or shared route/spec/image/badge behavior? | `features/content/shared` or the **feature’s** content folder ([content routes architecture](./content-routes-architecture.md)) |
| Is it **monster stat block** content or monster-specific UX? | `features/content/monsters` ([monster authoring](./monster-authoring.md)) |
| Is it **player character** sheet/state/inventory/level-up or query/derived? | `features/character` ([character query layer](../character-query-layer.md)) |
| Is it combat/perception/**rules math** or encounter state? | `packages/mechanics` |
| Is it a **neutral noun** both characters and monsters need? | Small **shared vocab module** under `content/shared/domain/vocab`—**not** a shared derivation resolver until proven |

---

## 9. Anti-patterns

- Putting **combat math** or perception rules inside **content route/detail** components or spec `render` functions.
- Putting **CMS metadata**, **image fallback**, or **patched/system/homebrew badge policy** inside **`packages/mechanics`**.
- **Parsing prose** traits/descriptions to infer runtime facts (e.g. darkvision from free text).
- Adding **`systemId` to `RulesetLike`** when it belongs to **campaign/system resolution context**.
- Building a **giant `CreatureDerivedContext`** (or `shared/creatures`) before character vs monster needs **converge**.
- **Duplicating** AC/proficiency algorithms instead of calling **mechanics** helpers from the right layer.
- Letting **encounter builders** own **authoring schema** decisions (they should **consume** catalogs and snapshots, not define edit shapes).

---

## 10. Current rollout guidance

Recommended **sequence** (aligned with senses/darkvision work):

1. **Stabilize CMS / content route/detail architecture** ([content routes architecture](./content-routes-architecture.md)).
2. Add **shared `CreatureSenses`** vocabulary (types, selectors, display names)—§4.
3. **Alias/migrate** monster senses to shared vocab at monster/content boundaries.
4. Add **`race.grants.senses`** (or equivalent structured grants) on race content.
5. Have **`CharacterDerivedContext`** emit **`CreatureSenses`** for race/class/item-derived senses.
6. Pass **derived character senses** into engine/perception via **combatant adapters** and existing perception helpers.
7. **Defer** a shared AC/proficiency **creature** model until product requires it.
8. **Resume encounter polish** after CMS surfaces are stable enough to avoid thrash.

---

## Related documentation

| Doc | Topic |
| --- | --- |
| [Content routes architecture](./content-routes-architecture.md) | List/detail/create/edit patterns, detail specs, image policy |
| [Monster authoring](./monster-authoring.md) | Stat block semantics, monster-specific authoring rules |
| [Character query layer](../character-query-layer.md) | `CharacterQueryContext`, `CharacterDerivedContext`, query vs derived |
