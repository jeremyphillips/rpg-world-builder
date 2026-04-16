# AppDataGrid reference

This document describes the **public surface** of [`src/ui/patterns/AppDataGrid`](../../src/ui/patterns/AppDataGrid), **naming conventions** (badge vs legacy “chip” aliases), and **when the built-in client-side filter/search pipeline stops being the right tool**.

For toolbar control details and `ContentTypeListPage`, see [forms.md](./forms.md).

### Campaign content lists (toolbar layout registry)

Campaign routes that pass **`contentListPreferencesKey`** to **`ContentTypeListPage`** no longer pass **`toolbarLayout`** manually. Layouts are resolved from **`CAMPAIGN_CONTENT_LIST_TOOLBAR_LAYOUT_BY_PREFS_KEY`** in [`src/features/content/shared/toolbar/campaignContentListToolbarLayouts.ts`](../../src/features/content/shared/toolbar/campaignContentListToolbarLayouts.ts), which maps each auth prefs key to the domain-defined `*LIST_TOOLBAR_LAYOUT` constant. Override with an explicit **`toolbarLayout`** prop when a screen must diverge.

---

## Imports

| Need | Typical import |
|------|----------------|
| Grid component | `AppDataGrid` from `@/ui/patterns` or `@/ui/patterns/AppDataGrid` |
| Types (`AppDataGridColumn`, `AppDataGridFilter`, toolbar config, …) | `@/ui/patterns` (re-exported from `./AppDataGrid/types`) |
| Filter helpers (`getFilterDefault`, `getActiveFilterBadgeSegments`, discrete range math, …) | `@/ui/patterns` or `@/ui/patterns/AppDataGrid/filters` |
| Viewer visibility (`filterAppDataGridFiltersByVisibility`, …) | `@/ui/patterns` |
| Campaign “owned” column/filter | `makeOwnedColumn`, `makeOwnedFilter` from `@/ui/patterns` |
| Discrete range toolbar control | `AppToolbarDiscreteRangeField` from `@/ui/patterns/AppDataGrid` (also re-exported from `@/ui/patterns` when listed in the patterns barrel) |

Prefer **`@/ui/patterns`** for app code so imports stay stable if internal paths shift.

---

## Naming: badge vs chip

Toolbar dismissible items are **badges** (`AppBadge`). Filter metadata uses **`formatActiveBadgeValue`** and related names.

Legacy aliases remain for compatibility:

- Filter field: **`formatActiveChipValue`** → use **`formatActiveBadgeValue`**.
- Helpers: **`formatDefaultActiveChipValue`** → use **`formatDefaultActiveBadgeValue`**.
- Types: **`AppDataGridActiveChipFormatContext`** → use **`AppDataGridActiveBadgeFormatContext`**.
- Visibility: **`AppDataGridFilterVisibility`** → use **`AppDataGridVisibility`** (same object shape; alias kept for older call sites).

Implementations should read **`formatActiveBadgeValue` first** and fall back to **`formatActiveChipValue`** only when the badge name is absent.

---

## Client-side pipeline (today)

`AppDataGrid` keeps **all rows in memory** and derives the displayed set with **`filterRows`** (`core/appDataGridFiltering.ts`):

- **Filters:** for each row, every active filter is evaluated (accessors run per row per filter).
- **Search:** unless `searchRowMatch` is provided, each searchable field is matched per row. Column definitions are indexed **once per `filterRows` call** (not per field lookup per row).

Complexity is roughly **O(rows × filters)** plus **O(rows × searchableFields)** for default search. Large column lists and many concurrent filters increase constant factors.

---

## Scale thresholds and UX signals

Staying on the **current** client-side model is reasonable when:

- Row counts are in the **low thousands or below** for typical campaign content lists on desktop, and interactions stay responsive.
- Users do not need **server-authoritative** filtering (e.g. security-sensitive slices of data that must not be shipped to the client).
- **Selection and bulk actions** are not required; checkbox selection is present but **without** a controlled selection API or bulk workflows yet.

**Consider moving beyond** this pipeline (server-side or indexed search, query APIs, virtualization, or a different list primitive) when **any** of these apply:

| Signal | Rationale |
|--------|-----------|
| **Larger lists** (tens of thousands of rows) or **measurable main-thread cost** when typing search or toggling filters | Linear scans over full row sets do not scale indefinitely. |
| **Search must match fields** that are expensive to stringify on every keystroke, or **many columns** participate in search | Increases per-row work; may need indexed search or backend queries. |
| **Need for bulk actions** (delete, export, tag) with reliable selection across pages | Requires a real **selection contract** (and likely server participation), not only client-side row ids. |
| **Security / entitlement** requires that filtered-out rows **never** reach the client | Client-side filtering is not sufficient; filtering must happen on the server. |
| **Consistent UX** with a large admin or moderation grid that already uses **server-driven** tables elsewhere | Avoid two incompatible mental models (“content lists” vs “real” data grids) unless intentional. |

These are **guidelines**, not hard caps: profile with realistic data and devices when in doubt.

---

## Deferred (not part of the current pattern)

The following are **explicitly out of scope** for the shared `AppDataGrid` primitive until requirements are clear:

- Server-driven or **indexed** full-text search wired into the same toolbar
- **Controlled selection** API and callbacks for bulk operations
- Generalized **toolbar plugin** system
- Splitting helpers into many tiny files **before** module boundaries stabilize

---

## Related code

- [`src/ui/patterns/AppDataGrid/core/appDataGridFiltering.ts`](../../src/ui/patterns/AppDataGrid/core/appDataGridFiltering.ts) — row filtering and default search matching
- [`src/ui/patterns/AppDataGrid/types/appDataGrid.types.ts`](../../src/ui/patterns/AppDataGrid/types/appDataGrid.types.ts) — props and selection TODO
- [`src/features/content/shared/components/ContentTypeListPage.tsx`](../../src/features/content/shared/components/ContentTypeListPage.tsx) — campaign content list wrapper
