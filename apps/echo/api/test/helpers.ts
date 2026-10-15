import { app } from '../src/app.ts'

/** `app.request` as the Worker would call it (with the origin secret header). */
export function call(path: string, init: RequestInit & { json?: unknown } = {}) {
  const { json, ...rest } = init
  const headers = new Headers(rest.headers)
  headers.set('x-origin-secret', process.env.ORIGIN_SECRET ?? '')
  if (json !== undefined) headers.set('content-type', 'application/json')
  return app.request(path, {
    ...rest,
    headers,
    body: json === undefined ? rest.body : JSON.stringify(json),
  })
}
