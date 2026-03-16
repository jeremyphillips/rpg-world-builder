# Feature-First Migration Plan

**Goal:** Restructure server and client to mirror each other with feature-first architecture. Each feature owns its routes, controllers, services (server) and routes, components, forms, hooks (client).

**Structure:**
- `server/features/character` ↔ `src/features/character`
- `server/features/content/races` ↔ `src/features/content/races`
- `server/features/content/equipment` ↔ `src/features/content/equipment`
- etc.

---

## Build Order Overview

| Phase | Builds | Description |
|-------|--------|-------------|
| **A** | 1–2 | Equipment vocab relocation (client) |
| **B** | 3–4 | Server scaffolding (shared, register-routes) |
| **C** | 5–11 | Server feature migration (one feature per build) |
| **D** | 12–16 | Client route migration (optional) |

---

# Phase A: Equipment Vocab Relocation (Client)

*Can run independently. No server changes.*

---

## Build 1: Move Equipment Vocab Files

**Goal:** Relocate equipment vocab files to their domain subfolders.

| Step | Action |
|------|--------|
| 1.1 | Create `src/features/content/equipment/weapons/domain/vocab/` |
| 1.2 | Move `shared/domain/vocab/weapons.vocab.ts` → `equipment/weapons/domain/vocab/weapons.vocab.ts` |
| 1.3 | Create `src/features/content/equipment/armor/domain/vocab/` |
| 1.4 | Move `shared/domain/vocab/armor.vocab.ts` → `equipment/armor/domain/vocab/armor.vocab.ts` |
| 1.5 | Create `src/features/content/equipment/gear/domain/vocab/` |
| 1.6 | Move `shared/domain/vocab/gear.vocab.ts` → `equipment/gear/domain/vocab/gear.vocab.ts` |
| 1.7 | Create `src/features/content/equipment/magicItems/domain/vocab/` |
| 1.8 | Move `shared/domain/vocab/magicItems.vocab.ts` → `equipment/magicItems/domain/vocab/magicItems.vocab.ts` |

**Acceptance:** Files exist in new locations. Imports will be broken until Build 2.

---

## Build 2: Update Imports & Single Vocab Export

**Goal:** Fix all imports and establish single vocab export.

| Step | Action |
|------|--------|
| 2.1 | Add `src/features/content/equipment/domain/vocab/index.ts` that re-exports all equipment vocabs |
| 2.2 | Update `shared/domain/vocab/index.ts` – remove equipment exports; keep `alignment`, `magicSchools` |
| 2.3 | Update `shared/domain/types/weapon.types.ts` – import from `@/features/content/equipment/weapons/domain/vocab/weapons.vocab` |
| 2.4 | Update `shared/domain/types/armor.types.ts` – import from `@/features/content/equipment/armor/domain/vocab/armor.vocab` |
| 2.5 | Update `shared/domain/types/gear.types.ts` – import from `@/features/content/equipment/gear/domain/vocab/gear.vocab` |
| 2.6 | Update `shared/domain/types/magicItem.types.ts` – import from `@/features/content/equipment/magicItems/domain/vocab/magicItems.vocab` |
| 2.7 | Update `equipment/weapons/domain/*` – import from `../vocab/weapons.vocab` or `./vocab/weapons.vocab` |
| 2.8 | Update `equipment/armor/domain/*` – import from `../vocab/armor.vocab` |
| 2.9 | Update `equipment/gear/domain/*` – import from `../vocab/gear.vocab` |
| 2.10 | Update `equipment/magicItems/domain/*` – import from `../vocab/magicItems.vocab` |
| 2.11 | Update `content/domain/index.ts` – export from `equipment/domain/vocab` for single entry point |
| 2.12 | Update `mechanics/domain/...` – import `WeaponDamageType` from `@/features/content/equipment/weapons/domain/vocab/weapons.vocab` |
| 2.13 | Update `character/hooks/useCombatStats.ts` – import `WeaponDamageType` from weapons vocab |
| 2.14 | Update `classes/domain/...` – import `Material` from `@/features/content/equipment/armor/domain/vocab/armor.vocab` |

**Acceptance:** All imports resolve. App builds. Single vocab export works via `content/domain` or `content/equipment/domain/vocab`.

---

# Phase B: Server Scaffolding

---

## Build 3: Create Shared Structure

**Goal:** Create `server/shared/` and move cross-cutting code.

| Step | Action |
|------|--------|
| 3.1 | Create `server/shared/` directory |
| 3.2 | Move `server/middleware/` → `server/shared/middleware/` |
| 3.3 | Move `server/auth/` → `server/shared/auth/` |
| 3.4 | Move `server/models/` → `server/shared/models/` |
| 3.5 | Move `server/validators/` → `server/shared/validators/` |
| 3.6 | Move `server/errors/` → `server/shared/errors/` |
| 3.7 | Move `server/utils/` → `server/shared/utils/` |
| 3.8 | Move `server/types/` → `server/shared/types/` |
| 3.9 | Move `server/config/` → `server/shared/config/` (or keep at root – config often stays top-level) |

**Note:** Config may stay at `server/config/` – update imports in `app.ts`, `index.ts` accordingly. If moved, update all config imports.

| Step | Action |
|------|--------|
| 3.10 | Update all imports across server: `../middleware` → `../shared/middleware`, `../models` → `../shared/models`, etc. |
| 3.11 | Update `server/app.ts` to use new paths |
| 3.12 | Update `server/index.ts` to use new paths |

**Acceptance:** Server starts. All routes work. No behavior change.

---

## Build 4: Create Features Structure & register-routes

**Goal:** Create `server/features/` and `register-routes.ts` that imports from existing flat routes (no file moves yet).

| Step | Action |
|------|--------|
| 4.1 | Create `server/features/` directory |
| 4.2 | Create `server/register-routes.ts` – import from `./routes/index.ts` (or individual route files), call `registerRoutes(app)` |
| 4.3 | Update `server/app.ts` – import `registerRoutes` from `./register-routes` instead of `./routes` |
| 4.4 | Verify `register-routes.ts` re-exports the same behavior as current `routes/index.ts` |

**Acceptance:** Server starts. Routes unchanged. `register-routes.ts` is the single entry point for route registration.

---

# Phase C: Server Feature Migration

*One feature per build. Each build: create feature dir → move files → update register-routes → delete old files → verify.*

---

## Build 5: Character Feature (Server)

**Goal:** Migrate character to `server/features/character/`.

| Step | Action |
|------|--------|
| 5.1 | Create `server/features/character/routes/` |
| 5.2 | Create `server/features/character/controllers/` |
| 5.3 | Create `server/features/character/services/` |
| 5.4 | Copy `server/routes/character.routes.ts` → `server/features/character/routes/character.routes.ts` |
| 5.5 | Copy `server/controllers/character.controller.ts` → `server/features/character/controllers/character.controller.ts` |
| 5.6 | Copy `server/services/character.service.ts` → `server/features/character/services/character.service.ts` |
| 5.7 | Update imports in copied files: `../../shared/middleware`, `../../shared/auth`, `../../shared/models`, etc. |
| 5.8 | Update `register-routes.ts` – import character routes from `./features/character/routes/character.routes`, mount at `/api/characters` |
| 5.9 | Remove `server/routes/character.routes.ts`, `server/controllers/character.controller.ts`, `server/services/character.service.ts` |
| 5.10 | Verify character API works |

**Acceptance:** `/api/characters` works. Character feature is self-contained.

---

## Build 6: Auth Feature (Server)

| Step | Action |
|------|--------|
| 6.1 | Create `server/features/auth/routes/`, `controllers/`, `services/` |
| 6.2 | Move auth routes, controller, service to feature |
| 6.3 | Update imports (shared paths) |
| 6.4 | Update `register-routes.ts` – mount auth at `/api/auth` |
| 6.5 | Remove old auth files |
| 6.6 | Verify auth API works |

---

## Build 7: User Feature (Server)

| Step | Action |
|------|--------|
| 7.1 | Create `server/features/user/` with routes, controllers, services |
| 7.2 | Move user files, update imports |
| 7.3 | Update `register-routes.ts` |
| 7.4 | Remove old files, verify |

---

## Build 8: Independent Features (Server)

Migrate in any order (each is independent):

- **8a:** `upload` → `server/features/upload/`
- **8b:** `settingData` → `server/features/settingData/`
- **8c:** `notification` → `server/features/notification/`
- **8d:** `chat` → `server/features/chat/`
- **8e:** `message` → `server/features/message/`

Each: create dirs → move files → update imports → update register-routes → remove old → verify.

---

## Build 9: Campaign Feature (Server) – Core Only

**Goal:** Migrate campaign CRUD, party, members, notes, ruleset-patch, content-patch. Content sub-routes move in Build 10.

| Step | Action |
|------|--------|
| 9.1 | Create `server/features/campaign/routes/`, `controllers/`, `services/` |
| 9.2 | Create `campaign.routes.ts` – only: `/`, `/:id`, `/:id/party`, `/:id/members`, `/:id/notes`, `/:id/ruleset-patch`, `/:id/content-patch` |
| 9.3 | Move `campaign.controller.ts`, `campaign.service.ts` |
| 9.4 | Move `note.controller.ts`, `note.service.ts` – keep in campaign (notes are campaign-scoped) |
| 9.5 | Move `rulesetPatch.controller.ts`, `rulesetPatch.service.ts` |
| 9.6 | Move `contentPatch.controller.ts`, `contentPatch.service.ts` |
| 9.7 | Update all imports |
| 9.8 | Update `register-routes.ts` – mount campaign at `/api/campaigns` |
| 9.9 | Remove campaign-related routes from old `campaign.routes.ts` (keep file for now if it still has content routes, or split) |
| 9.10 | Verify campaign core API works |

**Note:** `campaignMember` has its own top-level route `/api/campaign-members`. Decide: keep as separate feature or nest under campaign. Recommendation: separate `campaign-member` feature.

---

## Build 10: Campaign Member Feature (Server)

| Step | Action |
|------|--------|
| 10.1 | Create `server/features/campaign-member/routes/`, `controllers/`, `services/` |
| 10.2 | Move `campaignMember.routes.ts`, `campaignMember.controller.ts`, `campaignMember.service.ts` |
| 10.3 | Update imports, register-routes |
| 10.4 | Remove old files, verify |

---

## Build 11: Content Features (Server) – Races, Classes, Spells, Skill Proficiencies, Equipment

**Goal:** Migrate campaign-scoped content routes to their feature dirs. Each registers at `/api/campaigns/:id/{resource}`.

| Step | Action |
|------|--------|
| 11.1 | Create `server/features/content/races/` with `routes/`, `controllers/`, `services/` |
| 11.2 | Create `race.routes.ts` – GET/POST/PATCH/DELETE for `/:id/races` (mounted so path is relative) |
| 11.3 | Move `campaignRace.controller.ts`, `campaignRace.service.ts` → `race.controller.ts`, `race.service.ts` |
| 11.4 | Update imports. Route handlers receive `req.params.id` (campaignId) from parent. |
| 11.5 | Update `register-routes.ts` – `app.use('/api/campaigns/:id/races', raceRoutes)` |
| 11.6 | Repeat for **classes** – `server/features/content/classes/` |
| 11.7 | Repeat for **spells** – `server/features/content/spells/` |
| 11.8 | Repeat for **skillProficiencies** – `server/features/content/skillProficiencies/` |
| 11.9 | Repeat for **equipment** – `server/features/content/equipment/` (weapons, armor, gear, magic-items in one routes file or split) |
| 11.10 | Remove content routes from old `campaign.routes.ts` |
| 11.11 | Delete old `campaign.routes.ts` if empty |
| 11.12 | Remove old controllers/services: campaignRace, campaignClass, campaignSpell, campaignSkillProficiency, campaignEquipment |
| 11.13 | Verify all content APIs work |

**Route path note:** When mounting `app.use('/api/campaigns/:id/races', raceRoutes)`, the race router sees path `/` (list) and `/:raceId` (detail). `req.params.id` is campaignId. Ensure controllers read `req.params.id` for campaignId.

---

## Build 12: Invite, Session, Session-Invite Features (Server)

| Step | Action |
|------|--------|
| 12.1 | Migrate `invite` → `server/features/invite/` |
| 12.2 | Migrate `session` → `server/features/session/` |
| 12.3 | Migrate `sessionInvite` → `server/features/session-invite/` |
| 12.4 | Update register-routes, remove old files, verify |

---

# Phase D: Client Route Migration (Optional)

*Move route components from `src/app/routes/` into features. App composes from features.*

---

## Build 13: Character Routes (Client)

| Step | Action |
|------|--------|
| 13.1 | Create `src/features/character/routes/` |
| 13.2 | Move `CharactersRoute.tsx`, `CharacterRoute.tsx`, `NewCharacterRoute.tsx` from `app/routes/auth/` to `character/routes/` |
| 13.3 | Create `character/routes/index.ts` – export route components |
| 13.4 | Update `app/routes/auth/index.ts` – import from `@/features/character/routes` |
| 13.5 | Verify character routes work |

---

## Build 14: Campaign Routes (Client)

| Step | Action |
|------|--------|
| 14.1 | Create `src/features/campaign/routes/` |
| 14.2 | Move `CampaignRoute`, `CampaignsRoute`, `PartyRoute`, `RulesRoute`, `SessionsRoute`, `SessionRoute`, `MessagingRoute`, `WorldLayout`, etc. from `app/routes/auth/campaign/` |
| 14.3 | Update app router imports |
| 14.4 | Verify campaign routes work |

---

## Build 15: Content Routes (Client) – Races, Classes, Spells, Equipment, Skill Proficiencies

| Step | Action |
|------|--------|
| 15.1 | Move `RaceListRoute`, `RaceDetailRoute`, `RaceCreateRoute`, `RaceEditRoute` to `content/races/routes/` |
| 15.2 | Move class routes to `content/classes/routes/` |
| 15.3 | Move spell routes to `content/spells/routes/` |
| 15.4 | Move equipment routes to `content/equipment/routes/` |
| 15.5 | Move skill proficiency routes to `content/skillProficiencies/routes/` |
| 15.6 | Update app router to import from feature routes |
| 15.7 | Verify all content routes work |

---

## Build 16: Public & Auth Layout Routes (Client)

| Step | Action |
|------|--------|
| 16.1 | Move `LoginRoute`, `RegisterRoute`, `AcceptInviteRoute` to `features/auth/routes/` |
| 16.2 | Move `DashboardRoute`, `UsersRoute`, `InviteRoute` to appropriate features |
| 16.3 | Move `AccountRoute`, `AccountSettingsRoute` to `features/account/routes/` |
| 16.4 | Keep `PublicLayout`, `AuthLayout` in `app/layouts/` (cross-cutting) |
| 16.5 | Update `app/router.tsx` to import route components from features |
| 16.6 | Remove or slim down `app/routes/` to only re-exports if needed |

---

# Final Structure

## Server

```
server/
├── app.ts
├── index.ts
├── register-routes.ts
├── shared/
│   ├── config/
│   ├── middleware/
│   ├── auth/
│   ├── models/
│   ├── validators/
│   ├── errors/
│   ├── utils/
│   └── types/
└── features/
    ├── auth/
    │   ├── routes/
    │   ├── controllers/
    │   └── services/
    ├── character/
    ├── user/
    ├── campaign/
    ├── campaign-member/
    ├── invite/
    ├── session/
    ├── session-invite/
    ├── message/
    ├── chat/
    ├── notification/
    ├── upload/
    ├── settingData/
    └── content/
        ├── races/
        ├── classes/
        ├── spells/
        ├── skillProficiencies/
        └── equipment/
```

## Client (vocab)

```
src/features/content/
├── shared/
│   └── domain/
│       └── vocab/           # alignment, magicSchools only
└── equipment/
    ├── weapons/domain/vocab/
    ├── armor/domain/vocab/
    ├── gear/domain/vocab/
    └── magicItems/domain/vocab/
```

---

# Build Dependencies

```
Build 1 (vocab move)     → none
Build 2 (vocab imports)  → Build 1
Build 3 (shared)         → none
Build 4 (register-routes)→ Build 3
Build 5 (character)      → Build 4
Build 6 (auth)           → Build 4
Build 7 (user)           → Build 4
Build 8 (independent)    → Build 4
Build 9 (campaign core)  → Build 4
Build 10 (campaign-member)→ Build 4
Build 11 (content)       → Build 9 (campaign mounts content; or register-routes mounts all)
Build 12 (invite/session) → Build 4
Build 13–16 (client)      → Build 2 (vocab done); can run in parallel with Phase C
```

**Recommended sequence:** 1 → 2 (vocab complete) → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12. Then 13–16 as desired.

---

# Risk Summary

| Phase | Risk | Notes |
|-------|------|-------|
| A (vocab) | Low | Client-only; many import updates |
| B (scaffolding) | Low | Additive; path updates |
| C (server features) | Medium | One feature at a time; verify each |
| D (client routes) | Low | Move + import updates |

---

# Checklist (Post-Migration)

- [ ] Equipment vocab in `content/equipment/{type}/domain/vocab/`
- [ ] Single vocab export via `content/domain` or `content/equipment/domain/vocab`
- [ ] Server features in `server/features/` with routes/, controllers/, services/
- [ ] `register-routes.ts` mounts all routes; no route logic in app.ts
- [ ] Shared code in `server/shared/`
- [ ] Client route components in feature `routes/` dirs (if Phase D done)
- [ ] All tests pass; manual smoke test of key flows
