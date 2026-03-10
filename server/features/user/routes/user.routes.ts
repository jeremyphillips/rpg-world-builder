import { Router } from 'express'
import { requireAuth } from '../../../shared/middleware/requireAuth'
import { requireRole } from '../../../shared/middleware/requireRole'
import { getUsers, getUser, updateRole, createUser } from '../controllers/user.controller'

const router = Router()

router.use(requireAuth)
router.use(requireRole('superadmin'))

router.get('/', getUsers)
router.post('/', createUser)
router.get('/:id', getUser)
router.patch('/:id/role', updateRole)

export default router
