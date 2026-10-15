import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'
import type { EventDef, EventEnvelope } from '@dr4w/contracts/events'
import type { z } from 'zod'
import { log } from './log.ts'
import { ORIGIN_HEADER } from './origin-secret.ts'

let bridge: EventBridgeClient | undefined

/**
 * Publish a contract event.
 * - `BUS_NAME` set (Lambda): PutEvents on the shared bus.
 * - otherwise (local dev): log it and POST the envelope to each URL in `DEV_EVENT_TARGETS`
 *   (comma-separated, e.g. `http://localhost:8788/api/_events`). Delivery failures only warn.
 */
export async function publish<D extends z.ZodType>(def: EventDef<D>, detail: z.input<D>) {
  const parsed = def.detail.parse(detail)
  const bus = process.env.BUS_NAME
  if (bus) {
    bridge ??= new EventBridgeClient({})
    const res = await bridge.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: bus,
            Source: def.source,
            DetailType: def.detailType,
            Detail: JSON.stringify(parsed),
          },
        ],
      }),
    )
    if (res.FailedEntryCount) throw new Error(`PutEvents failed: ${res.Entries?.[0]?.ErrorCode}`)
    return
  }

  const envelope: EventEnvelope = {
    id: crypto.randomUUID(),
    source: def.source,
    'detail-type': def.detailType,
    time: new Date().toISOString(),
    detail: parsed,
  }
  log('info', 'event (local)', { event: envelope })
  const targets = (process.env.DEV_EVENT_TARGETS ?? '').split(',').filter(Boolean)
  await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            [ORIGIN_HEADER]: process.env.ORIGIN_SECRET ?? '',
          },
          body: JSON.stringify(envelope),
        })
        if (!res.ok) log('warn', 'local event delivery failed', { url, status: res.status })
      } catch (err) {
        log('warn', 'local event target unreachable', { url, error: String(err) })
      }
    }),
  )
}
