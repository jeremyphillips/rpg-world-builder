import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller'

const router = Router()

router.use(requireAuth)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.post('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)

export default router
