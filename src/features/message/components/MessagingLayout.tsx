import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useMessaging } from '@/app/providers/MessagingProvider'
import { ROUTES } from '@/app/routes'
import { getConversationDisplayName } from '@/features/message'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { ConversationList } from './ConversationList'
import { ConversationView } from './ConversationView'
import { MessageInput } from './MessageInput'
import { NewConversationModal } from './NewConversationModal'

export const MessagingLayout = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id: campaignId, conversationId: urlConversationId } = useParams<{
    id: string
    conversationId?: string
  }>()
  const {
    conversations,
    selectedConversationId,
    getConversation,
    loadMessages,
    selectConversation,
    sendMessage,
    createConversation,
    setNewConversationModalOpen,
    newConversationModalOpen,
    draftTarget,
    setDraftTarget,
  } = useMessaging()

  useEffect(() => {
    if (!campaignId) return

    if (!urlConversationId) {
      if (selectedConversationId) selectConversation(null)
      return
    }

    if (selectedConversationId === urlConversationId) return

    const conv = conversations.find((c) => c._id === urlConversationId)
    if (conv) {
      selectConversation(urlConversationId)
      return
    }

    getConversation(urlConversationId).then((fetched) => {
      if (fetched) selectConversation(urlConversationId)
    })
  }, [urlConversationId, campaignId, selectedConversationId, conversations, getConversation, selectConversation])

  const selectedConversation = selectedConversationId
    ? conversations.find((c) => c._id === selectedConversationId)
    : null

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
    }
  }, [selectedConversationId, loadMessages])

  const handleConversationCreated = (conversationId: string) => {
    setDraftTarget(null)
    selectConversation(conversationId)
    loadMessages(conversationId)
    if (campaignId) {
      navigate(ROUTES.MESSAGING_CONVERSATION.replace(':id', campaignId).replace(':conversationId', conversationId))
    }
  }

  // Clear draft when a conversation is selected via the sidebar
  useEffect(() => {
    if (selectedConversationId && draftTarget) {
      setDraftTarget(null)
    }
  }, [selectedConversationId, draftTarget, setDraftTarget])

  const handleDraftSend = async (content: string) => {
    if (!draftTarget) return
    const conv = await createConversation(draftTarget.campaignId, draftTarget.userId)
    if (conv) {
      await sendMessage(conv._id, content)
      handleConversationCreated(conv._id)
    }
  }

  if (!campaignId) {
    return (
      <Typography color="text.secondary">No campaign selected.</Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 400 }}>
      <Box
        sx={{
          width: 280,
          borderRight: 1,
          borderColor: 'divider',
          p: 2,
          overflow: 'auto',
        }}
      >
        <ConversationList campaignId={campaignId} />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedConversation ? (
          <ConversationView
            conversation={selectedConversation}
            displayName={getConversationDisplayName(selectedConversation, user?.id ?? '')}
          />
        ) : draftTarget ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {draftTarget.username}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Send a message to start the conversation
              </Typography>
            </Box>
            <MessageInput onSend={handleDraftSend} />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              Select a conversation or start a new one
            </Typography>
          </Box>
        )}
      </Box>

      <NewConversationModal
        campaignId={campaignId}
        open={newConversationModalOpen}
        onClose={() => setNewConversationModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </Box>
  )
}
