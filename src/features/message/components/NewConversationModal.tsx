import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useMessaging } from '@/app/providers/MessagingProvider'
import { apiFetch } from '@/app/api'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface CampaignMember {
  _id: string
  username: string
  email?: string
}

interface NewConversationModalProps {
  campaignId: string
  open: boolean
  onClose: () => void
  onConversationCreated: (conversationId: string) => void
}

export const NewConversationModal = ({
  campaignId,
  open,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) => {
  const { user } = useAuth()
  const { createGroupConversation, conversations, setDraftTarget } = useMessaging()
  const [members, setMembers] = useState<CampaignMember[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<'direct' | 'group'>('direct')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    if (!open || !campaignId) return
    setLoading(true)
    setTab('direct')
    setSelectedIds(new Set())
    setGroupName('')
    apiFetch<{ members?: CampaignMember[] }>(`/api/campaigns/${campaignId}/members-for-messaging`)
      .then((data) => setMembers(data.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [open, campaignId])

  const otherMembers = members.filter((m) => m._id !== user?.id)

  const handleDirectSelect = (member: CampaignMember) => {
    // If a conversation with this user already exists, navigate to it
    const existing = conversations.find(
      (c) => c.isDirect && c.otherParticipant?._id === member._id
    )
    if (existing) {
      onConversationCreated(existing._id)
      onClose()
      return
    }

    // No existing conversation — set draft target so the conversation
    // is only created on the backend when the first message is sent
    setDraftTarget({ campaignId, userId: member._id, username: member.username })
    onClose()
  }

  const toggleGroupMember = (memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const handleCreateGroup = async () => {
    if (selectedIds.size === 0) return
    setCreating(true)
    try {
      const conv = await createGroupConversation(
        campaignId,
        [...selectedIds],
        groupName.trim() || undefined
      )
      if (conv) {
        onConversationCreated(conv._id)
        onClose()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New Conversation</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
        <Tab label="Direct" value="direct" />
        <Tab label="Group" value="group" />
      </Tabs>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : tab === 'direct' ? (
          otherMembers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No other campaign members to message.
            </Typography>
          ) : (
            <List disablePadding>
              {otherMembers.map((m) => (
                <ListItemButton
                  key={m._id}
                  onClick={() => handleDirectSelect(m)}
                >
                  <ListItemText primary={m.username} />
                </ListItemButton>
              ))}
            </List>
          )
        ) : (
          <Box>
            <TextField
              label="Group name (optional)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              placeholder="e.g. Party, LFG"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Select members
            </Typography>
            <List disablePadding>
              {otherMembers.map((m) => (
                <ListItemButton
                  key={m._id}
                  onClick={() => toggleGroupMember(m._id)}
                  disabled={creating}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedIds.has(m._id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={m.username} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {tab === 'group' && (
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={creating || selectedIds.size === 0}
          >
            Create Group
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
