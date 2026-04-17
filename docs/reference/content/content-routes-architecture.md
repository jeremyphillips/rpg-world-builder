# Content routes architecture

## 1. Purpose and scope

This document describes **shared route-level architecture** for campaign **content** surfaces in the app: how **list**, **detail**, **create**, and **edit** routes compose shared primitives, where responsibilities belong, and how standardization rolls out across content types.

It is the **umbrella** reference for cross-cutting content UI patterns. It does **not** replace:

| Topic | See instead |
| --- | --- |
| **Monster stat-block semantics, AC, equipment modeling, effects** | [Monster authoring](./monster-authoring.md) |
| **AppDataGrid API, filters, toolbar internals, naming** | [AppDataGrid reference](../appdatagrid.md) |
| **Form system mechanics** (field specs, dynamic forms) | [forms.md](../forms.md) |

**Boundary rule:** If guidance applies to **many** content types (routing shape, detail specs, images, privileges), it belongs **here**. If it is **monster data semantics** or **authoring rules** for monsters, it belongs in **monster-authoring.md**. If it is **grid primitive** behavior, it belongs in **appdatagrid.md**.

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
| **`ContentDetailMetaRow`** | Compact **inline** metadata under the header (source, gated visibility, etc.) — spec-driven via `buildDetailItemsFromSpecs(..., { section: 'meta' })`; not a `KeyValueSection`. |
| **`ContentDetailImageKeyValueGrid`** | Top detail layout: **key/value column(s)** + **image column** (responsive grid). Primary shell for stat-block–style content. |
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
| **Route file (`*Route.tsx`)** | Data loading (hooks), campaign context, composing scaffolds/grids, calling builders with **ctx**, privilege gates (e.g. accordion visibility). | Heavy formatting, large JSX field bodies, form field definitions. |
| **Detail spec (`*Detail.spec.ts` / `.tsx`)** | Field **order**, **labels**, **keys**, wiring to `render` / `getValue` + `renderFriendly` / `renderRaw`, `placement` (meta / main / advanced / main-and-advanced), `metaAudience`, `rawAudience`, `hideIfEmpty`. | Business rules unrelated to presentation; persistence. |
| **Display utils** | Formatting, labels from vocabs, reusable one-line or short multi-line **text** for detail (and tests). | Fetching, React Router, campaign hooks. |
| **View section components** | Structured **friendly** layouts (stacks, typography, section semantics). | Direct API calls; duplicating domain calculations that belong in mechanics/domain. |
| **Form registries** | Edit/create **controls**, validation hooks, mapping to DTO shapes. | Detail-only presentation; duplicating detail spec rows. |
| **Repo / API / mappers** | CRUD, campaign scoping, `toDomain` / `toDTO`. | React components. |
| **Persistence / server** | Storage, authorization. | UI layout. |

**Anti-patterns:** Bloated route files with inline field JSX for every column; detail rows copy-pasted from form configs; image URL concatenation in each route.

---

## 5. Detail presentation architecture

### 5.1 Standard shell

For content types that use the shared detail layout:

1. Wrap in **`ContentDetailScaffold`**.
2. Optionally render **`ContentDetailMetaRow`**. Prefer **`buildContentDetailSectionsFromSpecs({ specs, item, ctx, viewerContext })`** from the forms registry: it returns **`metaItems`**, **`mainItems`**, **`advancedItems`**, and **`viewer`** (via **`toDetailSpecViewer`**) in one call, composing **`buildDetailItemsFromSpecs`** for each section with a consistent viewer. For one-off rows, **`buildDetailItemsFromSpecs(detailSpecs, entity, ctx, { section: 'meta' | 'main' | 'advanced', viewer })`** remains the primitive. Page metadata (source, visibility, …) belongs **next to page identity**, not inside the main stat-block grid. Set **`hideAccessPolicyBadge`** on the scaffold when the meta row replaces the legacy standalone non-public visibility badge.
3. Use **`ContentDetailImageKeyValueGrid`** with `imageContentType`, `imageKey`, `alt`, and children.
4. Inside the grid’s main column, render **`KeyValueSection`** with **`mainItems`** from the grouped builder (or **`buildDetailItemsFromSpecs`** when not using the grouped helper).

### 5.2 Spec-driven items

- **Detail spec arrays** live next to domain (e.g. `spellDetail.spec.tsx`, `monsterDetail.spec.tsx`). One array drives **meta**, **main**, and **advanced**; do not fork parallel spec lists per surface.
- **`buildContentDetailSectionsFromSpecs`** / **`toDetailSpecViewer`:** route-level DRY helpers for campaign **`ViewerContext`** → detail viewer slice and **`meta` / `main` / `advanced`** row lists.
- **`buildDetailItemsFromSpecs`** supports:
  - **`placement`:** `meta` | `main` | `advanced` | `main-and-advanced` (legacy `both` is normalized to `main-and-advanced`).
  - **`metaAudience`:** who may see a meta row (`all` | `platformOwner` | `dm-or-platformOwner`). Evaluated only for `section: 'meta'` (DM/co-DM or platform admin for `dm-or-platformOwner`; see `canViewDetailMetaDmOrPlatformOwner` in shared capabilities).
  - **Dual presentation:** `getValue`, `renderFriendly`, optional `renderRaw`, **`rawAudience`** for `section: 'advanced'` (`all` | `platformOwner` — platform-admin-only raw JSON).
- **Presets** (e.g. `metaAll`, `metaDmOrPlatformOwner`, `structuredMainAndAdvanced`) live in the shared forms registry for concise spec authoring.

### 5.3 Surfaces: meta, main, advanced

- **Meta:** Compact inline row under the title/edit line — not `KeyValueSection` layout. Use for shared header-adjacent metadata (source, visibility with audience gating).
- **Main:** User-facing, readable summaries inside **`KeyValueSection`** (view section components + display utils).
- **Advanced:** Optional **structured JSON** (or custom `renderRaw`) for **platform admins**, typically in a **collapsed accordion** below the image grid. `placement: 'main-and-advanced'` shows friendly content in main and raw in advanced for the same spec.

**Explicit rule:** **Detail presentation config must not be derived from form registries.** Forms and detail answer different questions (editing shape vs read-only display). Sharing **domain types** and **display helpers** is fine; auto-generating detail rows from `FIELD_SPECS` is not the default pattern.

### 5.4 Transitional note

Dual **main + advanced** presentation is **rolled out per content type**. Types that only use `render` + main section are still valid; legacy **`placement: 'both'`** remains supported; see §8.

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
| **Monster** | standardized | standardized | standardized | standardized | standardized | Reference: meta row (source + gated visibility) + main summaries + platform-admin advanced raw JSON; single `MONSTER_DETAIL_SPECS` array. |
| **Spell** | standardized | standardized | standardized | standardized | planned | Detail uses shared grid + specs; extend dual presentation when needed. |
| **Equipment** (weapons, armor, gear, magic items) | standardized | standardized | standardized | partial | planned | Hub + per-kind routes; image keys vary by kind. |
| **Class** | standardized | standardized | standardized | partial | planned | — |
| **Race** | standardized | standardized | standardized | partial | planned | — |
| **Location** | standardized | standardized | standardized | partial | planned | Workspace flows are documented separately under [locations/](../locations/). |
| **Skill proficiencies** | standardized | standardized | standardized | partial | planned | Narrower domain than full items. |
| **Character / PC / NPC** | partial | partial | partial | partial | not applicable | **Not** the same module tree as `features/content/*` campaign lists; character builder and sheet UIs follow overlapping but separate patterns. |

**Legend (intentionally coarse):**

- **standardized** — Uses shared scaffolding/patterns; safe to mimic for new work.
- **partial** — Mixed or some routes/types lag (e.g. image path, guards).
- **planned** — On roadmap; pattern agreed, not fully applied.
- **in progress** — Active refactor (replace when stable).

---

## 9. Related docs

| Document | Focus |
| --- | --- |
| [AppDataGrid reference](../appdatagrid.md) | Grid primitive, filters, toolbar, imports—**not** route orchestration. |
| [Monster authoring](./monster-authoring.md) | Monster **data** and **authoring** semantics only. |
| [forms.md](../forms.md) | Form system, `ContentTypeListPage`, field specs. |
| [locations/README.md](../locations/README.md) | Location workspace and map-specific flows (supplements list/detail for locations). |

---

## Document maintenance

When adding a new **campaign content type**, update §8 and link new route files or domain folders here if they establish a new pattern. Keep **one** status matrix in this file to avoid scattering rollout notes across feature READMEs unless a feature needs a deep dive.
