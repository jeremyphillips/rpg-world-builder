# Locations reference (index)

This folder holds **topic-focused** docs that complement the top-level reference files in `docs/reference/`.

| Document | Purpose |
|----------|---------|
| [**domain.md**](./domain.md) | **Domain map:** where code lives (`shared/domain/locations`, `shared/domain/grid`, feature layout), mental model (location / map / transition), validation boundaries. **Canonical** body for the locations domain. |
| [**location-map-schema-relations.md**](./location-map-schema-relations.md) | **Schema relations:** `CampaignLocation` (`buildingMeta` / `buildingStructure`), maps, transitions; authoritative sources; one-building-one-placement invariant. |
| [**location-workspace.md**](./location-workspace.md) | **Editor shell:** full-width workspace, `LocationGridAuthoringSection`, toolbar modes, rail, zoom/pan, select-mode behavior. |

## Topic docs (avoid duplicating the two above)

| Document | Purpose |
|----------|---------|
| [**placed-objects-flow.md**](./placed-objects-flow.md) | **End-to-end placed objects:** registry → manifest → URLs → persistence → `deriveLocationMapAuthoredObjectRenderItems` → `resolvePlacedObjectCellVisual` → authoring + combat rendering. **§9** links future follow-ups for building form / map footprint to the [building form map variants plan](../../../.cursor/plans/building_form_map_variants_b471881f.plan.md). |

**Assets / pipeline (commands, manifests, artist checklist):** [`assets/system/locations/objects/README.md`](../../assets/system/locations/objects/README.md) — canonical for **generated** JSON and `npm run validate:location-objects`.

**Sprite migration narrative (phases):** [.cursor/plans/sprite_placed_objects_migration_a4f3eeec.plan.md](../../../.cursor/plans/sprite_placed_objects_migration_a4f3eeec.plan.md).
