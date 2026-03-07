/**
 * Session read-model mappers.
 * Transforms stored session documents to DTOs.
 */

import type { SessionSummary } from './session-read.types'

/** Stored session shape used as mapper input. */
export type SessionDocForSummary = {
  _id: { toString(): string }
  campaignId?: { toString(): string }
  date: string
  title?: string
  notes?: string
  status?: string
}

export function toSessionSummary(doc: SessionDocForSummary): SessionSummary {
  return {
    id: doc._id.toString(),
    campaignId: doc.campaignId?.toString() ?? null,
    date: doc.date,
    title: doc.title,
    notes: doc.notes,
    status: doc.status ?? 'scheduled',
  }
}
