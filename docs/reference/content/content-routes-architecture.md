# Content routes architecture

## 1. Purpose and scope

This document describes **shared route-level architecture** for campaign **content** surfaces in the app: how **list**, **detail**, **create**, and **edit** routes compose shared primitives, where responsibilities belong, and how standardization rolls out across content types.

It is the **umbrella** reference for cross-cutting content UI patterns. It does **not** replace:

| Topic | See instead |
| --- | --- |
| **Monster stat-block semantics, AC, equipment modeling, effects** | [Monster authoring](./monster-authoring.md) |
| **Content/CMS vs mechanics, character vs monster ownership, shared vocabulary, encounter adapters** | [Content vs mechanics boundaries](./content-vs-mechanics-boundaries.md) |
| **AppDataGrid API, filters, toolbar internals, naming** | [AppDataGrid reference](../appdatagrid.md) |
| **Form system mechanics** (field specs, dynamic forms) | [forms.md](../forms.md) |

**Boundary rule:** If guidance applies to **many** content types (routing shape, detail specs, images, privileges), it belongs **here**. If it is **monster data semantics** or **authoring rules** for monsters, it belongs in **monster-authoring.md**. If it is **grid primitive** behavior, it belongs in **appdatagrid.md**. If the question is **where CMS/content ends and mechanics, encounter runtime, or shared vocab begins**, use **[content vs mechanics boundaries](./content-vs-mechanics-boundaries.md)**—this doc stays **route/UI** focused.

---

## 2. Route surface types

Four primary **route classes** appear across `src/features/content/**/routes/` (and similar campaign-scoped modules):

| Surface | Responsibility |
| --- | --- |
| **List** | Browse and filter campaign-visible entries; link into detail; optional create entry point; uses shared list scaffolding + **`AppDataGrid`** (or list page wrappers that host it). |
| **Detail** | Read-only presentation of one entry: identity, metadata, and field display; may include image, breadcrumbs, edit affordance, visibility/source badges. |
| **Create** | Author a new entry: form driven by registry + validation; persists via repo/API; redirects to detail or list on success. |
| **Edit** | Same persistence path as create, preloaded from existing entry; guards often align with campaign ownership / platform admin for system content. |

List/detail are **read surfaces**. Create/edit are **write surfaces**. Shared **repos** and **domain types** sit below all four.

---

## 3. Shared building blocks

Route files should **compose** these pieces rather than reimplementing layouts ad hoc.

| Building block | Role |
| --- | --- |
| **`AppDataGrid`** | Primary table for **list** routes: columns, filters, sorting, viewer-aware visibility. Primitive details stay in [appdatagrid.md](../appdatagrid.md). |
| **`ContentTypeListPage` / campaign list prefs** | Higher-level list shell: toolbar layout registry, preferences keys—see [appdatagrid.md](../appdatagrid.md) and [forms.md](../forms.md). |
| **`ContentDetailScaffold`** | Detail page chrome: title, breadcrumbs, edit path, optional manage; optional standalone non-public visibility badge (omit when meta drives visibility). |
| **`ContentDetailMetaRow`** | Compact **inline** metadata under the header (source, DM / platform–only patched badge when applicable, gated visibility, etc.) — spec-driven via `buildDetailItemsFromSpecs(..., { section: 'meta' })`; not a `KeyValueSection`. |
| **`ContentDetailImageKeyValueGrid`** | Top detail layout: **key/value column(s)** + **image column** (responsive grid). Primary shell for stat-block–style content. |
| **`ContentDetailAdvancedAccordion`** | Shared **collapsed-by-default** accordion below the image grid for **`advancedItems`** (platform-admin raw JSON / structured rows). Renders `null` when `items` is empty — pass **`advancedItems`** from **`buildContentDetailSectionsFromSpecs`** without a separate length gate. Props: **`sectionTitle`**, **`idPrefix`** (kebab-case for stable `id` / `aria-controls`). Implemented in `src/features/content/shared/components/detail/ContentDetailAdvancedAccordion.tsx`. |
| **`KeyValueSection`** | Renders label/value rows from `KeyValueItem[]` (often produced by builders below). |
| **Detail spec arrays** | Declarative `DetailSpec[]` per content type (e.g. `MONSTER_DETAIL_SPECS`, `SPELL_DETAIL_SPECS`): order, labels, and how each field renders. Built with `buildDetailItemsFromSpecs` from `@/features/content/shared/forms/registry`. |
| **Display utils** | Pure (or mostly pure) formatters under `domain/details/display/` (e.g. spell/monster display helpers): **strings and small React fragments**, no route wiring. |
| **View section components** | Friendly JSX blocks (e.g. `MonsterView/sections/*`) that consume display utils and domain types; keep **route + spec** thin. |
| **Form registries** | `*Form.registry.ts` + field specs: drive **create/edit** forms; separate from detail presentation (see §5). |
| **Image resolver / fallbacks** | Shared helpers (e.g. `resolveContentImageUrl`, fallbacks maps) so list/detail do not hardcode asset URLs. See §6. |

---

## 4. Responsibilities by layer

| Layer | Owns | Should not own |
| --- | --- | --- |
| **Route file (`*Route.tsx`)** | Data loading (hooks), campaign context, composing scaffolds/grids, calling builders with **ctx**. Advanced/raw visibility comes from **specs + viewer** (empty **`advancedItems`** for non–platform admins); use **`ContentDetailAdvancedAccordion`** instead of duplicating MUI accordion markup per route. | Heavy formatting, large JSX field bodies, form field definitions. |
| **Detail spec (`*Detail.spec.ts` / `.tsx`)** | Field **order**, **labels**, **keys**, wiring to `render` / `getValue` + `renderFriendly` / `renderRaw`, `placement` (meta / main / advanced / main-and-advanced), `metaAudience`, `rawAudience`, `hideIfEmpty`. | Business rules unrelated to presentation; persistence. |
| **Display utils** | Formatting, labels from vocabs, reusable one-line or short multi-line **text** for detail (and tests). | Fetching, React Router, campaign hooks. |
| **View section components** | Structured **friendly** layouts (stacks, typography, section semantics). | Direct API calls; duplicating domain calculations that belong in mechanics/domain (see [content vs mechanics boundaries](./content-vs-mechanics-boundaries.md) §2, §8). |
| **Form registries** | Edit/create **controls**, validation hooks, mapping to DTO shapes. | Detail-only presentation; duplicating detail spec rows. |
| **Repo / API / mappers** | CRUD, campaign scoping, `toDomain` / `toDTO`. | React components. |
| **Persistence / server** | Storage, authorization. | UI layout. |

**Anti-patterns:** Bloated route files with inline field JSX for every column; detail rows copy-pasted from form configs; image URL concatenation in each route; copy-pasting the **advanced** MUI `Accordion` block per detail route instead of **`ContentDetailAdvancedAccordion`**.

---

## 5. Detail presentation architecture

### 5.1 Standard shell

For content types that use the shared detail layout:

1. Wrap in **`ContentDetailScaffold`**.
2. Optionally render **`ContentDetailMetaRow`**. Prefer **`buildContentDetailSectionsFromSpecs`** from the forms registry with an explicit viewer slice:

   ```ts
   const viewer = toDetailSpecViewer(viewerContext);
   const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
     specs: DETAIL_SPECS,
     item,
     ctx,
     viewer,
   });
   ```

   Passing **`viewerContext`** alone is still supported (the builder calls **`toDetailSpecViewer`** internally). **`buildDetailItemsFromSpecs(..., { section, viewer })`** remains the lower-level primitive. Page metadata (source, patched when applicable, visibility, …) belongs **next to page identity**, not inside the main stat-block grid. Set **`hideAccessPolicyBadge`** on the scaffold when the meta row replaces the legacy standalone non-public visibility badge.
3. Use **`ContentDetailImageKeyValueGrid`** with `imageContentType`, `imageKey`, `alt`, and children.
4. Inside the grid’s main column, render **`KeyValueSection`** with **`mainItems`** from the grouped builder (or **`buildDetailItemsFromSpecs`** when not using the grouped helper).
5. Below the grid, render **`ContentDetailAdvancedAccordion`** with **`items={advancedItems}`**, a per-type **`sectionTitle`** (e.g. “Advanced gear data”), and a unique **`idPrefix`** (e.g. `gear`, `magic-item`, `skill-proficiency`) for accessibility. Do not reimplement the accordion in each route.

### 5.2 Spec-driven items

- **Detail spec arrays** live next to domain (e.g. `spellDetail.spec.tsx`, `monsterDetail.spec.tsx`). One array drives **meta**, **main**, and **advanced**; do not fork parallel spec lists per surface.
- **`buildContentDetailSectionsFromSpecs`** / **`toDetailSpecViewer`:** route-level DRY helpers for campaign **`ViewerContext`** → detail viewer slice and **`meta` / `main` / `advanced`** row lists.
- **`buildDetailItemsFromSpecs`** supports:
  - **`placement`:** `meta` | `main` | `advanced` | `main-and-advanced` (legacy `both` is normalized to `main-and-advanced`).
  - **`metaAudience`:** who may see a meta row (`all` | `platformOwner` | `privilegedContentMeta`). Evaluated only for `section: 'meta'` (DM/co-DM or platform admin for `privilegedContentMeta`; see `canViewPrivilegedContentMeta` in shared capabilities — same rule for list filters and other privileged metadata UI).
  - **Dual presentation:** `getValue`, `renderFriendly`, optional `renderRaw`, **`rawAudience`** for `section: 'advanced'` (`all` | `platformOwner` — platform-admin-only raw JSON).
- **Presets** (e.g. `metaAll`, `metaPrivilegedContentMeta`, `structuredMainAndAdvanced`, `structuredAdvancedOnly`) live in the shared forms registry for concise spec authoring. Use **`structuredAdvancedOnly`** when a field should appear only in the platform-admin advanced section (raw JSON), not in main.
- **Shared meta rows:** In `@/features/content/shared/domain` (`domain/details/contentDetailMetaSpecs.tsx`):
  - **`contentDetailMetaSpecs()`** — standard **Source** (order 8) and **Visibility** (order 10) rows for any item with `ContentBase` `source` and `accessPolicy`.
  - **`contentDetailPatchedMetaSpecs()`** — optional **Patched** row when `item.patched`: compact **label** `Patched` + warning **badge** in the value cell, **order 9** between source and visibility, **`metaPrivilegedContentMeta`** audience (same as **Visibility** — [`canViewPrivilegedContentMeta`](../../../shared/domain/capabilities.ts)). Spread it in the same `*Detail.spec.tsx` array immediately after `...contentDetailMetaSpecs()` (or equivalent ordering) for each campaign content type that uses the shared detail shell.
  - **Do not** render a separate Patched block in `*DetailRoute.tsx`; keep the indicator in meta specs so layout and ordering stay consistent.

### 5.3 Surfaces: meta, main, advanced

- **Meta:** Compact inline row under the title/edit line — not `KeyValueSection` layout. Typical rows: **Source** (all viewers); **Patched** when `item.patched` and **Visibility** (both gated with `metaAudience: 'privilegedContentMeta'` — evaluated via **`canViewPrivilegedContentMeta`**; do not use ad hoc `isDm || isPlatformAdmin` in routes for these rows).
- **Main:** User-facing, readable summaries inside **`KeyValueSection`** (view section components + display utils).
- **Advanced:** Optional **structured JSON** (or custom `renderRaw`) for **platform admins** (`rawAudience: 'platformOwner'` → `viewer.isPlatformAdmin`), presented in **`ContentDetailAdvancedAccordion`** below the image grid (**collapsed by default**). `placement: 'main-and-advanced'` shows friendly content in main and raw in advanced for the same spec entry — **no duplicate advanced spec array**.

### 5.5 Privileged content metadata policy (`canViewPrivilegedContentMeta`)

Use **[`canViewPrivilegedContentMeta`](../../../shared/domain/capabilities.ts)** only for **privileged content metadata** surfaces — not for edit/delete, encounter actions, or general content visibility.

| Surface | Behavior |
| --- | --- |
| Detail meta **Visibility** row | Shown only when the normalized detail viewer passes the helper (via `metaAudience: 'privilegedContentMeta'` in **`buildDetailItemsFromSpecs`**). |
| Detail meta **Patched** row | Same. |
| List **Patched** filter | Appended by **`makePostFilters`** (inside **`buildCampaignContentFilters`**) only when `viewerContext` is set and **`canViewPrivilegedContentMeta(viewerContext)`** is true. |
| Name row | **Do not** add a patched icon beside the name in this architecture; filters carry patched filtering for privileged viewers. |

---


**Explicit rule:** **Detail presentation config must not be derived from form registries.** Forms and detail answer different questions (editing shape vs read-only display). Sharing **domain types** and **display helpers** is fine; auto-generating detail rows from `FIELD_SPECS` is not the default pattern.

### 5.4 Transitional note

Dual **main + advanced** presentation is **rolled out per content type**. Types that only use `render` + main section are still valid; legacy **`placement: 'both'`** remains supported; see §8.

**Rollout notes (equipment):** **Gear** was the first non-monster adoption (empty detail `ctx`). **Weapons**, **armor**, and **magic items** follow the same route shape: explicit `toDetailSpecViewer` + grouped section build, meta row, image grid, collapsed advanced accordion for `rawAudience: 'platformOwner'` specs. Armor is the one equipment detail that passes a small **`ctx`** (dex contribution label). Magic items keep **`imageContentType="equipment"`** because that key is already in the shared fallback map (same fallback asset as other generic equipment).

**Spell:** Same shell; main section keeps the wider **`KeyValueSection`** column count (4) for the stat-block grid. Advanced **`spellRawRecord`** includes `effectGroups`, `resolution`, `scaling`, and full `description` object for platform admins.

**Race / Class:** Same route shell. **Race** main is mostly **description** + optional **campaigns** legacy field; **class** main replaces prior raw **`JSON.stringify`** rows with short **proficiency / progression / requirements** summaries (full structure only in **`classRawRecord`** for platform admins).

**Skill proficiencies / locations:** Same shell. **Skill** main uses **class name** labels for suggested classes, **newline-separated** examples, optional **combat UI** row; **`skillProficiencyRawRecord`** for admins. **Location** main adds **description** in-grid; campaign **map grid** summary still comes from route **`ctx`**; **`locationRawRecord`** includes **connections** and **building** payloads.

**Shared advanced UI:** All standardized campaign content detail routes use **`ContentDetailAdvancedAccordion`** (§3, §5.1 step 5) so layout, default-collapsed behavior, and **`KeyValueSection`** wiring stay consistent.

---

## 6. Image handling architecture

- **Persisted data** carries **`imageKey`** (and related content-type metadata). Routes should not bake in CDN paths to persisted fields.
- **Presentation** uses shared **resolvers** (e.g. `resolveContentImageUrl`) and **fallback** maps so missing or unknown keys degrade predictably in list and detail.
- **Distinction:** Fallback images are a **UI concern** for missing/broken assets; they do not overwrite stored `imageKey`.
- **Expectation:** List and detail surfaces **import the shared resolver** (or shared image components that wrap it) instead of one-off `|| '/placeholder.png'` in each route.
- **“Image-enabled” content type:** Considered **fully** supported when **`imageKey`** flows from authoring → persistence → list/detail resolution **end to end** for that type, not merely when a column exists in the grid.

---

## 7. Create / edit architecture

Create and edit routes share a common pattern:

1. **Form registry** defines fields and layout (`*Form.registry.ts`, form config).
2. **Field specs** and validators encode editing constraints.
3. **Mappers** (`toInput`, `toFormValues`, patch builders) align form state with API DTOs.
4. **Repo** methods perform create/update with campaign scope.
5. **Validation** runs client- and/or server-side before persistence.

**Completeness:** A content type’s route support is **not** “done” at list+detail-only: **create/edit + persistence + validation** must round-trip without corrupting domain shapes. Detail/list can ship earlier, but the **matrix** (§8) should reflect gaps.

**Relationship to detail:** After save, users expect **detail** (and **list** accessors) to reflect stored fields. Regressions often come from mapper drift between form and domain—keep mappers and types in sync with tests when possible.

---

## 8. Rollout / standardization status

Conservative snapshot of cross-cutting behavior. Update this table when a content type gains shared patterns or dual detail presentation.

| Content type | List | Detail | Create / Edit | Image resolver | Advanced raw view | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **Monster** | standardized | **reference (complete)** | standardized | standardized | standardized | Spec-driven **meta** (`ContentDetailMetaRow`) + **main** (`KeyValueSection` in grid) + **advanced** (`ContentDetailAdvancedAccordion`, single `MONSTER_DETAIL_SPECS`); route uses `toDetailSpecViewer` + `buildContentDetailSectionsFromSpecs`. |
| **Gear** | standardized | **reference (complete)** | standardized | standardized | standardized | Same shell as Monster: `GEAR_DETAIL_SPECS`, `imageContentType="gear"`. |
| **Weapon** | standardized | **reference (complete)** | standardized | standardized | standardized | `WEAPON_DETAIL_SPECS` + `imageContentType="weapon"` + platform-admin **Full record (JSON)** accordion; vocab labels for category/mode/damage type/properties. |
| **Armor** | standardized | **reference (complete)** | standardized | standardized | standardized | `ARMOR_DETAIL_SPECS` + `imageContentType="armor"`; dex label via detail `ctx`; advanced full-record JSON. |
| **Magic item** | standardized | **reference (complete)** | standardized | standardized (`equipment`) | standardized | `MAGIC_ITEM_DETAIL_SPECS`; main shows friendly slot/rarity + **effects** summary (`text` / `kind`); single advanced JSON row (`magicItemRawRecord`). `imageContentType` remains **`equipment`** (shared fallback map). |
| **Spell** | standardized | **reference (complete)** | standardized | standardized | standardized | `SPELL_DETAIL_SPECS`: shared meta/patched + existing display helpers for level/school/range/casting/duration/components/attack-save/damage/classes; **description** in main; `spellRawRecord` advanced JSON; `ContentDetailAdvancedAccordion`; `imageContentType="spell"`; main grid **`columns={4}`** preserved. |
| **Equipment hub** | standardized | — | — | — | — | Campaign **equipment** landing groups weapon/armor/gear/magic-item list routes; each kind’s detail row above is the source of truth for that type’s shell. |
| **Class** | standardized | **reference (complete)** | standardized | partial | standardized | `CLASS_DETAIL_SPECS`: friendly **proficiencies** / **progression** / **requirements** / **subclass** lines; **`classRawRecord`** advanced JSON; `imageContentType="class"`. |
| **Race** | standardized | **reference (complete)** | standardized | partial | standardized | `RACE_DETAIL_SPECS`: **description** + optional **campaigns** in main; **`raceRawRecord`** advanced; `imageContentType="race"`. |
| **Location** | standardized | **reference (complete)** | standardized | partial | standardized | `LOCATION_DETAIL_SPECS` on **`LocationContentItem`**; **map grid** line from async `ctx`; **`locationRawRecord`** advanced; `imageContentType="location"`. Workspace/map authoring still documented under [locations/](../locations/). |
| **Skill proficiencies** | standardized | **reference (complete)** | standardized | partial | standardized | `SKILL_PROFICIENCY_DETAIL_SPECS`; suggested classes via **`classIdToName`**; **`skillProficiencyRawRecord`** advanced; `imageContentType="skillProficiencies"`. |
| **Character / PC / NPC** | partial | partial | partial | partial | not applicable | **Not** the same module tree as `features/content/*` campaign lists; character builder and sheet UIs follow overlapping but separate patterns. |

**Advanced raw view (§8 column):** For types marked **standardized** here, the collapsed **Advanced** surface is implemented with **`ContentDetailAdvancedAccordion`** + spec-driven **`advancedItems`** (not per-route accordion markup). See §3 and §5.1.

**Legend (intentionally coarse):**

- **standardized** — Uses shared scaffolding/patterns; safe to mimic for new work.
- **partial** — Mixed or some routes/types lag (e.g. image path, guards).
- **planned** — On roadmap; pattern agreed, not fully applied.
- **in progress** — Active refactor (replace when stable).

---

## 9. Related docs

| Document | Focus |
| --- | --- |
| [Content vs mechanics boundaries](./content-vs-mechanics-boundaries.md) | Layer ownership (`features/content/**`, character, `packages/mechanics`, encounter builders); shared vocabulary vs derivation; ruleset/system id; anti-patterns. |
| [AppDataGrid reference](../appdatagrid.md) | Grid primitive, filters, toolbar, imports—**not** route orchestration. |
| [Monster authoring](./monster-authoring.md) | Monster **data** and **authoring** semantics only. |
| [forms.md](../forms.md) | Form system, `ContentTypeListPage`, field specs. |
| [Character query layer](../character-query-layer.md) | `CharacterQueryContext` vs `CharacterDerivedContext`; query/derived boundaries. |
| [locations/README.md](../locations/README.md) | Location workspace and map-specific flows (supplements list/detail for locations). |

---

## Document maintenance

When adding a new **campaign content type**, update §8 and link new route files or domain folders here if they establish a new pattern. Keep **one** status matrix in this file to avoid scattering rollout notes across feature READMEs unless a feature needs a deep dive. For **cross-layer** ownership (e.g. stat math, perception, encounter snapshots vs CMS presentation), align with [content vs mechanics boundaries](./content-vs-mechanics-boundaries.md) so logic does not drift into routes.
