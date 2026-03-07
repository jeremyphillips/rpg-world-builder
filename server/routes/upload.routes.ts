import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import { requireRole } from '../shared/middleware/requireRole'
import { uploadImage } from '../controllers/upload.controller'

const router = Router()

router.use(requireAuth)
router.post('/', requireRole('user', 'admin', 'superadmin'), uploadImage)

export default router
