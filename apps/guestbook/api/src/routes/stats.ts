import type { GuestbookStats } from '@dr4w/contracts'
import { Hono } from 'hono'
import { countEntries } from '../data/entries.ts'

export const stats = new Hono().get('/', async (c) =>
  c.json({ total: await countEntries() } satisfies GuestbookStats, 200),
)
