import { useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useMessaging } from '@/app/providers/MessagingProvider'
import type { Message } from '@/features/message'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

import { MessageInput } from './MessageInput'

interface ParticipantInfo {
  _id: string
  username: string
}

interface ConversationViewProps {
  conversation: {
    _id: string
    isDirect?: boolean
    otherParticipant?: ParticipantInfo
    participants?: ParticipantInfo[]
  }
  displayName: string
}

export const ConversationView = ({ conversation, displayName }: ConversationViewProps) => {
  const { user } = useAuth()
  const { messages, loadMessages, sendMessage } = useMessaging()
  const bottomRef = useRef<HTMLDivElement>(null)
  const isGroup = conversation.isDirect === false

  const participantMap = (() => {
    const map: Record<string, string> = {}
    if (conversation.otherParticipant) {
      map[conversation.otherParticipant._id] = conversation.otherParticipant.username
    }
    conversation.participants?.forEach((p) => {
      map[p._id] = p.username
    })
    return map
  })()

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'You'
    return participantMap[senderId] ?? 'Unknown'
  }

  useEffect(() => {
    loadMessages(conversation._id)
  }, [conversation._id, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    await sendMessage(conversation._id, content)
  }

  const isOwnMessage = (msg: Message) => msg.senderId === user?.id

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {displayName}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg) => (
          <Box
            key={msg._id}
            sx={{
              display: 'flex',
              justifyContent: isOwnMessage(msg) ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1,
                maxWidth: '75%',
                bgcolor: isOwnMessage(msg) ? 'primary.main' : 'background.paper',
                color: isOwnMessage(msg) ? 'primary.contrastText' : 'text.primary',
              }}
            >
              {isGroup && (
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.9 }}>
                  {getSenderName(msg.senderId)}
                </Typography>
              )}
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      <MessageInput onSend={handleSend} />
    </Box>
  )
}
