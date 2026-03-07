import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import {
  getConversations,
  createConversation,
  getConversation,
  getMessages,
  createMessage,
} from '../controllers/message.controller'

const router = Router()

router.use(requireAuth)

router.get('/', getConversations)
router.post('/', createConversation)
router.get('/conversation/:conversationId', getConversation)
router.get('/:conversationId', getMessages)
router.post('/:conversationId', createMessage)

export default router
