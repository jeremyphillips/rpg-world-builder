# Server Feature Migration Plan

## Overview

Migrate server features from legacy layout (`controllers/`, `services/`, `routes/`) to feature-first structure under `server/features/`, mirroring `src/features/`.

**Decisions:**
- Keep server→src imports for now; add TODO comments to extract into shared later
- sessionInvite goes inside `features/session/` (not a separate feature)
- Invite goes inside `features/campaign/` (campaign invites)
- Message routes restructured for explicit paths (see Message section)
- Prefer direct imports (no index barrel files)
- Replace setting scope with campaign scope: settingData becomes campaign-scoped (settingId → campaignId)

---

## Target Structure (per feature)

```
server/features/{feature}/
├── controllers/
│   └── {feature}.controller.ts
├── routes/
│   └── {feature}.routes.ts
└── services/
    └── {feature}.service.ts   (and any feature-specific services)
```

---

## Migration Order

1. **Notification** – no feature dependencies; many others depend on it
2. **User** – minimal dependencies
3. **Session** (includes sessionInvite) – depends on notification
4. **Message** – depends on notification; includes conversation logic; route restructure
5. **Chat** – independent
6. **Campaign** (includes campaignMember, invite, note, contentPatch, rulesetPatch, settingData) – replace setting scope with campaign scope
7. **Upload** – independent
8. **Email** – infrastructure; used by campaign invite

---

## Feature-by-Feature Plan

### 1. Notification

**Move:**
- `controllers/notification.controller.ts` → `features/notification/controllers/notification.controller.ts`
- `routes/notification.routes.ts` → `features/notification/routes/notification.routes.ts`
- `services/notification.service.ts` → `features/notification/services/notification.service.ts`

**Update imports in:**
- `message.service` (→ features/message later)
- `session.service` (→ features/session later)
- `sessionInvite.service` (→ features/session later)
- `invite.service`
- `campaignMember.service`
- `features/character/services/character.service.ts`

---

### 2. User

**Move:**
- `controllers/user.controller.ts` → `features/user/controllers/user.controller.ts`
- `routes/user.routes.ts` → `features/user/routes/user.routes.ts`
- `services/user.service.ts` → `features/user/services/user.service.ts`

**Dependencies:** User model, auth middleware. No feature-to-feature imports.

---

### 3. Session (includes sessionInvite)

**Move:**
- `controllers/session.controller.ts` → `features/session/controllers/session.controller.ts`
- `routes/session.routes.ts` → `features/session/routes/session.routes.ts`
- `services/session.service.ts` → `features/session/services/session.service.ts`
- `controllers/sessionInvite.controller.ts` → `features/session/controllers/sessionInvite.controller.ts`
- `routes/sessionInvite.routes.ts` → `features/session/routes/sessionInvite.routes.ts`
- `services/sessionInvite.service.ts` → `features/session/services/sessionInvite.service.ts`

**Structure under session:**
```
server/features/session/
├── controllers/
│   ├── session.controller.ts
│   └── sessionInvite.controller.ts
├── routes/
│   ├── session.routes.ts
│   └── sessionInvite.routes.ts
└── services/
    ├── session.service.ts
    └── sessionInvite.service.ts
```

**Imports to update:**
- `session.service` → `../../notification/services/notification.service`
- `sessionInvite.service` → `../../notification/services/notification.service`
- Add TODO: extract `toSessionSummary` from `src/features/session/read-model` into shared

**Route registration:** Keep `/api/sessions` and `/api/session-invites` as separate mounts (or nest session-invites under sessions if desired).

---

### 4. Message

**Move:**
- `controllers/message.controller.ts` → `features/message/controllers/message.controller.ts`
- `routes/message.routes.ts` → `features/message/routes/message.routes.ts`
- `services/message.service.ts` → `features/message/services/message.service.ts`
- `services/conversation.service.ts` → `features/message/services/conversation.service.ts`

**Route restructure:** Use explicit paths. Router remains mounted at `/api/messages`.

| Current | New |
|---------|-----|
| GET `/` (query: campaignId) | GET `/conversations` (query: campaignId) |
| POST `/` | POST `/conversations` |
| GET `/conversation/:conversationId` | GET `/conversations/:conversationId` |
| GET `/:conversationId` | GET `/conversations/:conversationId/messages` |
| POST `/:conversationId` | POST `/conversations/:conversationId/messages` |

**Full API paths after change:**
- GET `/api/messages/conversations?campaignId=...`
- POST `/api/messages/conversations`
- GET `/api/messages/conversations/:conversationId`
- GET `/api/messages/conversations/:conversationId/messages`
- POST `/api/messages/conversations/:conversationId/messages`

**Client update required:** `src/app/providers/MessagingProvider.tsx` – update all API paths to match above.

**Imports to update:**
- `message.controller` imports `canMessageUser`, `canMessageUsers` from `../../src/features/message` – add TODO: extract into shared
- `message.service` → `../../notification/services/notification.service`
- `message.service` → `../../../socket` for `emitNewMessage`
- `message.service` → `./conversation.service` (local)

---

### 5. Chat

**Move:**
- `controllers/chat.controller.ts` → `features/chat/controllers/chat.controller.ts`
- `routes/chat.routes.ts` → `features/chat/routes/chat.routes.ts`
- `services/openai.service.ts` → `features/chat/services/openai.service.ts` (only used by chat)

**Imports:** `openai.service` uses `../shared/config/env` → update to `../../../shared/config/env`.

---

### 6. Campaign (includes campaignMember, invite, note, contentPatch, rulesetPatch, settingData)

**Move to `server/features/campaign/`:**
- `controllers/campaign.controller.ts` → `features/campaign/controllers/campaign.controller.ts`
- `controllers/campaignMember.controller.ts` → `features/campaign/controllers/campaignMember.controller.ts`
- `controllers/invite.controller.ts` → `features/campaign/controllers/invite.controller.ts`
- `controllers/note.controller.ts` → `features/campaign/controllers/note.controller.ts`
- `controllers/contentPatch.controller.ts` → `features/campaign/controllers/contentPatch.controller.ts`
- `controllers/rulesetPatch.controller.ts` → `features/campaign/controllers/rulesetPatch.controller.ts`
- `services/campaign.service.ts`, `campaignMember.service.ts`, `invite.service.ts`, `note.service.ts`, `contentPatch.service.ts`, `rulesetPatch.service.ts` → `features/campaign/services/`
- `routes/campaign.routes.ts`, `campaignMember.routes.ts`, `invite.routes.ts` → `features/campaign/routes/`

**Replace setting scope with campaign scope (settingData):**
- Delete standalone `settingData.controller.ts`, `settingData.service.ts`, `settingData.routes.ts`
- Add campaign-scoped setting data: `features/campaign/controllers/settingData.controller.ts`, `services/settingData.service.ts`
- Change `settingId` → `campaignId` in API and DB schema
- Mount under campaign routes: `/api/campaigns/:id/` (e.g. `GET /:id/setting-data`, `PATCH /:id/setting-data/world-map`, `POST /:id/setting-data/locations`, etc.)
- Replace `requireRole('admin', 'superadmin')` with `requireCampaignRole('observer')` / `requireCampaignOwner()` for campaign-scoped access
- **Client update:** `src/features/content/locations/routes/LocationRoute.tsx` – use `campaignId` instead of `campaign.identity.setting`; call `/api/campaigns/:id/setting-data/...` instead of `/api/setting-data/:settingId/...`

**Structure under campaign:**
```
server/features/campaign/
├── controllers/
│   ├── campaign.controller.ts
│   ├── campaignMember.controller.ts
│   ├── invite.controller.ts
│   ├── note.controller.ts
│   ├── contentPatch.controller.ts
│   ├── rulesetPatch.controller.ts
│   └── settingData.controller.ts
├── routes/
│   ├── campaign.routes.ts
│   ├── campaignMember.routes.ts
│   ├── invite.routes.ts
│   └── (settingData routes nested in campaign.routes)
└── services/
    ├── campaign.service.ts
    ├── campaignMember.service.ts
    ├── invite.service.ts
    ├── note.service.ts
    ├── contentPatch.service.ts
    ├── rulesetPatch.service.ts
    └── settingData.service.ts
```

**Route registration:** Campaign routes remain at `/api/campaigns`, campaign-member at `/api/campaign-members`, invite at `/api/invites`. Setting-data routes move from `/api/setting-data/:settingId` to `/api/campaigns/:id/setting-data` (or nested under campaign router).

---

### 7. Upload

**Move:**
- `controllers/upload.controller.ts` → `features/upload/controllers/upload.controller.ts`
- `routes/upload.routes.ts` → `features/upload/routes/upload.routes.ts`
- `services/image.service.ts` → `shared/services/image.service.ts` (used by upload, campaign, auth, character; keep in shared)

**Route registration:** `/api/uploads` unchanged.

---

### 8. Email

**Move:**
- `services/email.service.ts` → `features/email/services/email.service.ts`
- `services/email.providers/types.ts` → `features/email/services/providers/types.ts`
- `services/email.providers/ethereal.provider.ts` → `features/email/services/providers/ethereal.provider.ts`
- `services/email.providers/smtp.provider.ts` → `features/email/services/providers/smtp.provider.ts`

**Structure under email:**
```
server/features/email/
└── services/
    ├── email.service.ts
    └── providers/
        ├── types.ts
        ├── ethereal.provider.ts
        └── smtp.provider.ts
```

**Consumer:** `campaignMember.service` (sendCampaignInvite). No routes; email is infrastructure used by campaign invite flow.

---

## Register Routes Update

After migration, `register-routes.ts` and `routes/index.ts`:

```ts
// register-routes.ts – add feature routes
app.use('/api/characters', characterRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/users', userRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/session-invites', sessionInviteRoutes)  // from features/session
app.use('/api/messages', messageRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/campaigns', campaignRoutes)             // from features/campaign
app.use('/api/campaign-members', campaignMemberRoutes)
app.use('/api/invites', inviteRoutes)
app.use('/api/uploads', uploadRoutes)
// settingData: nested under /api/campaigns/:id/setting-data
```

---

## TODO Comments to Add

When migrating, add these TODO comments at server→src import sites:

1. **message.controller** (canMessageUser, canMessageUsers):
   ```ts
   // TODO: Extract canMessageUser, canMessageUsers into shared; remove server→src dependency
   import { canMessageUser, canMessageUsers } from '../../src/features/message'
   ```

2. **session.service** (toSessionSummary):
   ```ts
   // TODO: Extract toSessionSummary into shared; remove server→src dependency
   import { toSessionSummary } from '../../src/features/session/read-model'
   ```

3. **character.service** (character types, read-model):
   ```ts
   // TODO: Extract character domain types and read-model into shared; remove server→src dependency
   ```

4. **campaign.service** (character read-model):
   ```ts
   // TODO: Extract character read-model into shared; remove server→src dependency
   ```

5. **Other server→src imports** (spells, skillProficiencies, rulesetPatch, etc.):
   ```ts
   // TODO: Extract into shared; remove server→src dependency
   ```

---

## Phase 1 Complete (File Structure Migration)

**Completed:** Campaign, campaignMember, invite, note, contentPatch, rulesetPatch moved to `server/features/campaign/`. Upload moved to `server/features/upload/`. All imports updated. Legacy files removed. settingData left as-is for Phase 2.

---

## Phase 2 Complete (Setting Scope Replacement)

**Completed:** settingData migrated to campaign scope. Routes now at `/api/campaigns/:id/setting-data`, `/api/campaigns/:id/setting-data/world-map`, `/api/campaigns/:id/setting-data/locations`, etc. Access controlled by `requireCampaignRole` / `requireCampaignOwner`. LocationRoute.tsx updated to use campaignId and new API. Legacy settingData controller, service, routes removed.

**Data migration note:** Existing `settingData` documents use `settingId`. The new service uses `campaignId`. If you have existing data where `settingId` corresponded to a campaign ID, run a one-time migration to add `campaignId` or rename the field. Documents are created on first write per campaign.

---

## Summary Checklist

| Feature | Controller | Routes | Services | Notes |
|---------|------------|--------|----------|-------|
| notification | ✓ | ✓ | notification.service | **DONE** |
| user | ✓ | ✓ | user.service | **DONE** |
| session | ✓ | ✓ | session.service | **DONE** – includes sessionInvite |
| sessionInvite | ✓ | ✓ | sessionInvite.service | **DONE** – inside features/session |
| message | ✓ | ✓ | message.service, conversation.service | **DONE** – route restructure + client update |
| chat | ✓ | ✓ | openai.service | **DONE** |
| campaign | ✓ | ✓ | campaign.service | **DONE** (Phase 1) – includes campaignMember, invite, note, contentPatch, rulesetPatch |
| campaignMember | ✓ | ✓ | campaignMember.service | **DONE** – inside features/campaign |
| invite | ✓ | ✓ | invite.service | **DONE** – inside features/campaign |
| note | ✓ | — | note.service | **DONE** – inside features/campaign (routes in campaign.routes) |
| contentPatch | ✓ | — | contentPatch.service | **DONE** – inside features/campaign (routes in campaign.routes) |
| rulesetPatch | ✓ | — | rulesetPatch.service | **DONE** – inside features/campaign (routes in campaign.routes) |
| settingData | ✓ | ✓ | settingData.service | **DONE** (Phase 2) – campaign-scoped under features/campaign |
| upload | ✓ | ✓ | — | **DONE** (Phase 1) – image.service in shared/services |
| email | — | — | email.service, providers | **DONE** – infrastructure used by campaign invite |
