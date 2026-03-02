import styles from './StatShield.module.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography';

export default function StatShield({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <div className={styles['rounded-shield']}>
        <>  
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </>
      </div>
    </Box>
  )
}