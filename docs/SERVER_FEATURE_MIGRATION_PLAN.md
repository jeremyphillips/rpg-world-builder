# Server Feature Migration Plan

## Overview

Migrate server features from legacy layout (`controllers/`, `services/`, `routes/`) to feature-first structure under `server/features/`, mirroring `src/features/`.

**Decisions:**
- Keep server→src imports for now; add TODO comments to extract into shared later
- sessionInvite goes inside `features/session/` (not a separate feature)
- Invite to be migrated later
- Message routes restructured for explicit paths (see Message section)
- Prefer direct imports (no index barrel files)

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
registerRoutes(app)  // campaigns, uploads, settingData, invite, campaignMember
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

## Summary Checklist

| Feature | Controller | Routes | Services | Notes |
|---------|------------|--------|----------|-------|
| notification | ✓ | ✓ | notification.service | Migrate first |
| user | ✓ | ✓ | user.service | Straightforward |
| session | ✓ | ✓ | session.service | Includes sessionInvite |
| sessionInvite | ✓ | ✓ | sessionInvite.service | Inside features/session |
| message | ✓ | ✓ | message.service, conversation.service | Route restructure + client update |
| chat | ✓ | ✓ | openai.service | Separate from message |
| invite | — | — | — | Migrate later |
