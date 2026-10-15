import { z } from 'zod'

/**
 * Cross-project event contract (see docs/architecture.md §6).
 * source      = "dr4w.<project>"
 * detail-type = "<Entity>.<Event>.v<N>"   — breaking change ⇒ new version
 */
export interface EventDef<D extends z.ZodType> {
  source: `dr4w.${string}`
  detailType: `${string}.${string}.v${number}`
  detail: D
}

export const defineEvent = <D extends z.ZodType>(def: EventDef<D>) => def

/** The subset of an EventBridge event our consumers rely on. Local dev sends the same shape. */
export const EventEnvelope = z.object({
  id: z.string(),
  source: z.string(),
  'detail-type': z.string(),
  time: z.string(),
  detail: z.unknown(),
})
export type EventEnvelope = z.infer<typeof EventEnvelope>

/** Validates an incoming envelope against an event definition; throws on mismatch. */
export function parseEvent<D extends z.ZodType>(def: EventDef<D>, raw: unknown): z.infer<D> {
  const env = EventEnvelope.parse(raw)
  if (env.source !== def.source || env['detail-type'] !== def.detailType) {
    throw new Error(`Unexpected event ${env.source}/${env['detail-type']}`)
  }
  return def.detail.parse(env.detail)
}
