// @vitest-environment node
import type { AddressInfo } from 'node:net'
import express from 'express'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { CombatantInstance } from '@rpg-world-builder/mechanics'

import combatRoutes from './combat.routes'

function minimalCombatant(
  id: string,
  side: CombatantInstance['side'],
  hp: number,
  initMod: number,
): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: side === 'party' ? 'pc' : 'monster', sourceId: id, label: id },
    stats: {
      armorClass: 10,
      maxHitPoints: 20,
      currentHitPoints: hp,
      initiativeModifier: initMod,
      dexterityScore: 10,
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('POST /api/combat/sessions', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/combat', combatRoutes)

  let baseUrl: string
  let server: ReturnType<typeof app.listen>

  beforeAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server = app.listen(0, () => {
          try {
            const addr = server.address() as AddressInfo
            baseUrl = `http://127.0.0.1:${addr.port}`
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      }),
  )

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  )

  it('returns initialized state for a valid body', async () => {
    const res = await fetch(`${baseUrl}/api/combat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        combatants: [minimalCombatant('r1', 'party', 20, 0), minimalCombatant('r2', 'enemies', 20, 1)],
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: boolean; state?: { started: boolean } }
    expect(json.ok).toBe(true)
    expect(json.state?.started).toBe(true)
  })

  it('returns 400 for empty combatants', async () => {
    const res = await fetch(`${baseUrl}/api/combat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ combatants: [] }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { ok: boolean; error?: { code: string } }
    expect(json.ok).toBe(false)
    expect(json.error?.code).toBe('no-combatants')
  })

  it('returns 400 for invalid body', async () => {
    const res = await fetch(`${baseUrl}/api/combat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { ok: boolean; error?: { code: string } }
    expect(json.ok).toBe(false)
    expect(json.error?.code).toBe('invalid-body')
  })
})
