---
name: AppMultiSelectField primitive + AppDataGrid filters
overview: Implement AppMultiSelectField and AppFormMultiSelectField, then replace AppDataGrid toolbar "fake" TextField+select filters with real AppSelect/AppMultiSelectField (or optional AppForm* after FormProvider migration).
todos:
  - id: primitive-multiselect
    content: Implement AppMultiSelectField.tsx (Autocomplete, checkboxes, summary vs chips, types)
    status: completed
  - id: form-wrapper-multiselect
    content: Implement AppFormMultiSelectField.tsx (Controller, required, stretch sx)
    status: completed
  - id: exports-multiselect
    content: Export from ui/primitives and ui/patterns form + patterns index
    status: completed
  - id: tests-multiselect
    content: Add AppMultiSelectField (+ RHF) tests
    status: completed
  - id: appdatagrid-filters
    content: Replace AppDataGrid fake selects; if using AppFormSelect/AppFormMultiSelectField, wrap with AppForm (or other ui/patterns/form provider pattern)—not raw FormProvider
    status: completed
isProject: true
---

# AppMultiSelectField + AppFormMultiSelectField (+ AppDataGrid filter refactor)

## Added scope: AppDataGrid toolbar filters

Replace the **fake** `AppTextField` + `select` / `MenuItem` construction in [`src/ui/patterns/AppDataGrid/AppDataGrid.tsx`](src/ui/patterns/AppDataGrid/AppDataGrid.tsx) (roughly lines 479–541) with **real field primitives**—no `TextField` pretending to be a select.

### Mapping

| Current `f.type` | Replace with |
|------------------|--------------|
| `select` | **`AppSelect`** — `value`, `onChange`, `options`, `label`, `size="small"`, `sx={{ minWidth: 160 }}` (or shared constant), `placeholder` only if an option uses `value: ''` (align with [`AppSelect`](src/ui/primitives/forms/AppSelect.tsx) empty-state contract). |
| `multiSelect` | **`AppMultiSelectField`** — `value: string[]`, `onChange`, `options`, `label`, default **`displayMode: 'summary'`** for compact toolbar. |
| `boolean` | **`AppSelect`** — three options (`all` / `true` / `false`) same as today; no chips. |

### AppFormSelect / AppFormMultiSelectField vs primitives

[`AppFormSelect`](src/ui/patterns/form/AppFormSelect.tsx) and **`AppFormMultiSelectField`** (new) use **`useFormContext()`** and **`Controller`** — they **require** an ancestor **`FormProvider`**.

**Today**, [`AppDataGrid`](src/ui/patterns/AppDataGrid/AppDataGrid.tsx) stores filters in **`useState`** (`filterValues` / `setFilterValue`), **not** RHF.

**Two implementation paths (pick one in implementation):**

1. **Primitives** — Use **`AppSelect`** + **`AppMultiSelectField`** with the same controlled props wired to existing `getFilterValue` / `setFilterValue`. **No** `FormProvider`. Removes fake selects without RHF.

2. **AppForm* alignment** — Migrate filter state to RHF and use **`AppFormSelect`** / **`AppFormMultiSelectField`**. **Provider rule:** do **not** scatter raw **`FormProvider` + `useForm`** at the grid call site. Prefer **[`AppForm`](src/ui/patterns/form/AppForm.tsx)** (`FormProvider`, `useForm`, `noValidate` `<form>`, optional render-prop children) or another established **`ui/patterns/form`** wrapper so setup matches the rest of the app. **`AppForm`** always wraps children in a **`<form>`** + **`Stack`**; use the **function-child** form `(methods) => …` when the toolbar needs access to `watch` / `setValue`, and use **`onSubmit`** as a no-op or guard if filters are change-driven only (toolbar search + filters typically do not rely on submit). If a **non-`<form>`** shell is truly required, add a **small dedicated pattern** under `ui/patterns/form/` (e.g. a thin `FormStateProvider`) instead of importing `FormProvider` ad hoc—still not raw `FormProvider` in `AppDataGrid.tsx`.

**Larger refactor for path 2:** preserve filter semantics in [`getFilterDefault`](src/ui/patterns/AppDataGrid/AppDataGrid.tsx), [`filteredRows`](src/ui/patterns/AppDataGrid/AppDataGrid.tsx), and all `AppDataGridFilter` variants (often by aligning `defaultValues` field names with `f.id` and driving `filteredRows` from `watch()` or submit-less updates).

**Acceptance for this scope:** Toolbar controls are **not** `AppTextField`+`select`; they use **`AppSelect` / `AppMultiSelectField`** (path 1) **or** **`AppFormSelect` / `AppFormMultiSelectField`** behind **`AppForm`** (or another shared form-pattern provider) (path 2). Single-select empty-string “All” rows behave correctly (**`AppSelect`** + `placeholder` / empty option).

### Files touched

- [`AppDataGrid.tsx`](src/ui/patterns/AppDataGrid/AppDataGrid.tsx) — filter `switch` branch imports and JSX.
- Optional: small shared **`sx`** for filter control width to avoid duplication.

---

## Original plan summary (multi-select primitive)

### Deliverables

1. **`AppMultiSelectField`** — [`src/ui/primitives/forms/AppMultiSelectField.tsx`](src/ui/primitives/forms/AppMultiSelectField.tsx): MUI `Autocomplete` (`multiple`, `disableCloseOnSelect`), checkbox `renderOption`, `displayMode: 'summary' | 'chips'` (default summary), default summary formatter (`None selected` / `1 selected` / `N selected`), optional `summaryText` override, **`AppBadge`** in chips mode, `fullWidth` default, no wide demo widths.
2. **`AppFormMultiSelectField`** — [`src/ui/patterns/form/AppFormMultiSelectField.tsx`](src/ui/patterns/form/AppFormMultiSelectField.tsx): `Controller`, non-empty `required` validation for arrays, `formGridStretchOutlinedSx` when stretch.
3. Exports — [`src/ui/primitives/index.ts`](src/ui/primitives/index.ts), [`src/ui/patterns/form/index.ts`](src/ui/patterns/form/index.ts), [`src/ui/patterns/index.ts`](src/ui/patterns/index.ts).
4. Tests — [`AppMultiSelectField.test.tsx`](src/ui/primitives/forms/AppMultiSelectField.test.tsx) (+ RHF coverage).

### Out of scope (unless follow-up)

- `DynamicFormRenderer` / `FieldConfig` for `multiSelect` form fields.
- Docs in `docs/reference/forms.md` unless requested.

---

## Notable decisions

- **AppDataGrid** is filter UX, not always a submitting form; **primitives** avoid RHF unless you choose path 2.
- When path 2 is used, **`AppForm`** (or another **`ui/patterns/form`** provider) is the standard way to supply **`FormProvider`**—not ad-hoc `FormProvider` in feature code.
- **Summary-first** multi-select matches compact toolbar for spell lists and similar.
