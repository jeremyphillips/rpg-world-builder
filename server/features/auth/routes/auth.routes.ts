import { Router } from 'express'
import { requireAuth } from '../../../shared/middleware/requireAuth'
import { asyncHandler } from '../../../shared/middleware/asyncHandler'
import { login, logout, register, resolveInvite, acceptInvite, getMe, updateMe, getSocketToken } from '../controllers/auth.controller'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/logout', logout)
router.post('/resolve-invite', asyncHandler(resolveInvite))
router.post('/accept-invite', requireAuth, asyncHandler(acceptInvite))
router.get('/me', asyncHandler(getMe))
router.patch('/me', requireAuth, asyncHandler(updateMe))
router.get('/socket-token', requireAuth, asyncHandler(getSocketToken))

export default router
