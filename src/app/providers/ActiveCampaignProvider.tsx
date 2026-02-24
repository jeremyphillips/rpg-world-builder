import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'  
import { useLocation, useNavigate, matchPath } from 'react-router-dom'
import { apiFetch } from '../api'
import type { Campaign } from '@/shared/types/campaign.types'

interface ActiveCampaignContextType {
  campaign: Campaign | null,
  campaignId: string | null,
  campaignName: string | null,
  loading: boolean,
  setActiveCampaign: (id: string) => void
  clearActiveCampaign: () => void
}

const ActiveCampaignContext =
  createContext<ActiveCampaignContextType | undefined>(undefined)

const STORAGE_KEY = 'activeCampaignId'

function isValidObjectId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id)
}

export const ActiveCampaignProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)

  const [campaignId, setActiveCampaignId] =
    useState<string | null>(() => {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored && isValidObjectId(stored) ? stored : null
    })

  const [loading, setLoading] = useState(() => !!campaignId)

  useEffect(() => {
    const controller = new AbortController()
    apiFetch<{ campaigns: { _id: string }[] }>('/api/campaigns', { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        const list = data.campaigns ?? []
        if (list.length !== 1) return
        setActiveCampaignId((prev) => {
          if (prev) return prev
          const id = list[0]._id
          localStorage.setItem(STORAGE_KEY, id)
          return id
        })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const match = matchPath(
      { path: '/campaigns/:campaignId/*' },
      location.pathname
    )

    if (match?.params?.campaignId) {
      const id = match.params.campaignId
      if (id) {
        if (isValidObjectId(id) && id !== campaignId) {
          setActiveCampaignId(id)
          localStorage.setItem(STORAGE_KEY, id)
        } else if (!isValidObjectId(id) && campaignId === id) {
          setActiveCampaignId(null)
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    }
  }, [location.pathname, campaignId])

  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  const setActiveCampaign = useCallback((id: string) => {
    setActiveCampaignId(id)
    localStorage.setItem(STORAGE_KEY, id)
    navigateRef.current(`/campaigns/${id}`)
  }, [])

  const clearActiveCampaign = useCallback(() => {
    setActiveCampaignId(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null)
      return
    }

    const controller = new AbortController()

    setLoading(true)

    apiFetch<{ campaign: Campaign }>(`/api/campaigns/${campaignId}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setCampaign(data.campaign ?? null)
      })
      .catch(() => {
        if (!controller.signal.aborted) setCampaign(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [campaignId])

  const value = useMemo(() => ({
    campaignId,
    campaign,
    campaignName: campaign?.identity?.name ?? null,
    loading,
    setActiveCampaign,
    clearActiveCampaign
  }), [campaignId, campaign, loading, setActiveCampaign, clearActiveCampaign])

  return (
    <ActiveCampaignContext.Provider value={value}>
      {children}
    </ActiveCampaignContext.Provider>
  )
}

export const useActiveCampaign = () => {
  const context = useContext(ActiveCampaignContext)
  if (!context) {
    throw new Error(
      'useActiveCampaign must be used within ActiveCampaignProvider'
    )
  }
  return context
}
