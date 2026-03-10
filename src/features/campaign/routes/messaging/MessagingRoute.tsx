import { useAuth } from '@/app/providers/AuthProvider'
import { MessagingLayout } from '@/features/message/components'

export default function MessagingRoute() {
  useAuth()
  return <MessagingLayout />
}
