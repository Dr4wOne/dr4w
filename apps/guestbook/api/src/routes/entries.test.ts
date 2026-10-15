import type { Entry } from '@dr4w/contracts'
import { describe, expect, it } from 'vitest'
import { call } from '../../test/helpers.ts'

const sign = async (name: string, message: string) => {
  const res = await call('/api/entries', { method: 'POST', json: { name, message } })
  return { status: res.status, body: (await res.json()) as Entry }
}

describe('/api/entries', () => {
  it('signs the guestbook and lists newest first', async () => {
    const a = await sign('Ana', 'first!')
    const b = await sign('Bo', 'second')
    expect(a.status).toBe(201)
    expect(b.body).toMatchObject({ name: 'Bo', message: 'second' })

    const { items } = (await (await call('/api/entries')).json()) as { items: Entry[] }
    const ids = items.map((e) => e.id)
    expect(ids.indexOf(b.body.id)).toBeLessThan(ids.indexOf(a.body.id))
    expect(items.length).toBeLessThanOrEqual(20)
  })

  it('rejects empty or too-long input', async () => {
    expect((await sign('', 'x')).status).toBe(400)
    expect((await sign('x', '   ')).status).toBe(400)
    expect((await sign('x', 'y'.repeat(281))).status).toBe(400)
  })

  it('requires the origin secret', async () => {
    const { app } = await import('../app.ts')
    expect((await app.request('/api/entries')).status).toBe(403)
  })
})
