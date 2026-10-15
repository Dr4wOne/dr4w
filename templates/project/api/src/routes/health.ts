import { Hono } from 'hono'

export const health = new Hono().get('/', (c) => c.json({ ok: true, project: '__NAME__' }, 200))
