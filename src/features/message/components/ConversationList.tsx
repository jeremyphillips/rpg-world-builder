import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useMessaging } from '@/app/providers/MessagingProvider'
import { ROUTES } from '@/app/routes'
import { getConversationDisplayName } from '@/features/message'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'

import AddIcon from '@mui/icons-material/Add'
import ChatIcon from '@mui/icons-material/Chat'

interface ConversationListProps {
  campaignId: string
}

export const ConversationList = ({ campaignId }: ConversationListProps) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const {
    conversations,
    selectedConversationId,
    loading,
    loadConversations,
    selectConversation,
    setNewConversationModalOpen,
  } = useMessaging()

  useEffect(() => {
    loadConversations(campaignId)
  }, [campaignId, loadConversations])

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId)
    if (id) {
      navigate(ROUTES.MESSAGING_CONVERSATION.replace(':id', id).replace(':conversationId', conversationId))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Messages
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setNewConversationModalOpen(true)}
        >
          New
        </Button>
      </Box>

      {conversations.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No conversations yet
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Start a new conversation with a campaign member
          </Typography>
          <Button
            size="small"
            sx={{ mt: 2 }}
            onClick={() => setNewConversationModalOpen(true)}
          >
            New Conversation
          </Button>
        </Box>
      ) : (
        <List disablePadding>
          {conversations.map((conv) => (
            <ListItemButton
              key={conv._id}
              selected={selectedConversationId === conv._id}
              onClick={() => handleSelectConversation(conv._id)}
            >
              <ListItemText
                primary={getConversationDisplayName(conv, user?.id ?? '')}
                secondary={conv.isDirect ? undefined : `${conv.participantIds.length} members`}
                primaryTypographyProps={{ fontSize: '0.9rem' }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  )
}
