import { describe, expect, it } from 'vitest'
import { call } from '../../test/helpers.ts'

describe('GET /api/stats', () => {
  it('counts entries', async () => {
    const before = (await (await call('/api/stats')).json()) as { total: number }
    await call('/api/entries', { method: 'POST', json: { name: 'S', message: 'count me' } })
    const after = (await (await call('/api/stats')).json()) as { total: number }
    // ≥: other test files insert into the same table in parallel
    expect(after.total).toBeGreaterThanOrEqual(before.total + 1)
  })

  it('requires the origin secret', async () => {
    const { app } = await import('../app.ts')
    expect((await app.request('/api/stats')).status).toBe(403)
  })
})
