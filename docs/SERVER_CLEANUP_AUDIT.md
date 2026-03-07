# Server Cleanup Audit

**Date:** March 2025  
**Scope:** Server codebase audit with Character feature as primary reference  
**Goal:** Produce a phased cleanup roadmap without performing large refactors yet.

---

## 1. Summary of Current Server Architecture Patterns

### Character Feature (Reference Model)

The Character domain has been refactored and represents the target pattern:

| Layer | Pattern | Location |
|-------|---------|----------|
| **Read Model** | DTOs, mappers, reference loaders | `src/features/character/read-model/` |
| **Reference Loading** | `loadCharacterReadReferences()` – batch fetch, typed maps | `character-read.refs.ts` |
| **DTO Mapping** | `toCharacterCardSummary`, `toCharacterDetailDto`, `toCharacterClassSummary` | `character-read.mappers.ts` |
| **Service** | Data access + orchestration; delegates mapping to read-model | `character.service.ts` |
| **Controller** | Thin for read endpoints; mixed for write endpoints | `character.controller.ts` |

**Character read flow (ideal):**
1. Controller extracts params/auth → calls service
2. Service fetches raw data, calls `loadCharacterReadReferences()`, passes refs to mappers
3. Mappers produce typed DTOs
4. Controller returns `res.json({ ... })`

### Other Features (Mixed Patterns)

| Feature | Controller Style | Service Style | Data Access | Response Shaping |
|---------|------------------|---------------|-------------|------------------|
| **Campaign** | Thin for CRUD; thick for `getCampaign` (visibility logic) | Mixed; `normalizeCampaign` in service | Direct DB in service | Service normalizes; controller augments |
| **Campaign Member** | Thick – DB access, permission logic, notification orchestration | Queries + commands; `hydrateMemberViews` pattern | **Controller** accesses `db().collection('characters')` | Controller + service both shape |
| **Campaign Skill Proficiency** | Thin – delegates to service | Validation in service; returns typed result | Mongoose model | Service returns DTOs |
| **Campaign Race** | Thin | Similar to skill proficiency | Mongoose model | Service returns DTOs |
| **Session** | Medium – `normalizeSession` in controller; visibility filtering in controller | Queries; no read-model | Service returns raw docs | Controller normalizes |
| **Invite** | Thick – DB access for enrichment | Partial – `getInviteById` in service | **Controller** accesses campaigns, users | Controller enriches response |
| **Auth** | Thick – DB access, token logic | Mixed | **Controller** accesses campaigns, members, characters | Controller shapes |

### Shared Infrastructure

- **Error handling:** Single `errorHandler` middleware; catches unhandled errors, returns 500
- **Auth:** `requireAuth`, `requireRole`, `requireCampaignRole` middleware; `resolveCampaignViewerContext` for campaign-scoped identity
- **Image URLs:** `getPublicUrl()` in `image.service.ts` – used by services and mappers
- **Capabilities:** `shared/domain/capabilities.ts` – `canViewContent`, `canViewSession`, etc. (pure functions)

---

## 2. Inconsistencies Discovered

### 2.1 Controllers

| Issue | Location | Severity |
|-------|----------|----------|
| **Direct DB access** | `character.controller` (createCharacter: campaigns, users, campaignMembers), `campaign.controller` (preCheckMember, addMember: users, campaignMembers), `invite.controller` (campaigns, users, characters), `auth.controller` (campaigns, inviteTokens, users, campaignMembers, characters), `campaignMember.controller` (characters) | High |
| **Business logic in controller** | `character.controller`: updateCharacter field-whitelist logic, deleteCharacter membership loop + notifications; `campaign.controller`: preCheckMember flow, addMember invite-or-create flow | High |
| **Permission logic in controller** | `character.controller`: `resolveCharacterAccess`; `campaignMember.controller`: owner checks, status validation | Medium |
| **Response shaping in controller** | `session.controller`: `normalizeSession`; `invite.controller`: enrich invite with campaign/inviter; `campaign.controller`: getCampaign augments raw with viewer/members | Medium |
| **Inconsistent error handling** | Some use try/catch + 500; others return early with 404/403; no unified error response shape | Medium |

### 2.2 Services

| Issue | Location | Severity |
|-------|----------|----------|
| **Mixed read/write** | Most services combine queries and commands in same file | Low (acceptable for current scale) |
| **Inconsistent return shapes** | `campaignSkillProficiency.create` returns `{ errors }` or `{ skillProficiency }`; others return raw docs or null | Medium |
| **Validation location** | `campaignSkillProficiency` validates in service; `character.controller` validates in controller | Medium |
| **Duplicate function names** | `campaignMember.service`: `getCampaignMemberByCharacter` (findOne) and `getCampaignMembersByCharacter` (find) – overloaded semantics | Low |

### 2.3 Data Access

| Issue | Location | Severity |
|-------|----------|----------|
| **No repository layer** | All services call `db().collection()` or Mongoose models directly | Low (acceptable) |
| **Repeated patterns** | ObjectId conversion, `findOne`/`find` patterns repeated across services | Low |
| **Inconsistent normalization** | `normalizeCharacter`, `normalizeCampaign` in services; `normalizeSession` in controller | Medium |

### 2.4 Read Models / DTOs

| Issue | Location | Severity |
|-------|----------|----------|
| **Character has read-model; others don't** | Campaign, Session, Invite, CampaignMember return raw or ad hoc shaped data | High |
| **Ad hoc reference lookups** | `invite.controller` fetches campaign + user for display; `campaignMember.controller` fetches character for notifications; `character.controller` fetches user for ownerName | High |
| **No shared IdNameSummary pattern** | Character uses it; others build `{ id, name }` inline | Low |

### 2.5 Validation and Policy Logic

| Issue | Location | Severity |
|-------|----------|----------|
| **Validation scattered** | Controller: `!name`, `!email`; Service: `campaignSkillProficiency.validateInput`; No shared validation module | Medium |
| **Permission logic duplicated** | `resolveCharacterAccess` in controller; `resolveCampaignViewerContext` in auth; `canViewContent` in shared | Medium |
| **Policy checks inline** | `campaign.controller.getCampaign`: visibility filtering in controller; `session.controller`: `canViewSession` in controller | Medium |

### 2.6 Shared Utilities

| Issue | Location | Severity |
|-------|----------|----------|
| **Repeated ObjectId usage** | `new mongoose.Types.ObjectId(id)` everywhere | Low |
| **Repeated db() pattern** | `mongoose.connection.useDb(env.DB_NAME)` in many files | Low |
| **Image URL resolution** | `getPublicUrl` used correctly; no duplication | Good |
| **Map-building for joins** | `hydrateMemberViews`, character refs – similar pattern, different implementations | Low |

### 2.7 Error Handling

| Issue | Location | Severity |
|-------|----------|----------|
| **No structured error types** | All errors become 500 or ad hoc 400/403/404 | Medium |
| **Inconsistent error response shape** | `{ error: string }` vs `{ errors: ValidationError[] }` | Low |
| **Unhandled promise rejections** | Some endpoints lack try/catch; rely on global handler | Medium |

---

## 3. Recommended Architecture

### 3.1 Controller Responsibilities

- Read `req.params`, `req.query`, `req.body`, `req.userId`, `req.viewerContext`
- Call a single service method (or a small, cohesive set)
- Map service result to HTTP response
- Map known errors to appropriate status codes
- **Do NOT:** Access DB, perform business logic, resolve references, shape DTOs beyond simple wrapping

### 3.2 Service Responsibilities

- **Query services:** Fetch data, optionally use read-model helpers, return DTOs
- **Command services:** Validate input, perform writes, optionally trigger side effects (notifications)
- **Orchestration:** Compose multiple data sources; delegate to read-model for mapping
- **Do NOT:** Depend on `Request`/`Response`; keep framework-agnostic

### 3.3 Read-Model Pattern (Expand from Character)

For any feature returning display-ready data with resolved references:

1. **Types:** DTO types, `XxxReadSource`, `XxxReadReferences`
2. **Reference loader:** `loadXxxReadReferences(characters/sources)` – batch fetch, return typed maps
3. **Mappers:** `toXxxSummary(doc, refs, ...)` – pure functions
4. **Service:** Fetches raw data, calls loader, calls mapper, returns DTO

### 3.4 Validation

- **Input validation:** In service or dedicated validator module; return `{ ok, data }` or `{ errors }`
- **Policy checks:** Use `resolveCampaignViewerContext`, `canViewContent`, etc.; keep in service or middleware

### 3.5 Error Handling

- Introduce `AppError` or similar with `statusCode` and `message`
- Controllers catch and map to response
- Optional: `asyncHandler` wrapper to reduce try/catch boilerplate

---

## 4. Phased Cleanup Plan

### Phase 1 – Character Feature Cleanup

**Goal:** Finalize Character as the canonical pattern; fix remaining controller bloat.

| Step | Description | Risk | Effort |
|------|--------------|------|--------|
| 1.1 | Move `resolveCharacterAccess` from controller to `character.service` or `auth/` | Low | Small |
| 1.2 | Move `getCharacter` ownerName lookup to service (batch with other user fetches if needed) | Low | Small |
| 1.3 | Extract `createCharacter` campaign-link + notification logic to `character.service` or `campaignMember.service` | Medium | Medium |
| 1.4 | Extract `updateCharacter` field-whitelist + level-up-cancel notification to service | Medium | Medium |
| 1.5 | Extract `deleteCharacter` membership loop + notifications to service | Medium | Medium |
| 1.6 | Remove direct DB access from character controller | Low | Small (after 1.1–1.5) |

**Outcome:** Character controller becomes thin; all logic in services.

---

### Phase 2 – Shared Server Foundations

**Goal:** Establish conventions and utilities used across features.

| Step | Description | Risk | Effort |
|------|--------------|------|--------|
| 2.1 | Add `server/utils/db.ts`: `getDb()`, `toObjectId(id)` helpers | Low | Small |
| 2.2 | Define `ApiError` class with `statusCode`, `message`; use in 2–3 controllers as pilot | Low | Small |
| 2.3 | Add `asyncHandler(fn)` to wrap async route handlers and forward errors | Low | Small |
| 2.4 | Document request typing: `req.userId!`, `req.viewerContext!` – ensure consistent use | Low | Small |
| 2.5 | Create `server/validators/` with `validateRequired`, `validateOneOf` – use in 1–2 endpoints | Low | Small |

**Outcome:** Consistent DB access, error handling, and validation patterns.

---

### Phase 3 – Feature Slice Refactors

**Goal:** Apply Character-style patterns to Campaign, CampaignMember, Session, Invite.

| Step | Description | Risk | Effort |
|------|--------------|------|--------|
| 3.1 | **Campaign:** Move `getCampaign` visibility filtering + member hydration to service; controller only returns | Medium | Medium |
| 3.2 | **Campaign:** Move `preCheckMember`, `addMember` DB access and logic to `campaignMember.service` or new `invite.service` helpers | Medium | Medium |
| 3.3 | **Campaign Member:** Move character fetch, notification orchestration from controller to service | Low | Medium |
| 3.4 | **Invite:** Move campaign + user enrichment to `invite.service`; return enriched DTO from service | Low | Small |
| 3.5 | **Session:** Add `session-read.model` with `toSessionSummary`; move `normalizeSession` to mapper; move visibility filtering to service | Medium | Medium |
| 3.6 | **Auth:** Move DB access from `register`/invite-accept flow to services | Medium | Medium |

**Outcome:** Controllers thin; services own data access and orchestration; read-model pattern where beneficial.

---

### Phase 4 – Long-Term Improvements

**Goal:** Only if justified by scale or complexity.

| Step | Description | Risk | Effort |
|------|--------------|------|--------|
| 4.1 | **Repository layer:** Extract `characterRepository.findByUser`, etc., if query patterns grow | Medium | Large |
| 4.2 | **Query vs command separation:** Split services into `characterQuery.service` and `characterCommand.service` if files become large | Low | Medium |
| 4.3 | **Response type safety:** Typed `res.json()` wrappers or response DTOs for OpenAPI generation | Low | Medium |

**Outcome:** Clearer boundaries if the codebase grows significantly.

---

## 5. Good Patterns to Reuse

| Pattern | Location | Reuse In |
|---------|----------|----------|
| Read-model with refs + mappers | `character-read.refs.ts`, `character-read.mappers.ts` | Campaign party, Session list, Invite list |
| Batch reference loading | `loadCharacterReadReferences` | Any feature needing ID→name resolution |
| `hydrateMemberViews`-style join | `campaignMember.service` | Similar multi-collection joins |
| `requireCampaignRole` + `viewerContext` | `middleware/requireCampaignRole.ts` | Campaign-scoped endpoints |
| `canViewContent` policy | `shared/domain/capabilities.ts` | Content visibility |
| Validation returning `{ errors }` | `campaignSkillProficiency.service` | Create/update endpoints |
| Thin controller + service call | `campaignSkillProficiency.controller`, `campaignRace.controller` | New endpoints |

---

## 6. Risk Summary by Phase

| Phase | Overall Risk | Notes |
|-------|--------------|-------|
| Phase 1 | Low–Medium | Character is already well-structured; moves are localized |
| Phase 2 | Low | Additive; no breaking changes |
| Phase 3 | Medium | Touches multiple features; test coverage important |
| Phase 4 | Low | Optional; defer until needed |

---

## 7. Build Steps to Ideal State

Concrete build steps, ordered by dependency. Each step is a single commit/session.

### Build 1: Shared Foundations (No Feature Changes)

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **1.1** | Add `server/utils/db.ts`: `getDb()`, `toObjectId(id)` | `server/utils/db.ts` | Existing code unchanged; utils available for future use |
| **1.2** | Add `server/errors/ApiError.ts`: class with `statusCode`, `message`, `toJson()` | `server/errors/ApiError.ts` | Can throw/catch; `errorHandler` maps to response |
| **1.3** | Add `asyncHandler(fn)` in `server/middleware/asyncHandler.ts` | `server/middleware/asyncHandler.ts` | Wraps async route; forwards errors to `errorHandler` |
| **1.4** | Add `server/validators/common.ts`: `validateRequired`, `validateOneOf` | `server/validators/common.ts` | Pure functions; used in 1 endpoint as pilot |

**Outcome:** Shared utilities exist; no behavior change. Optional: migrate 1–2 routes to `asyncHandler` as pilot.

---

### Build 2: Character Access & Policy

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **2.1** | Move `resolveCharacterAccess` to `server/auth/resolveCharacterAccess.ts` | `server/auth/`, `character.controller` | Controller imports from auth; logic unchanged |
| **2.2** | Add `character.service.getCharacterWithContext(characterId, userId, userRole)` – returns `{ character, campaigns, isOwner, isAdmin, pendingMemberships, ownerName }`; fetches ownerName in service | `character.service`, `character.controller` | Controller calls single service; no DB in controller for getCharacter |

**Outcome:** `getCharacter` controller is thin; access resolution and owner lookup in service/auth.

---

### Build 3: Character Create – Campaign Link

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **3.1** | Add `character.service.createCharacterWithCampaignLink(userId, data)` – wraps createCharacter; if `campaignId` in data, calls campaignMember service to link + create notifications | `character.service`, `campaignMember.service`, `character.controller` | Controller passes body; service handles campaign link + notifications |
| **3.2** | Remove DB access and notification logic from `createCharacter` controller | `character.controller` | Controller: validate name, call service, `res.status(201).json({ character })` |

**Outcome:** `createCharacter` controller is thin; all orchestration in service.

---

### Build 4: Character Update – Field Whitelist & Notifications

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **4.1** | Add `character.service.updateCharacterWithPolicy(characterId, userId, userRole, body)` – resolves access, applies field whitelist for non-admins, detects level-up cancel, calls notification if needed, calls updateCharacter | `character.service`, `character.controller` | Controller passes body; service owns policy + notifications |
| **4.2** | Simplify `updateCharacter` controller to: get access (or delegate to service), call `updateCharacterWithPolicy`, return result | `character.controller` | No DB, no business logic in controller |

**Outcome:** `updateCharacter` controller is thin.

---

### Build 5: Character Delete – Membership & Notifications

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **5.1** | Add `character.service.deleteCharacterWithMemberships(characterId, userId)` – fetches memberships, hard/soft delete, updates member statuses, sends notifications | `character.service`, `character.controller` | Controller calls single service |
| **5.2** | Simplify `deleteCharacter` controller to: resolve access, call `deleteCharacterWithMemberships`, return | `character.controller` | No DB, no loop in controller |

**Outcome:** `deleteCharacter` controller is thin. Character feature fully aligned with ideal.

---

### Build 6: Campaign Member – Service Owns Data

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **6.1** | Add `campaignMember.service.approveMemberWithNotifications(memberId, userId)` – fetches member, campaign, character; approves; sends notifications; returns updated member | `campaignMember.service`, `campaignMember.controller` | Controller calls service; no DB in controller |
| **6.2** | Add `campaignMember.service.rejectMemberWithNotifications(memberId, userId)` – same pattern | `campaignMember.service`, `campaignMember.controller` | |
| **6.3** | Add `campaignMember.service.updateCharacterStatusWithNotifications(memberId, userId, characterStatus)` – validates, updates, notifies party | `campaignMember.service`, `campaignMember.controller` | |
| **6.4** | Rename `getCampaignMemberByCharacter` → `getCampaignMemberByCharacterId` (findOne) to disambiguate from `getCampaignMembersByCharacter` | `campaignMember.service` | No semantic change |

**Outcome:** Campaign member controller has no DB access; all orchestration in service.

---

### Build 7: Campaign – PreCheck & AddMember

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **7.1** | Add `campaignMember.service.preCheckMember(campaignId, email)` – returns `{ status, userName }`; fetches user, member, checks character status | `campaignMember.service`, `campaign.controller` | Controller calls service; no DB in controller |
| **7.2** | Add `campaignMember.service.addMemberOrInvite(campaignId, email, role, invitedByUserId)` – fetches user; if no user → create invite token + send email; if user → create invite + notification; returns result | `campaignMember.service`, `invite.service`, `campaign.controller` | Controller calls service; no DB in controller |

**Outcome:** `preCheckMember` and `addMember` controller logic moved to service.

---

### Build 8: Campaign – GetCampaign Visibility

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **8.1** | Add `campaign.service.getCampaignWithViewerContext(campaignId, userId, userRole)` – fetches campaign, member context, visibility-filtered members, hydrated views; returns `{ campaign, viewer, members }` | `campaign.service`, `campaignMember.service`, `campaign.controller` | Controller calls service; returns `res.json({ campaign })` |
| **8.2** | Simplify `getCampaign` controller: ensure `req.campaign` and `req.viewerContext` from middleware; call `getCampaignWithViewerContext` or equivalent; return | `campaign.controller` | Controller thin; visibility logic in service |

**Outcome:** `getCampaign` controller thin; service owns visibility and member hydration.

---

### Build 9: Invite – Enriched DTO in Service

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **9.1** | Add `invite.service.getInviteEnriched(inviteId, userId)` – fetches invite, campaign, invitedBy user; returns `InviteEnrichedDto` or null; enforces userId check | `invite.service`, `invite.controller` | Controller calls service; no DB in controller |
| **9.2** | Simplify `getInvite` controller: call `getInviteEnriched`, return or 403/404 | `invite.controller` | No DB access |

**Outcome:** Invite controller thin; enrichment in service.

---

### Build 10: Session – Read Model & Visibility in Service

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **10.1** | Add `src/features/session/read-model/session-read.types.ts` and `session-read.mappers.ts`: `SessionSummary` type, `toSessionSummary(doc)` | `src/features/session/read-model/` | Mapper produces `{ id, campaignId, date, title, notes, status }` |
| **10.2** | Add `session.service.getSessionsForUserWithVisibility(userId, userRole)` – fetches sessions, applies `canViewSession` filter, returns `SessionSummary[]` | `session.service`, `session.controller` | Visibility logic in service |
| **10.3** | Add `session.service.getSessionByIdWithAccess(id, userId, userRole)` – fetches session, checks access, returns `SessionSummary` or null | `session.service`, `session.controller` | |
| **10.4** | Remove `normalizeSession` from controller; use mapper in service | `session.controller`, `session.service` | Controller thin |

**Outcome:** Session has read-model; visibility in service; controller thin.

---

### Build 11: Auth – DB Access to Services

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **11.1** | Add `auth.service.registerWithInviteToken(body)` – validates invite token, creates user, updates profile, returns user; used by register + invite-accept flows | `auth.service`, `user.service`, `invite.service`, `auth.controller` | Controller passes body; service owns DB |
| **11.2** | Add `auth.service.acceptInviteToken(token, userId, characterId?)` – validates token, creates campaign member or invite, returns result | `auth.service`, `invite.service`, `campaignMember.service`, `auth.controller` | |
| **11.3** | Move all DB access from `auth.controller` register and invite-accept into services | `auth.controller` | No DB in controller |

**Outcome:** Auth controller thin; all DB and orchestration in services.

---

### Build 12: Error Handling & Validation (Optional Hardening)

| Step | Description | Files | Acceptance |
|------|-------------|-------|------------|
| **12.1** | Update `errorHandler` to recognize `ApiError` and use its `statusCode` | `middleware/errorHandler.ts` | Thrown ApiError → correct status |
| **12.2** | Migrate 3–5 controllers to use `asyncHandler` | Various controllers | Less try/catch; errors flow to handler |
| **12.3** | Use `validateRequired` in 2–3 create/update endpoints | `validators/common.ts`, controllers | Consistent validation pattern |

**Outcome:** Cleaner error flow; consistent validation.

---

### Build Order & Dependencies

```
Build 1 (Foundations)     → no dependencies
Build 2 (Character get)   → Build 1 optional
Build 3 (Character create)→ Build 2
Build 4 (Character update)→ Build 2
Build 5 (Character delete)→ Build 2
Build 6 (Campaign Member) → independent
Build 7 (Campaign add)    → Build 6
Build 8 (Campaign get)    → independent
Build 9 (Invite)          → independent
Build 10 (Session)        → independent
Build 11 (Auth)           → Build 9 (invite service)
Build 12 (Error/valid)    → Build 1
```

**Recommended sequence:** 1 → 2 → 3 → 4 → 5 (Character complete) → 6 → 7 → 8 (Campaign complete) → 9 → 11 (Invite + Auth) → 10 (Session) → 12.

---

### Ideal State Checklist (Post-Build)

- [x] No controller accesses `db()` or `mongoose.connection` (Character ✓)
- [x] No controller contains business logic (Character ✓)
- [x] Permission resolution in service or auth module (Character ✓)
- [x] Read endpoints return DTOs from service (Character ✓)
- [x] Write endpoints delegate validation + orchestration to service (Character ✓)
- [x] Shared `ApiError` and `asyncHandler` used (Character ✓)
- [x] Validation in service or validators module (Character ✓)

---

## 8. Next Steps

1. **Review and prioritize** phases with the team.
2. **Start with Build 1** – shared foundations (low risk, no behavior change).
3. **Execute Builds 2–5** – Character feature to ideal state.
4. **Execute Builds 6–11** – one feature slice at a time.
5. **Execute Build 12** – optional hardening.
6. **Defer Phase 4** (repository layer, query/command split) until complexity justifies it.
