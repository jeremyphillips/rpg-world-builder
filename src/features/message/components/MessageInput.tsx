import { useState } from 'react'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'

import SendIcon from '@mui/icons-material/Send'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      await onSend(trimmed)
      setContent('')
    } catch {
      // Error handled by caller
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type a message…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={sending}
        size="small"
      />
      <IconButton
        color="primary"
        onClick={handleSubmit}
        disabled={sending || !content.trim()}
      >
        <SendIcon />
      </IconButton>
    </Box>
  )
}
