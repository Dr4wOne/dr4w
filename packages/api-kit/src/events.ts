import { type EventDef, EventEnvelope, parseEvent } from '@dr4w/contracts/events'
import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import type { z } from 'zod'
import { log } from './log.ts'

export interface EventMeta {
  id: string
  time: string
}

export interface EventRoute {
  key: string
  handle: (raw: unknown) => Promise<void>
}

const keyOf = (source: string, detailType: string) => `${source}|${detailType}`

/** Subscribe a handler to a contract event; the detail is validated before it runs. */
export function onEvent<D extends z.ZodType>(
  def: EventDef<D>,
  fn: (detail: z.infer<D>, meta: EventMeta) => Promise<void>,
): EventRoute {
  return {
    key: keyOf(def.source, def.detailType),
    handle: async (raw) => {
      const env = EventEnvelope.parse(raw)
      await fn(parseEvent(def, raw), { id: env.id, time: env.time })
    },
  }
}

/** Dispatch one envelope. Unknown events are logged and ignored (not retried). */
export async function dispatchEvent(routes: EventRoute[], raw: unknown) {
  const env = EventEnvelope.parse(raw)
  const route = routes.find((r) => r.key === keyOf(env.source, env['detail-type']))
  if (!route) {
    log('warn', 'unhandled event', { source: env.source, detailType: env['detail-type'] })
    return
  }
  await route.handle(raw)
}

const isBusEvent = (e: unknown): e is Record<string, unknown> =>
  typeof e === 'object' && e !== null && 'detail-type' in e && 'source' in e

/**
 * The project's single Lambda entrypoint: API Gateway → Hono app, EventBridge → `routes`.
 * A thrown error makes Lambda/EventBridge retry the event.
 */
// biome-ignore lint/suspicious/noExplicitAny: matches hono/aws-lambda's handle()
export function createLambdaHandler(app: Hono<any, any, any>, routes: EventRoute[] = []) {
  const api = handle(app)
  return async (event: unknown, context: unknown) => {
    if (isBusEvent(event)) return dispatchEvent(routes, event)
    return api(event as Parameters<typeof api>[0], context as Parameters<typeof api>[1])
  }
}

/** Local dev only: POST /api/_events receives envelopes from other projects' `publish()`. */
export function devEventsRoute(routes: EventRoute[]) {
  return new Hono().post('/', async (c) => {
    await dispatchEvent(routes, await c.req.json())
    return c.body(null, 204)
  })
}
