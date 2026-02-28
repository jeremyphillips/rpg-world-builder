import { useParams } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function EquipmentDetailsRoute() {
  const { equipmentId } = useParams<{ equipmentId: string }>()
  return (
    <Box>
      <Typography variant="h4" component="h1">
        Equipment Details {equipmentId ? `— ${equipmentId}` : ''}
      </Typography>
    </Box>
  )
}
