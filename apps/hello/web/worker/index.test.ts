import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env } from './index.ts'

const assets = { fetch: vi.fn(async () => new Response('<html>')) }
const env = {
  ASSETS: assets,
  API_ORIGIN: 'https://api.example',
  ORIGIN_SECRET: 's',
} as unknown as Env
const call = (req: Request, e: Env = env) =>
  worker.fetch(req as Parameters<typeof worker.fetch>[0], e)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('worker', () => {
  it('serves non-api paths from assets', async () => {
    const res = await call(new Request('https://x.dr4w.io/notes/1'))
    expect(await res.text()).toBe('<html>')
  })

  it('proxies /api/* with the secret, replacing any client-sent one', async () => {
    const upstream = vi.fn(async (_url: URL, _init: RequestInit) => Response.json({ ok: true }))
    vi.stubGlobal('fetch', upstream)
    const res = await call(
      new Request('https://x.dr4w.io/api/notes?limit=5', {
        method: 'POST',
        body: '{"title":"a"}',
        headers: { 'x-origin-secret': 'forged' },
      }),
    )
    expect(res.status).toBe(200)
    const [url, init] = upstream.mock.calls[0] ?? []
    expect(String(url)).toBe('https://api.example/api/notes?limit=5')
    const headers = new Headers(init?.headers)
    expect(headers.get('x-origin-secret')).toBe('s')
    expect(headers.get('x-forwarded-host')).toBe('x.dr4w.io')
    expect(init?.method).toBe('POST')
  })

  it('returns 503 when API_ORIGIN is not configured', async () => {
    const res = await call(new Request('https://x.dr4w.io/api/health'), { ...env, API_ORIGIN: '' })
    expect(res.status).toBe(503)
  })
})
