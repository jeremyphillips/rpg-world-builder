import type { Express } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import { requireCampaignRole } from '../shared/middleware/requireCampaignRole'
import chatRoutes from '../features/chat/routes/chat.routes'
import userRoutes from '../features/user/routes/user.routes'
import campaignRoutes from '../features/campaign/routes/campaign.routes'
import uploadRoutes from '../features/upload/routes/upload.routes'
import notificationRoutes from '../features/notification/routes/notification.routes'
import inviteRoutes from '../features/campaign/routes/invite.routes'
import sessionRoutes from '../features/session/routes/session.routes'
import sessionInviteRoutes from '../features/session/routes/sessionInvite.routes'
import campaignMemberRoutes from '../features/campaign/routes/campaignMember.routes'
import messageRoutes from '../features/message/routes/message.routes'
import classesRoutes from '../features/content/classes/routes/classes.routes'
import racesRoutes from '../features/content/races/routes/races.routes'
import monstersRoutes from '../features/content/monsters/routes/monsters.routes'
import spellsRoutes from '../features/content/spells/routes/spells.routes'
import skillProficienciesRoutes from '../features/content/skillProficiencies/routes/skillProficiencies.routes'
import equipmentRoutes from '../features/content/equipment/routes/equipment.routes'
import locationsRoutes, {
  locationMapTransitionsRouter,
} from '../features/content/locations/routes/locations.routes'
import combatRoutes from '../features/combat/routes/combat.routes'

const campaignScopedContent = [requireAuth, requireCampaignRole('observer')]

export function registerRoutes(app: Express) {
  app.use('/api/combat', combatRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/campaigns/:id/classes', ...campaignScopedContent, classesRoutes)
  app.use('/api/campaigns/:id/races', ...campaignScopedContent, racesRoutes)
  app.use('/api/campaigns/:id/monsters', ...campaignScopedContent, monstersRoutes)
  app.use('/api/campaigns/:id/spells', ...campaignScopedContent, spellsRoutes)
  app.use('/api/campaigns/:id/skill-proficiencies', ...campaignScopedContent, skillProficienciesRoutes)
  app.use('/api/campaigns/:id/equipment', ...campaignScopedContent, equipmentRoutes)
  app.use('/api/campaigns/:id/locations', ...campaignScopedContent, locationsRoutes)
  app.use('/api/campaigns/:id/location-maps/:mapId', ...campaignScopedContent, locationMapTransitionsRouter)
  app.use('/api/campaigns', campaignRoutes)
  app.use('/api/uploads', uploadRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/invites', inviteRoutes)
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/session-invites', sessionInviteRoutes)
  app.use('/api/campaign-members', campaignMemberRoutes)
  app.use('/api/messages', messageRoutes)
}
