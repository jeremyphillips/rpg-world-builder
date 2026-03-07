/**
 * Session read-model types.
 * DTOs for session API responses.
 */

export interface SessionSummary {
  id: string
  campaignId: string | null
  date: string
  title?: string
  notes?: string
  status: string
}
