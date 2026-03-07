import type { Express } from 'express'
import chatRoutes from './chat.routes'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import campaignRoutes from './campaign.routes'
import uploadRoutes from './upload.routes'
import settingDataRoutes from './settingData.routes'
import notificationRoutes from './notification.routes'
import inviteRoutes from './invite.routes'
import sessionRoutes from './session.routes'
import sessionInviteRoutes from './sessionInvite.routes'
import campaignMemberRoutes from './campaignMember.routes'
import messageRoutes from './message.routes'

export function registerRoutes(app: Express) {
  app.use('/api/chat', chatRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/campaigns', campaignRoutes)
  app.use('/api/uploads', uploadRoutes)
  app.use('/api/setting-data', settingDataRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/invites', inviteRoutes)
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/session-invites', sessionInviteRoutes)
  app.use('/api/campaign-members', campaignMemberRoutes)
  app.use('/api/messages', messageRoutes)
}
