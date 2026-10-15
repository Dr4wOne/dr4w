import type { Hono } from 'hono'
import { type ClientResponse, hc } from 'hono/client'
import type { SuccessStatusCode } from 'hono/utils/http-status'

/** Typed client for a project's Hono app. Same origin: the Worker proxies `/api/*`. */
// biome-ignore lint/suspicious/noExplicitAny: matches Hono's own generic constraint
export const createApi = <App extends Hono<any, any, any>>(baseUrl = '/') => hc<App>(baseUrl)

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API error ${status}`)
    this.name = 'ApiError'
  }
}

type SuccessJson<R> =
  R extends ClientResponse<infer T, infer S, 'json'>
    ? S extends SuccessStatusCode
      ? T
      : never
    : never

/** Await a client call; return the success JSON body or throw `ApiError`. */
// biome-ignore lint/suspicious/noExplicitAny: accepts any typed client response
export async function unwrap<R extends ClientResponse<any, any, any>>(
  call: Promise<R>,
): Promise<SuccessJson<R>> {
  const res = await call
  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body)
  return body as SuccessJson<R>
}
