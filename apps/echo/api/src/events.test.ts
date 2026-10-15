import { describe, expect, it } from 'vitest'
import { call } from '../test/helpers.ts'
import { handler } from './lambda.ts'

const noteCreated = (id: string, title: string) => ({
  id,
  source: 'dr4w.hello',
  'detail-type': 'Note.Created.v1',
  time: '2026-10-15T00:00:00Z',
  detail: { id: crypto.randomUUID(), title, createdAt: '2026-10-15T00:00:00.000Z' },
})

const readCount = async () =>
  (await (await call('/api/count')).json()) as { count: number; lastTitle: string | null }

describe('Note.Created.v1 → counter', () => {
  it('counts each event once, even when EventBridge redelivers it', async () => {
    const before = (await readCount()).count
    const event = noteCreated(crypto.randomUUID(), 'first')

    await handler(event, {})
    await handler(event, {}) // duplicate delivery
    await handler(noteCreated(crypto.randomUUID(), 'second'), {})

    const after = await readCount()
    expect(after.count).toBe(before + 2)
    expect(after.lastTitle).toBe('second')
  })

  it('rejects malformed events so they are retried / dead-lettered', async () => {
    await expect(
      handler({ ...noteCreated('x', 't'), detail: { id: 'nope' } }, {}),
    ).rejects.toThrow()
  })

  it('GET /api/count requires the origin secret', async () => {
    const { app } = await import('./app.ts')
    expect((await app.request('/api/count')).status).toBe(403)
  })
})
