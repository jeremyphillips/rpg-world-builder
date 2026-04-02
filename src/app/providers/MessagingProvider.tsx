import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { apiFetch } from '../api'
import { useSocketConnection } from './SocketConnectionProvider'

export interface DraftTarget {
  campaignId: string
  userId: string
  username: string
}

interface Conversation {
  _id: string
  campaignId?: string
  participantIds: string[]
  name?: string
  lastMessageAt: string
  isDirect?: boolean
  otherParticipant?: { _id: string; username: string }
  participants?: { _id: string; username: string }[]
}

interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string
  readBy: string[]
  createdAt: string
}

interface MessagingContextType {
  conversations: Conversation[]
  messages: Message[]
  selectedConversationId: string | null
  loading: boolean
  loadConversations: (campaignId: string) => Promise<void>
  getConversation: (conversationId: string) => Promise<Conversation | null>
  selectConversation: (id: string | null) => void
  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  createConversation: (campaignId: string, targetUserId: string) => Promise<Conversation | null>
  createGroupConversation: (
    campaignId: string,
    participantIds: string[],
    name?: string
  ) => Promise<Conversation | null>
  newConversationModalOpen: boolean
  setNewConversationModalOpen: (open: boolean) => void
  draftTarget: DraftTarget | null
  setDraftTarget: (target: DraftTarget | null) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocketConnection()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [newConversationModalOpen, setNewConversationModalOpen] = useState(false)
  const [draftTarget, setDraftTarget] = useState<DraftTarget | null>(null)
  const socketRef = useRef(socket)
  const campaignIdRef = useRef<string | null>(null)

  socketRef.current = socket

  useEffect(() => {
    if (!socket) return
    const onNewMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev
        return [...prev, msg]
      })
    }
    socket.on('new_message', onNewMessage)
    return () => {
      socket.off('new_message', onNewMessage)
    }
  }, [socket])

  const loadConversations = useCallback(async (campaignId: string) => {
    campaignIdRef.current = campaignId
    setLoading(true)
    try {
      const data = await apiFetch<{ conversations: Conversation[] }>(
        `/api/messages/conversations?campaignId=${encodeURIComponent(campaignId)}`
      )
      setConversations(data.conversations ?? [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getConversation = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    try {
      const data = await apiFetch<{ conversation: Conversation }>(
        `/api/messages/conversations/${encodeURIComponent(conversationId)}`
      )
      const conv = data.conversation
      setConversations((prev) => {
        if (prev.some((c) => c._id === conv._id)) return prev
        return [conv, ...prev]
      })
      return conv
    } catch {
      return null
    }
  }, [])

  const selectConversation = useCallback((id: string | null) => {
    setSelectedConversationId((prev) => {
      const s = socketRef.current
      if (s) {
        if (prev) s.emit('leave_conversation', prev)
        if (id) s.emit('join_conversation', id)
      }
      if (id !== prev) {
        setMessages([])
      }
      return id
    })
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await apiFetch<{ messages: Message[] }>(
        `/api/messages/conversations/${conversationId}/messages`
      )
      setMessages(data.messages ?? [])
    } catch {
      setMessages([])
    }
  }, [])

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      const data = await apiFetch<{ message: Message }>(
        `/api/messages/conversations/${conversationId}/messages`,
        { method: 'POST', body: { content } }
      )
      setMessages((prev) => {
        if (prev.some((m) => m._id === data.message._id)) return prev
        return [...prev, data.message]
      })
    } catch {
      throw new Error('Failed to send message')
    }
  }, [])

  const createConversation = useCallback(async (
    campaignId: string,
    targetUserId: string
  ): Promise<Conversation | null> => {
    try {
      const data = await apiFetch<{ conversation: Conversation }>('/api/messages/conversations', {
        method: 'POST',
        body: { campaignId, targetUserId },
      })
      const conv = data.conversation
      setConversations((prev) => {
        if (prev.some((c) => c._id === conv._id)) return prev
        return [conv, ...prev]
      })
      return conv
    } catch {
      return null
    }
  }, [])

  const createGroupConversation = useCallback(async (
    campaignId: string,
    participantIds: string[],
    name?: string
  ): Promise<Conversation | null> => {
    try {
      const data = await apiFetch<{ conversation: Conversation }>('/api/messages/conversations', {
        method: 'POST',
        body: { campaignId, participantIds, name },
      })
      const conv = data.conversation
      setConversations((prev) => {
        if (prev.some((c) => c._id === conv._id)) return prev
        return [conv, ...prev]
      })
      return conv
    } catch {
      return null
    }
  }, [])

  // Memoize so consumers only re-render when messaging state changes
  const value = useMemo<MessagingContextType>(() => ({
    conversations,
    messages,
    selectedConversationId,
    loading,
    loadConversations,
    getConversation,
    selectConversation,
    loadMessages,
    sendMessage,
    createConversation,
    createGroupConversation,
    newConversationModalOpen,
    setNewConversationModalOpen,
    draftTarget,
    setDraftTarget,
  }), [
    conversations,
    messages,
    selectedConversationId,
    loading,
    loadConversations,
    getConversation,
    selectConversation,
    loadMessages,
    sendMessage,
    createConversation,
    createGroupConversation,
    newConversationModalOpen,
    draftTarget,
  ])

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}

export const useMessaging = () => {
  const ctx = useContext(MessagingContext)
  if (!ctx) throw new Error('useMessaging must be used within MessagingProvider')
  return ctx
}
