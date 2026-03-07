import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import { requireRole } from '../shared/middleware/requireRole'
import {
  getSettingData,
  updateWorldMap,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/settingData.controller'

const router = Router()

router.use(requireAuth)

// Anyone authenticated can read
router.get('/:settingId', getSettingData)

// Only admin/superadmin can write
router.patch('/:settingId/world-map', requireRole('admin', 'superadmin'), updateWorldMap)
router.post('/:settingId/locations', requireRole('admin', 'superadmin'), createLocation)
router.patch('/:settingId/locations/:locationId', requireRole('admin', 'superadmin'), updateLocation)
router.delete('/:settingId/locations/:locationId', requireRole('admin', 'superadmin'), deleteLocation)

export default router
