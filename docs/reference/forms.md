# Forms architecture

This document describes how declarative and custom forms are structured in the app: **`AppForm`**, **`DynamicFormRenderer`**, **`ConditionalFormRenderer`**, and how UI styling is applied for consistent layouts.

---

## Principles

### Use primitives and patterns for field UI

- **`@/ui/primitives`** — Presentational controls only (for example **`AppTextField`**, **`AppSelect`**, **`AppMultiSelectCheckbox`**, **`AppMultiSelect`**, **`AppCheckbox`**, **`AppRadioGroup`**, **`AppDateTimePicker`**, **`AppJsonPreviewField`**, **`AppImageUploadField`**). These components know nothing about react-hook-form; they are controlled via props (`value`, `onChange`, `label`, errors, and so on).
- **`@/ui/patterns/form`** — RHF adapters (names prefixed with **`AppForm…`**, for example **`AppFormTextField`**, **`AppFormSelect`**, **`AppFormMultiSelectCheckbox`**, **`AppFormActions`**) plus layout helpers (**`DynamicFormRenderer`**, **`ConditionalFormRenderer`**, **`AppForm`**).
- **Feature code** should compose forms from these modules. Avoid ad‑hoc MUI **`TextField`** / **`Select`** / raw **`<input>`** for product forms when an **`App*`** or **`AppForm*`** equivalent exists, so behavior and accessibility stay aligned.

Custom screens that are not driven by **`FieldConfig`** still wrap content in **`AppForm`** (or **`FormProvider`** + **`useForm`** when you need full control) and should use **`AppForm*`** field components or primitives plus **`Controller`** where appropriate.

---

## `AppForm`

**Path:** `src/ui/patterns/form/AppForm.tsx`

**Role:** Thin wrapper around **react-hook-form**’s **`useForm`** and **`FormProvider`**. It renders a native **`<form>`** with **`onSubmit={handleSubmit(onSubmit)}`**, default **`mode: 'onBlur'`**, and wraps children in MUI **`Stack`** (configurable **`spacing`**).

- Pass **`defaultValues`** and **`onSubmit`**.
- Children may be a **`ReactNode`** or a function **`(methods) => ReactNode`** to access **`UseFormReturn`** (for example to wire **`watch`** or **`setValue`**).
- Optional **`id`** on **`<form>`** so external buttons can use **`form={id}`** to submit.

**`DynamicFormRenderer`** / **`ConditionalFormRenderer`** assume a **`FormProvider`** ancestor; **`AppForm`** is the usual way to provide it.

---

## `DynamicFormRenderer`

**Path:** `src/ui/patterns/form/DynamicFormRenderer.tsx`

**Role:** Declarative renderer for a list of **`FormLayoutNode`** items (see **`form.types.ts`**). It maps each node to the correct field implementation:

- **Leaf fields** → **`DynamicField`** (react-hook-form / **`Controller`**-backed **`AppForm*`** components) or **`DriverField`** when using a patch driver.
- **Horizontal field groups** (same **`group.id`**, **`direction: 'row'`**) → MUI **`Grid`** with **`FormLayoutStretchProvider`** so row height alignment works (see [UI styling](#ui-styling)).
- **Repeatable groups** → **`RepeatableGroupField`**.
- **`type: 'custom'`** nodes → your **`render`** function receives context (`usePatchDriver`, **`patchDriver`**, etc.).

**No business logic** lives here: it only lays out and delegates. Validation beyond what **`FieldConfig`** carries is expected to come from RHF rules or domain layers outside this component.

### Drivers (`FormDriver`)

The optional **`driver`** prop selects how values are read and written:

| `driver` | Behavior |
|----------|----------|
| Omitted or **`{ kind: 'rhf' }`** | Standard RHF; requires **`FormProvider`**. Fields use **`DynamicField`**. |
| **`{ kind: 'patch', getValue, setValue, unsetValue? }`** | Values flow through a patch-style API (for example workspace drafts). Fields use **`DriverField`**, which binds **`FieldConfig.path`** / **`patchBinding`** to the driver. |

Use the patch driver when the form edits a flattened UI model but persists into a nested domain object, or when you intentionally avoid registering every field in RHF.

---

## `ConditionalFormRenderer`

**Path:** `src/ui/patterns/form/ConditionalFormRenderer.tsx`

**Role:** Wraps **`DynamicFormRenderer`** and **filters** the layout to fields whose **`visibleWhen`** conditions (see **`conditions.ts`**) currently pass. Non-layout nodes (repeatable groups, custom blocks) are kept; leaf fields without **`visibleWhen`** always render.

**When a field becomes hidden:**

- **RHF mode:** the field’s value is reset toward its **`defaultValue`** (or cleared), and errors for that field are cleared.
- **Patch mode:** if **`driver.unsetValue`** exists, the coerced domain path is unset (**`PatchValidationProvider`** may also wrap validation for visible fields only).

Re-renders use **`useWatch`** (RHF) or **`driver.getValue`** (patch) to evaluate conditions. Prefer **`ConditionalFormRenderer`** over hand-rolled show/hide when you use **`visibleWhen`** on **`FieldConfig`**.

---

## Data shapes and configuration

- **`FieldConfig`**, **`FormLayoutNode`**, **`FormSection`**, and related types live in **`src/ui/patterns/form/form.types.ts`**.
- Registry modules in features build arrays of **`FieldConfig`** / **`FormLayoutNode`** for **`DynamicFormRenderer`** / **`ConditionalFormRenderer`**.
- **`buildDefaultValues`** (`utils/buildDefaultValues.ts`) helps derive initial RHF values from the same config.

---

## Field primitives (outlined controls)

### `AppSelect`

**Path:** `src/ui/primitives/forms/AppSelect.tsx`

Outlined **MUI `Select`** with a floating **`InputLabel`**.

- **With `placeholder`:** uses **`displayEmpty`** and a single **`renderValue`** path for the empty value; the label shrinks while the placeholder is visible. Pass **`placeholder`** when you need an “unset” row (for example **“All”** with **`value: ''`**).
- **Without `placeholder`:** no custom **`renderValue`**; empty value follows standard outlined behavior (label may sit in-field until focus/open).
- **`size`** is applied to both **`FormControl`** and **`Select`** (default **`medium`**) so density matches theme and **`MuiOutlinedInput`** overrides.
- **Duplicate empty options:** if **`placeholder`** is set and **`options`** also contains **`{ value: '' }`**, the list filters out that row so the empty choice appears once (placeholder row only). Option lists can still include **`value: ''`** for defaults and filter logic.

**RHF:** use **`AppFormSelect`** (`src/ui/patterns/form/AppFormSelect.tsx`).

### `AppMultiSelectCheckbox`

**Path:** `src/ui/primitives/forms/AppMultiSelectCheckbox.tsx`

Multi-select using MUI **`Select`** (**`multiple`**) with **checkbox** menu rows — no searchable combobox input. Prefer this for compact filters and bounded option lists.

- **`displayMode`:** **`summary`** (default) shows compact text (**`None selected`**, **`1 selected`**, **`N selected`**) without repeating the field label; **`chips`** shows selected values as small outlined chips.
- Defaults **`fullWidth={true}`**; for compact toolbars, pass **`fullWidth={false}`** and constrain with **`sx`** as needed.

**RHF:** use **`AppFormMultiSelectCheckbox`** (`src/ui/patterns/form/AppFormMultiSelectCheckbox.tsx`). Required validation uses a **non-empty array** rule. Must render under **`FormProvider`** (typically via **`AppForm`**).

**Note:** **`FieldConfig`** / **`DynamicFormRenderer`** do not yet expose a dedicated **`multiSelect`** type; wire **`AppFormMultiSelectCheckbox`** manually where needed.

### `AppMultiSelect`

**Path:** `src/ui/primitives/forms/AppMultiSelect.tsx`

Multi-select built on MUI **`Autocomplete`** (**`multiple`**, **`disableCloseOnSelect`**), with **checkbox-style** options and a text input (search / combobox behavior). Use when users need to type to find options in a long list.

- Same **`displayMode`** / summary behavior as **`AppMultiSelectCheckbox`** (summary uses the input’s **`startAdornment`** so empty state is visible).
- **`RHF`:** bind with **`Controller`** / **`AppForm*`** patterns if you need this control in a form; there is no dedicated **`AppFormMultiSelect`** wrapper yet — compose **`AppMultiSelect`** or add a thin adapter alongside **`AppFormMultiSelectCheckbox`** when needed.

---

## `AppDataGrid` toolbar filters

**Path:** `src/ui/patterns/AppDataGrid/core/AppDataGrid.tsx`

Toolbar behavior is configured with optional **`toolbarConfig`**. Filter definitions live under **`toolbarConfig.filters.definitions`**; they render with **`AppSelect`** (**`select`**, **`boolean`**) and **`AppMultiSelectCheckbox`** (**`multiSelect`** filter type), not **`TextField`** + **`select`**. Search uses **`AppTextField`** via **`toolbarConfig.search`**.

- **`toolbarConfig.fieldSizes`:** optional **`primary`** and **`secondary`** — MUI **`size`** per toolbar row. Primary (search + first row of filters) defaults to **`medium`**; secondary defaults to **`small`**. Secondary accepts only **`small`** | **`medium`** (no **`large`**).
- Selects with an **`value: ''`** “All”-style row pass **`placeholder`** from that option’s label; **`AppSelect`** dedupes the empty menu row (see above).
- Toolbar controls use **`fullWidth={false}`** and shared **`sx`** so filters stay inline in a horizontal **`Stack`** (not full-width).

Loading, empty message, density, height, and row class names use optional **`presentation`**. Row checkbox selection uses optional **`selection.enabled`**.

### Filter visibility (viewer)

**Types:** **`AppDataGridVisibility`** (with deprecated **`AppDataGridFilterVisibility`** alias), optional **`visibility`** on each **`AppDataGridFilter`** (same object as **`id`** / **`options`**).

- **`platformAdminOnly`:** if **`true`**, the filter is shown only when **`viewer.isPlatformAdmin`** is true. Omit **`visibility`** (or leave flags unset) so everyone sees the filter.

**Helpers:** **`filterAppDataGridFiltersByVisibility(filters, viewer)`** and **`filterAppDataGridColumnsByVisibility(columns, viewer)`** — use these when you compose **`AppDataGrid`** directly and need to drop hidden schema entries yourself. The older **`filterAppDataGridFiltersForViewer`** / **`filterAppDataGridColumnsForViewer`** names remain as compatibility aliases.

**Content lists:** **`ContentTypeListPage`** groups props into **`page`** (header, **`page.topBanner`**, add/manage), **`grid`** (rows, columns, filters, presentation, optional **`grid.toolbarLayout`**), optional **`preferences`** (e.g. **`preferences.contentListPreferencesKey`** matching `preferences.ui.contentLists` in auth prefs so **`useContentListPreferences`** runs inside the page), and top-level **`viewerContext`**. It applies AppDataGrid `visibility` rules internally: pass **`viewerContext`** and provide raw **`columns`** / **`filters`**; routes do not need to pre-filter them before rendering the page wrapper. Muted disallowed rows use **`getMutedRowClassNameForDisallowedCampaignContent`** from **`contentListTemplate`** / the shared components barrel.

### Toolbar layout (optional)

**Types:** **`AppDataGridToolbarLayout`**, optional **`toolbarConfig.layout`** on **`AppDataGrid`** (and **`grid.toolbarLayout`** on **`ContentTypeListPage`**, which maps into **`toolbarConfig`**).

- **`primary`:** filter **`id`** strings for the first horizontal row (search and actions also render on this row).
- **`secondary`:** optional second row of filter **`id`** strings.
- **`utilities`:** non-filter controls (for example **`hideDisallowed`**) that read/write existing filter state only (same **`allowedInCampaign`** value as the Allowed dropdown).
- When **`toolbarConfig.layout`** is omitted, the toolbar stays a **single wrapping row** in filter **`definitions`** declaration order.

**Helper:** **`indexFiltersById(filters)`** — builds a **`Map`** by id (warns in dev on duplicate ids).

### Filter metadata (badges and tooltips)

Optional on each **`AppDataGridFilter`**:

- **`description`:** short help text next to the label (info icon).
- **`badgePrefixFilterLabel`:** when **`true`**, badge text is **`${label}: ${value}`**; when omitted or **`false`** (default), badges show the value segment only (for example **`Wizard`** instead of **`Classes: Wizard`**).
- **`formatActiveBadgeValue`:** override badge text. Return a **`string`** for one badge, or **`string[]`** for **`multiSelect`** (one badge per entry; order should align with the selected value ids for per-badge delete). For **`select`**, use this to customize wording (for example spell level as **`1st Level`**). The older **`formatActiveChipValue`** name remains as a compatibility alias.

When **`toolbarConfig.layout`** is set, a **badge strip** is always reserved (**`minHeight`** 30px); when search or filters are active, it shows dismissible **`AppBadge`** items and a **Reset** control so the layout does not jump when the first badge appears. **`multiSelect`** filters emit **one badge per selected option**; deleting a badge removes only that value from the selection. Search continues to use **`Search: …`** for the search chip. Range filters on the primary row use **`medium`** for **`AppToolbarDiscreteRangeField`** when **`fieldSizes.primary`** is **`large`** (secondary row cannot be **`large`**).

### Column header helper (optional)

On **`AppDataGridColumn`**, optional **`columnHeaderHelperText`:** renders an info icon + tooltip next to **`headerName`**. Sorting is disabled for that column (custom header).

Campaign content lists default the **Allowed** column helper via **`CAMPAIGN_ALLOWED_IN_CAMPAIGN_COLUMN_HEADER_HELPER_TEXT`**; override with **`buildCampaignContentColumns({ allowedColumnHeaderHelperText })`**.

---

## UI styling

Styling is **MUI-first** and shared through a small set of layout primitives so grid rows align and theme tokens stay consistent.

### `FormLayoutStretchProvider` and `formGridStretchOutlinedSx`

**Path:** `src/ui/patterns/form/FormLayoutStretchContext.tsx`

When fields sit in a **horizontal group** (**`group.direction === 'row'`**), **`DynamicFormRenderer`** wraps the group in **`FormLayoutStretchProvider`** with **`value={true}`**. Descendants call **`useFormLayoutStretch()`**; when **`true`**, outlined inputs are given **`formGridStretchOutlinedSx`** so shorter controls (for example **`Select`**) **stretch vertically** to match taller neighbors (for example multiline or number fields) in the same row.

The shared **`sx`** also targets **`.MuiOutlinedInput-root .MuiSelect-select`** with flex alignment so **selected value / placeholder text** stays **vertically centered** when the outlined root is stretched tall (for example next to a multiline field).

**`AppFormTextField`**, **`AppFormSelect`**, **`AppFormMultiSelectCheckbox`**, and similar components merge this **`sx`** onto their underlying **`FormControl`** / **`TextField`** / **`Select`** / **`Autocomplete`** when stretch is active.

### `FieldWithDescription` and group chrome

**Path:** `src/ui/patterns/form/DynamicField.tsx` (**`FieldWithDescription`**)

- Optional **`fieldDescription`** on **`FieldConfig`** renders as secondary **`Typography`** below the control. Inside stretched grid cells, the wrapper **`Box`** uses flex column layout so descriptions stay under the control while the control expands with the row.

**`DynamicFormRenderer`** group headers use **`subtitle2`** + **`FormHelperText`** for **`group.label`** / **`group.helperText`**, with a bottom border between grouped sections.

### Theme and density

**Path:** `src/app/theme/components.ts`

- Global MUI theme (component defaults, palette) applies to all **`App*`** / MUI usage.
- **`MuiTextField`** and **`MuiSelect`** default **`size: 'medium'`**; outlined **`MuiOutlinedInput`** applies **`minHeight: 56`** for **non-small**, non-multiline inputs so medium density aligns across text fields and selects.
- Primitives such as **`AppSelect`** default **`size`** to **`medium`** unless a screen overrides it (for example **`AppDataGrid`** **`toolbarConfig.fieldSizes`**).
- Many form controls use **`size="small"`** where set explicitly for density; **`AppForm`** uses **`Stack`** spacing **`3`** by default.
- Prefer **`sx`** with theme callbacks (**`(theme) => ({ … })`**) when you need palette-aware borders or spacing, consistent with existing form code.

---

Deeper **`AppDataGrid`** topics (imports, badge vs chip aliases, scale thresholds, deferred features): [appdatagrid.md](./appdatagrid.md).

## Related entry points

| Export | Typical import |
|--------|------------------|
| **`AppForm`** | `@/ui/patterns/form` or `@/ui/patterns` |
| **`DynamicFormRenderer`**, **`ConditionalFormRenderer`**, **`FormDriver`** | `@/ui/patterns/form` |
| **`AppForm*`** field adapters | `@/ui/patterns/form` / `@/ui/patterns` |
| **`AppFormMultiSelectCheckbox`** | `@/ui/patterns/form` / `@/ui/patterns` |
| **`App*`** primitives | `@/ui/primitives` |
| **`AppMultiSelectCheckbox`**, **`AppMultiSelect`** | `@/ui/primitives` |
| **`AppDataGrid`**, **`AppToolbarDiscreteRangeField`** (toolbar filters) | `@/ui/patterns` |
| **`filterAppDataGridFiltersByVisibility`**, **`filterAppDataGridColumnsByVisibility`**, **`AppDataGridVisibility`**, **`AppDataGridToolbarLayout`**, **`indexFiltersById`** | `@/ui/patterns` |
| **`FieldConfig`**, **`FormLayoutNode`** | `@/ui/patterns/form` (re-exported from **`form.types`**) |

For inline editing outside full-page forms, **`src/ui/patterns/form/editable/`** exposes **`EditableTextField`**, **`EditableSelect`**, and similar pattern components (local state / save callbacks rather than **`AppForm`**).
