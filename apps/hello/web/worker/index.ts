export interface Env {
  ASSETS: Fetcher
  API_ORIGIN: string
  ORIGIN_SECRET: string
}

const ORIGIN_HEADER = 'x-origin-secret'

export default {
  fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return proxy(request, url, env)
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>

/** Forward to API Gateway with the origin secret; never trust a client-sent copy of it. */
function proxy(request: Request, url: URL, env: Env): Promise<Response> | Response {
  if (!env.API_ORIGIN) return Response.json({ error: 'api_not_configured' }, { status: 503 })
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.set(ORIGIN_HEADER, env.ORIGIN_SECRET)
  headers.set('x-forwarded-host', url.host)
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  return fetch(new URL(url.pathname + url.search, env.API_ORIGIN), {
    method: request.method,
    headers,
    body: hasBody ? request.body : null,
    redirect: 'manual',
  })
}
