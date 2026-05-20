import { Outlet } from 'react-router-dom'

import Box from '@mui/material/Box'

import '@/features/content/locations/domain/model/placedObjects/locationPlacedObjectRasterAssets.vite'

export default function WorldLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  )
}
