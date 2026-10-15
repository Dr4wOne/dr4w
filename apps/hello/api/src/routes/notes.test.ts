import type { Note } from '@dr4w/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { call } from '../../test/helpers.ts'

afterEach(() => vi.restoreAllMocks())

async function create(title = 'first', body?: string): Promise<Note> {
  const res = await call('/api/notes', { method: 'POST', json: { title, body } })
  expect(res.status).toBe(201)
  return (await res.json()) as Note
}

describe('/api/notes', () => {
  it('requires the origin secret', async () => {
    const { app } = await import('../app.ts')
    expect((await app.request('/api/notes')).status).toBe(403)
  })

  it('creates, reads, updates and deletes a note', async () => {
    const note = await create('hello', 'world')
    expect(note).toMatchObject({ title: 'hello', body: 'world' })

    expect(await (await call(`/api/notes/${note.id}`)).json()).toEqual(note)

    const patched = await call(`/api/notes/${note.id}`, { method: 'PATCH', json: { title: 'hi' } })
    expect(patched.status).toBe(200)
    expect(await patched.json()).toMatchObject({ id: note.id, title: 'hi', body: 'world' })

    expect((await call(`/api/notes/${note.id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await call(`/api/notes/${note.id}`)).status).toBe(404)
  })

  it('lists newest first', async () => {
    const a = await create('a')
    const b = await create('b')
    const { items } = (await (await call('/api/notes')).json()) as { items: Note[] }
    const ids = items.map((n) => n.id)
    expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(a.id))
  })

  it('publishes Note.Created.v1 on create', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.stubEnv('LOG_LEVEL', 'info')
    const note = await create('evented')
    vi.unstubAllEnvs()
    const logged = info.mock.calls.map(([line]) => JSON.parse(String(line)))
    const event = logged.find((l) => l.msg === 'event (local)')?.event
    expect(event).toMatchObject({
      source: 'dr4w.hello',
      'detail-type': 'Note.Created.v1',
      detail: { id: note.id, title: 'evented' },
    })
  })

  it('validates input', async () => {
    expect((await call('/api/notes', { method: 'POST', json: { title: '' } })).status).toBe(400)
    expect((await call('/api/notes/not-a-uuid')).status).toBe(400)
  })

  it('returns 404 for unknown ids', async () => {
    const id = crypto.randomUUID()
    expect((await call(`/api/notes/${id}`)).status).toBe(404)
    expect((await call(`/api/notes/${id}`, { method: 'PATCH', json: { title: 'x' } })).status).toBe(
      404,
    )
    expect((await call(`/api/notes/${id}`, { method: 'DELETE' })).status).toBe(404)
  })
})
