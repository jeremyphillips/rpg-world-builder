import { Router } from 'express'
import { requireAuth } from '../../../shared/middleware/requireAuth'
import {
  getConversations,
  createConversation,
  getConversation,
  getMessages,
  createMessage,
} from '../controllers/message.controller'

const router = Router()

router.use(requireAuth)

// GET /api/messages/conversations?campaignId=...
router.get('/conversations', getConversations)

// POST /api/messages/conversations
router.post('/conversations', createConversation)

// GET /api/messages/conversations/:conversationId
router.get('/conversations/:conversationId', getConversation)

// GET /api/messages/conversations/:conversationId/messages
router.get('/conversations/:conversationId/messages', getMessages)

// POST /api/messages/conversations/:conversationId/messages
router.post('/conversations/:conversationId/messages', createMessage)

export default router
