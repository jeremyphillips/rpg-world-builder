# Content Routes Migration Plan

**Goal:** Migrate content routes from campaign ownership to content ownership. Content features should live under `src/features/content/{feature}/routes` (client) and `server/features/content/{feature}/` (server), with each feature owning its controllers, routes, and services.

**Related:** See [feature_first_migration.md](./feature_first_migration.md) for broader server scaffolding and Build 11/15 overlap.

---

## Current State

### Client (Frontend)

| Location | Content Types |
|----------|---------------|
| `src/features/campaign/routes/world/` | WorldLayout only (locations, monsters → content; npcs → character) |
| `src/features/content/shared/` | Shared components (ContentTypeListPage, EntryEditorLayout), hooks, domain logic |
| `src/features/content/{feature}/domain/` | Domain logic already exists for: classes, races, spells, skillProficiencies, equipment sub-types |

**Route imports:** `src/app/routes/auth/index.ts` → `@/features/campaign/routes` → `./world` and `./world/equipment`

### Server (Backend)

| Location | Content Types |
|----------|---------------|
| `server/routes/index.ts` | Content routes mounted at `/api/campaigns/:id/{resource}` |
| `server/features/content/` | classes, races, spells, skillProficiencies, equipment (controllers, routes, services) |
| `server/controllers/` | contentPatch, rulesetPatch (campaign config only) |
| `server/services/` | contentPatch, rulesetPatch |

**Content API paths (all under `/api/campaigns/:id/`):**
- `/classes`, `/races`, `/spells`, `/skill-proficiencies`
- `/equipment/weapons`, `/equipment/armor`, `/equipment/gear`, `/equipment/magic-items`

**Migrated (Locations & Monsters):**
- **Locations:** Moved to `src/features/content/locations/routes/` (LocationsRoute, LocationRoute).
- **Monsters:** Moved to `src/features/content/monsters/routes/` (MonstersRoute, MonsterRoute).

**Out of scope for this plan (future migrations):**
- **NPCs:** Migrated to `src/features/character/routes/` (NpcsRoute, NpcRoute). NPCs are characters with `type: 'npc'`.

---

## Target State

### Client

```
src/features/content/
├── shared/                    # Unchanged
│   ├── components/
│   ├── hooks/
│   └── domain/
├── classes/
│   ├── domain/                # Exists
│   └── routes/
├── races/
│   ├── domain/
│   └── routes/
├── spells/
│   ├── domain/
│   └── routes/
├── skillProficiencies/
│   ├── domain/
│   └── routes/
└── equipment/
    ├── shared/                # Only 3+ subtype or core equipment infrastructure (Implementation Constraints §3)
    ├── gear/
    │   └── domain/
    ├── weapons/
    │   └── domain/
    ├── armor/
    │   └── domain/
    ├── magicItems/
    │   └── domain/
    └── routes/               # Monolithic routes; uses shared/ for common patterns
        ├── EquipmentHubRoute.tsx
        ├── WeaponsListRoute.tsx
        ├── WeaponDetailRoute.tsx
        ├── ... (armor, gear, magic-items)
        └── index.ts
```

**World:** Not first class. `WorldLayout` is UI presentation only — a shell that composes content routes. Lives in campaign as the campaign "world" tab layout.

### Server

```
server/features/content/
├── classes/
│   ├── controllers/classes.controller.ts
│   ├── routes/classes.routes.ts
│   └── services/classes.service.ts
├── races/
│   ├── controllers/races.controller.ts
│   ├── routes/races.routes.ts
│   └── services/races.service.ts
├── spells/
│   ├── controllers/spells.controller.ts
│   ├── routes/spells.routes.ts
│   └── services/spells.service.ts
├── skillProficiencies/
│   ├── controllers/skillProficiencies.controller.ts
│   ├── routes/skillProficiencies.routes.ts
│   └── services/skillProficiencies.service.ts
└── equipment/
    ├── shared/               # Only 3+ subtype or core equipment infrastructure (Implementation Constraints §3)
    ├── controllers/equipment.controller.ts
    ├── routes/equipment.routes.ts
    └── services/equipment.service.ts
```

**Route mounting:** Campaign router handles only campaign-specific routes (CRUD, party, members, notes, ruleset-patch, content-patch). Content features mount directly in `register-routes.ts`:

```ts
// register-routes.ts
app.use('/api/campaigns', campaignRouter)   // campaign-specific only
app.use('/api/campaigns/:id/classes', classesRoutes)
app.use('/api/campaigns/:id/races', racesRoutes)
app.use('/api/campaigns/:id/spells', spellsRoutes)
app.use('/api/campaigns/:id/skill-proficiencies', skillProficienciesRoutes)
app.use('/api/campaigns/:id/equipment', equipmentRouter)  // equipmentRouter defines /weapons, /armor, etc.
```

---

## Migration Phases

### Phase 1: Server Content Features (One feature per build)

Migrate in dependency order. Each build: create dirs → move files → update imports → update register-routes → remove from campaign.routes → verify.

| Build | Feature | Steps |
|-------|---------|-------|
| **1.1** | Classes | Create `server/features/content/classes/`. Move controller, service. Create `classes.routes.ts`. Mount at `/api/campaigns/:id/classes`. Remove from campaign.routes. |
| **1.2** | Races | Same pattern |
| **1.3** | Spells | Same pattern |
| **1.4** | Skill Proficiencies | Same pattern |
| **1.5** | Equipment | Move `campaignEquipment.controller.ts` → `equipment.controller.ts`. Create `equipment.routes.ts` with weapons, armor, gear, magic-items. Mount at `/api/campaigns/:id/equipment` (or split mounts). |

**Route path note:** When mounting `app.use('/api/campaigns/:id/classes', classesRoutes)`, the classes router defines `GET /`, `GET /:classId`, `POST /`, etc. `req.params.id` is campaignId. Controllers must read `req.params.id` for campaignId.

**Campaign-scoped middleware:** Before or during Build 1.1, ensure a shared campaign-scoped middleware stack exists and is applied to all content routes. Do not lose `requireAuth`, campaign context loading, or viewer access checks (Implementation Constraints §2).

### Phase 2: Client Content Routes

| Build | Feature | Steps |
|-------|---------|-------|
| **2.1** | Classes | Create `src/features/content/classes/routes/`. Move ClassListRoute, ClassDetailRoute, ClassCreateRoute, ClassEditRoute. Create index.ts. Update campaign routes index to re-export from content. |
| **2.2** | Races | Same pattern |
| **2.3** | Spells | Same pattern |
| **2.4** | Skill Proficiencies | Same pattern |
| **2.5** | Equipment | Create `src/features/content/equipment/routes/` + `equipment/shared/`. Move routes. Add thin wrappers in shared/ for split-ready structure. Create index.ts. |

**Migrated:** Locations, monsters → content; NPCs → `src/features/character/routes/` (NpcsRoute, NpcRoute).

### Phase 3: Cleanup

| Build | Action |
|-------|--------|
| **3.1** | Remove `src/features/campaign/routes/world/` for migrated features (classes, races, spells, skillProficiencies, equipment) |
| **3.2** | Update `src/features/campaign/routes/index.ts` — remove content exports; import from `@/features/content/*/routes` |
| **3.3** | Update `src/app/routes/auth/index.ts` — import content routes from content features instead of campaign |
| **3.4** | Keep `WorldLayout` in campaign — UI presentation only, not first class |

---

## Decisions (Locked)

| Topic | Decision |
|-------|----------|
| **Equipment** | Monolithic to start. Hierarchy: equipment > gear, weapons, armor, magicItems. Add equipment/shared/ with thin wrappers for future split. |
| **Campaign router** | Only campaign-specific routes. Content mounts directly in register-routes. |
| **Locations, Monsters** | Migrated to `src/features/content/locations/routes/` and `src/features/content/monsters/routes/`. |
| **NPCs** | Migrated to `src/features/character/routes/` (NpcsRoute, NpcRoute). |
| **World** | Not first class. UI presentation only. WorldLayout is a shell in campaign. |
| **contentPatch, rulesetPatch** | Stay in campaign feature (campaign configuration). |

---

## Remaining Concerns

### 1. Equipment shared/ — What Goes In?

See **Implementation Constraints §3**. `equipment/shared` must contain only concerns shared across 3+ subtypes or core equipment infrastructure. Do not use it as a dumping ground. Route-surface logic stays in `equipment/routes`; subtype-specific logic stays in subtype folders.

### 2. NPC Route Move — When?

Defer to follow-up PR. Keep this plan focused on content. NPC move is a small, independent change.

### 3. Express Route Order

Verify registration order in register-routes so `/api/campaigns/123/classes` hits classes, not campaign. Longer paths should be registered so they match before campaign's `/:id`. See **Implementation Constraints §2** for campaign-scoped middleware requirements.

### 4. Import Path Updates

Content routes import from @/features/campaign/hooks. After move, update imports. No circular dependency if campaign does not import content routes.

---

## Implementation Constraints

Use these rules as implementation constraints while executing the migration. They ensure philosophical consistency, prevent route ownership drift, and preserve campaign-scoped behavior.

### 1. Pluralization Convention

Use a consistent pluralization convention across migrated content features. Do not mix singular and plural arbitrarily.

**Chosen convention (plural feature names):** `classes`, `races`, `spells`, `skillProficiencies`

**Requirements:**
- Do not mix singular and plural feature folders arbitrarily.
- Match the chosen convention across:
  - client feature folders
  - server feature folders
  - route/controller/service filenames where practical
- If existing non-content features use a different convention, do not perform a broad unrelated rename. Make content migration internally consistent and note any larger convention mismatch as follow-up.

### 2. Server Route Mounting — Campaign-Scoped Behavior Preserved

Content features may be mounted directly in `register-routes.ts`, but campaign-scoped behavior must remain consistent.

**Important:** Do NOT lose campaign-scoped middleware, auth, access checks, or context loading that previously came from nesting under `campaignRouter`.

**Action:** Introduce or reuse a shared campaign-scoped middleware stack/helper so all content routers mounted under `/api/campaigns/:id/...` receive the same required setup.

**Must remain intact:**
- `requireAuth`
- campaign existence/context loading
- viewer membership/access checks
- request typing/param normalization related to campaign context

**Central rule:** Route ownership moves to content; campaign-scoped request enforcement must still be shared and consistent.

### 3. Equipment Ownership Boundaries

| Location | Owns | Does NOT own |
|---------|------|--------------|
| `equipment/routes` | Route components, route handlers, route registration surfaces. May compose subtype logic. | Subtype domain behavior |
| Subtype folders (`weapons`, `armor`, `gear`, `magicItems`) | Subtype-specific domain logic, mappers, configs, helpers, validation | Route surfaces; cross-equipment concerns |
| `equipment/shared` | Only concerns shared across 3+ equipment subtypes or core equipment infrastructure | Convenience code, leftovers, subtype-specific logic |

**Rules:**
- Logic specific to one subtype → keep in that subtype.
- Logic that is route-surface specific → keep in `equipment/routes`.
- Logic genuinely shared across equipment as a family → put in `equipment/shared`.
- Do NOT make `equipment/shared` a dumping ground.

### 4. Ownership Model (Source of Truth)

| Owner | Owns | Does NOT own |
|-------|------|--------------|
| `campaign` | Campaign context, layout, campaign-specific workflows (members, messaging, sessions, notes) | Catalog-managed content simply because URL is nested under campaign |
| `content/*` | Catalog-managed content screens and APIs (classes, races, spells, skill proficiencies, equipment) | Campaign shell; character domain |
| `world` | Nothing as domain owner | Feature logic ownership — UI/navigation presentation only |
| `character` | PCs and NPCs | Content catalog |
| `content/shared` | Cross-content infrastructure (layout, components, hooks, access logic, patterns) | Feature-specific logic merely for migration convenience |

### 5. Migration Behavior

- Preserve runtime behavior.
- Preserve URLs unless explicitly changing them is part of the plan.
- Prefer thin route re-exports/adapters temporarily if that reduces risk during file moves.
- Avoid opportunistic unrelated cleanup unless it directly supports the migration boundaries above.

### 6. Report Back (Post-Migration)

When the migration is done, report explicitly:

1. **Pluralization convention used** — e.g. `classes`, `races`, `spells`, `skillProficiencies`
2. **Campaign-scoped middleware/context** — How it was preserved for server-mounted content routes (middleware stack, helper, etc.)
3. **`equipment/routes`** — What remained (route surfaces, handlers, composition)
4. **Subtype folders** — What remained (domain logic, mappers, configs, validation)
5. **`equipment/shared`** — What was placed there and why (only 3+ subtype or core infrastructure)
6. **Ambiguous ownership** — Any places where ownership was unclear and how it was resolved using the rules above

---

## Build Order Summary

```
Phase 1 (Server):
  1.1 classes → 1.2 races → 1.3 spells → 1.4 skillProficiencies → 1.5 equipment

Phase 2 (Client):
  2.1 classes → 2.2 races → 2.3 spells → 2.4 skillProficiencies → 2.5 equipment

Phase 3 (Cleanup):
  3.1 Remove campaign/routes/world/{feature}
  3.2 Update campaign routes index
  3.3 Update auth routes index
  3.4 Verify WorldLayout still works
```

---

## Checklist (Post-Migration)

- [x] Server: `server/features/content/{feature}/` exists for classes, races, spells, skillProficiencies, equipment
- [x] Server: Each feature has `controllers/{feature}.controller.ts`, `routes/{feature}.routes.ts`, `services/{feature}.service.ts`
- [x] Server: `routes/index.ts` mounts content routes at `/api/campaigns/:id/{resource}` (before campaign router)
- [x] Server: Campaign-scoped middleware (requireAuth + requireCampaignRole('observer')) applied to all content routes
- [x] Server: `campaign.routes.ts` no longer contains content CRUD routes
- [x] Client: `src/features/content/{feature}/routes/` exists for each migrated feature
- [x] Client: `campaign/routes/index.ts` no longer exports content; `auth/index.ts` imports directly from `@/features/content/*/routes`
- [x] Client: `campaign/routes/world/` removed for migrated features (classes, races, spells, skillProficiencies, equipment, locations, monsters)
- [x] Equipment: Ownership boundaries respected (routes vs subtype vs shared — see Implementation Constraints §3)
- [ ] All content routes work; manual smoke test of list/detail/create/edit flows
- [x] Report back completed (Implementation Constraints §6)

---

## Phase 2 Report Back (Client Migration Complete)

1. **Pluralization convention used** — `classes`, `races`, `spells`, `skillProficiencies`, `equipment` (plural feature folders and route names).

2. **Campaign-scoped middleware/context** — N/A for Phase 2 (client only). Server Phase 1 not yet executed.

3. **`equipment/routes`** — Route components for hub, list/detail/create/edit for weapons, armor, gear, magic-items. Uses `@/features/content/domain/repo` and subtype domains (weapons, armor, gear, magicItems).

4. **Subtype folders** — Domain logic remains in `equipment/weapons/domain`, `equipment/armor/domain`, `equipment/gear/domain`, `equipment/magicItems/domain` (repos, validation, forms, list configs).

5. **`equipment/shared`** — Exists with `campaignEquipmentApi.ts`; no new items added. Route-surface logic stays in `equipment/routes`.

6. **Ambiguous ownership** — None. Routes own route components; domain owns repos/validation/forms; campaign owns WorldLayout shell.

---

## Phase 1 Report Back (Server Migration Complete)

1. **Pluralization convention used** — `classes`, `races`, `spells`, `skillProficiencies`, `equipment` (plural feature folders).

2. **Campaign-scoped middleware/context** — Content routes mounted with `requireAuth` and `requireCampaignRole('observer')` before each content router. Write operations use `requireCampaignOwner()` in the route handlers. `req.viewerContext` is set by `requireCampaignRole` for `canViewContent` checks in controllers.

3. **Route mounting order** — Content routes (`/api/campaigns/:id/classes`, etc.) are registered *before* the campaign router (`/api/campaigns`) so the more specific paths match first.

4. **Legacy cleanup** — Removed `server/controllers/campaignClass.controller.ts`, `campaignRace.controller.ts`, `campaignSpell.controller.ts`, `campaignSkillProficiency.controller.ts`, `campaignEquipment.controller.ts` and their corresponding services. Models remain in `server/shared/models/`.

---

## Phase 4 Report Back (Locations & Monsters Migration)

1. **Locations** — Moved to `src/features/content/locations/routes/`:
   - `LocationsRoute.tsx` — list view using `@/data/locations`, `FilterableCardGroup`, `LocationHorizontalCard`, `getLegacyType`/`sortLocations`/`getIndentLevel` from `@/features/location/location.helpers`
   - `LocationRoute.tsx` — detail view using `@/data/locations` for lookup, `resolveImageUrl` for images, `getLegacyType` for type display, editable fields with `apiUpdateLocation` (setting-data API)

2. **Monsters** — Moved to `src/features/content/monsters/routes/`:
   - `MonstersRoute.tsx` — list view using `@/data/monsters`, `MonsterMediaTopCard`
   - `MonsterRoute.tsx` — detail view using `MonsterView`, `@/data/monsters` for lookup

3. **Exports** — `auth/index.ts` imports `LocationsRoute`, `LocationRoute` from `@/features/content/locations/routes` and `MonstersRoute`, `MonsterRoute` from `@/features/content/monsters/routes`. Campaign routes index and world index no longer export these.

4. **Removed** — Deleted `src/features/campaign/routes/world/locations/` and `src/features/campaign/routes/world/monsters/`.

---

## Phase 5 Report Back (NPCs Migration)

1. **NPCs** — Moved to `src/features/character/routes/`:
   - `NpcsRoute.tsx` — list view with `CharacterBuilderLauncher` (Create NPC), `NpcGallerySection`
   - `NpcRoute.tsx` — detail view using `useCharacter`, `useCharacterForm`, `useCharacterActions`, `CharacterView`

2. **Exports** — `auth/index.ts` imports `NpcsRoute`, `NpcRoute` from `@/features/character/routes`. Campaign routes index and world index no longer export these.

3. **Removed** — Deleted `src/features/campaign/routes/world/npcs/`.
