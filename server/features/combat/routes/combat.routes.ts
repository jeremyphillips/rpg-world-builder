import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler'
import { requireAuth } from '../../../shared/middleware/requireAuth'
import {
  parsePersistedApplyIntentBody,
} from '../services/combatApplyIntent.service'
import {
  applyPersistedIntent,
  createPersistedCombatSession,
  getPersistedCombatSession,
} from '../services/combatPersisted.service'
import {
  parseCombatStartupBody,
} from '../services/combatSessions.service'

const router = Router()

router.get(
  '/sessions/:sessionId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawId = req.params.sessionId
    const sessionId = Array.isArray(rawId) ? rawId[0] : rawId
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      res.status(400).json({ error: 'Missing or invalid session id.' })
      return
    }
    const record = await getPersistedCombatSession(sessionId)
    if (!record) {
      res.status(404).json({ error: 'Combat session not found.' })
      return
    }
    res.json({
      ok: true,
      sessionId: record.sessionId,
      revision: record.revision,
      state: record.state,
    })
  }),
)

router.post(
  '/sessions/:sessionId/intents',
  asyncHandler(async (req, res) => {
    const rawId = req.params.sessionId
    const sessionId = Array.isArray(rawId) ? rawId[0] : rawId
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      res.status(400).json({
        ok: false,
        error: { code: 'invalid-body', message: 'Missing or invalid session id.' },
      })
      return
    }
    const parsed = parsePersistedApplyIntentBody(req.body)
    if (!parsed.ok) {
      res.status(400).json({ ok: false, error: parsed.error })
      return
    }
    const outcome = await applyPersistedIntent(
      sessionId,
      parsed.baseRevision,
      parsed.intent,
      parsed.context,
    )
    switch (outcome.kind) {
      case 'not-found':
        res.status(404).json({
          ok: false,
          error: {
            code: 'session-not-found',
            message: 'Combat session not found.',
          },
        })
        return
      case 'stale':
        res.status(409).json({
          ok: false,
          error: {
            code: 'stale-revision',
            baseRevision: parsed.baseRevision,
            currentRevision: outcome.currentRevision,
          },
        })
        return
      case 'mechanics-rejected':
        res.status(200).json({
          ok: true,
          revision: outcome.revision,
          result: outcome.result,
        })
        return
      case 'success':
        res.status(200).json({
          ok: true,
          revision: outcome.revision,
          result: outcome.result,
          state: outcome.state,
        })
        return
    }
  }),
)

router.post(
  '/sessions',
  asyncHandler(async (req, res) => {
    const parsed = parseCombatStartupBody(req.body)
    if (!parsed.ok) {
      res.status(400).json({ ok: false, error: parsed.error })
      return
    }
    const result = await createPersistedCombatSession(parsed.input)
    if (!result.ok) {
      res.status(400).json(result)
      return
    }
    res.status(200).json({
      ok: true,
      sessionId: result.sessionId,
      revision: result.revision,
      state: result.state,
    })
  }),
)

export default router
