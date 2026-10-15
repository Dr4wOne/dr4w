import { NoteCreatedV1 } from '@dr4w/contracts/events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { publish } from './publish.ts'

const detail = {
  id: '3b241101-e2bb-4255-8caf-4136c566a962',
  title: 't',
  createdAt: '2026-10-14T00:00:00.000Z',
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('publish (local mode)', () => {
  it('POSTs the envelope to each DEV_EVENT_TARGETS url with the origin secret', async () => {
    vi.stubEnv('BUS_NAME', '')
    vi.stubEnv('ORIGIN_SECRET', 'dev')
    vi.stubEnv('DEV_EVENT_TARGETS', 'http://a/api/_events,http://b/api/_events')
    vi.spyOn(console, 'info').mockImplementation(() => {})
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await publish(NoteCreatedV1, detail)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://a/api/_events')
    expect((init.headers as Record<string, string>)['x-origin-secret']).toBe('dev')
    const body = JSON.parse(String(init.body))
    expect(body['detail-type']).toBe('Note.Created.v1')
    expect(body.detail).toEqual(detail)
  })

  it('rejects an invalid detail before sending anything', async () => {
    await expect(publish(NoteCreatedV1, { ...detail, id: 'x' })).rejects.toThrow()
  })
})
