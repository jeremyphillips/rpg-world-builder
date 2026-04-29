# Catalog disallow pipeline (updated)

## Answer: `filterAllowedIds` after this change

**No — not “everywhere”** if you also **enforce policy at the API**.

| Layer | Role |
|--------|------|
| **`buildCampaignCatalog`** | Produces **allowed-only** `*ById` maps (merge + `getAllowedSet`). Pickers/options built from `catalog.classesById` etc. do **not** need `filterAllowedIds` for those options. |
| **Entity fields** (e.g. `spell.classes: string[]`) | Can still contain **stale ids** after policy changes unless the **API** strips them on read/write. |
| **`filterAllowedIds` on the client** | Becomes **optional defense-in-depth** once API returns normalized payloads. |

**User preference:** **filter from the API, not the client.**

Add to the work (separate from or alongside the buildCatalog skill-proficiency wiring):

1. **Write path:** On create/update of spells (and any other content carrying id arrays tied to rules), **intersect** submitted ids with the campaign-allowed allowed set (same semantics as `getAllowedSet` / merged catalog for that category). Reject or strip; persist only allowed ids.
2. **Read path (optional but recommended):** When loading an entry for a campaign, **normalize** stored id arrays against the current catalog so responses never include disallowed ids (or return a single “sanitized” view used by the app).
3. **Then** remove or simplify client `filterAllowedIds` in list columns / form parse — only where the API guarantees normalized data.

**Implementation note:** Centralize “allowed ids for category X in campaign Y” in one server-side helper (could call into `buildCampaignCatalog` + `Object.keys(catalog.classesById)` or reuse `getAllowedSet` with the same inputs the catalog uses) so policy is not duplicated as ad-hoc `filterAllowedIds` in the browser.

---

## Original scope (buildCatalog)

1. Add **skill proficiencies** to `CATALOG_CATEGORY_CONFIG` in [packages/mechanics/src/rulesets/campaign/buildCatalog.ts](packages/mechanics/src/rulesets/campaign/buildCatalog.ts) so `RulesetContent.skillProficiencies` is applied (same pipeline as classes/spells).
2. Extend `CampaignCatalog` / `CampaignCatalogAdmin` for skill proficiencies (admin `*AllById` / `*AllowedIds` as needed).
3. Remove the bypass that assigns `skillProficienciesById` from system only.
4. Tests for `buildCampaignCatalog` + skill proficiencies policy.
5. Downstream: any UI that assumed unfiltered skill proficiencies from catalog.

---

## Todos (merged)

- [x] skill proficiencies in `CATALOG_CATEGORY_CONFIG` + admin fields + remove bypass
- [x] **API:** validate/sanitize spell `classes` on create/update + list/get via `resolveCampaignCatalogForCampaign` + `filterAllowedIds`
- [ ] **Client:** drop redundant `filterAllowedIds` where API guarantees clean data (optional follow-up)
- [x] **Tests:** `buildCampaignCatalog.test.ts` (skill proficiencies); spell service uses same catalog semantics
