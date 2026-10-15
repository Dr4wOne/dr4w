import { NoteCreatedV1 } from '@dr4w/contracts/events'
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { createLambdaHandler, devEventsRoute, onEvent } from './events.ts'

const envelope = {
  id: 'evt-1',
  source: 'dr4w.hello',
  'detail-type': 'Note.Created.v1',
  time: '2026-10-15T00:00:00Z',
  detail: {
    id: '3b241101-e2bb-4255-8caf-4136c566a962',
    title: 't',
    createdAt: '2026-10-15T00:00:00.000Z',
  },
}

describe('createLambdaHandler', () => {
  it('routes EventBridge events to the matching handler with typed detail + meta', async () => {
    const fn = vi.fn(async () => {})
    const handler = createLambdaHandler(new Hono(), [onEvent(NoteCreatedV1, fn)])
    await handler(envelope, {})
    expect(fn).toHaveBeenCalledWith(envelope.detail, { id: 'evt-1', time: envelope.time })
  })

  it('ignores events nobody subscribed to', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const handler = createLambdaHandler(new Hono(), [])
    await expect(handler(envelope, {})).resolves.toBeUndefined()
  })

  it('throws on an invalid detail so EventBridge retries / dead-letters it', async () => {
    const handler = createLambdaHandler(new Hono(), [onEvent(NoteCreatedV1, async () => {})])
    await expect(handler({ ...envelope, detail: { id: 'x' } }, {})).rejects.toThrow()
  })
})

describe('devEventsRoute', () => {
  it('dispatches POSTed envelopes', async () => {
    const fn = vi.fn(async () => {})
    const app = devEventsRoute([onEvent(NoteCreatedV1, fn)])
    const res = await app.request('/', { method: 'POST', body: JSON.stringify(envelope) })
    expect(res.status).toBe(204)
    expect(fn).toHaveBeenCalledOnce()
  })
})
