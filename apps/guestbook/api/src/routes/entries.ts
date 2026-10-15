import { validate } from '@dr4w/api-kit'
import { CreateEntry } from '@dr4w/contracts'
import { Hono } from 'hono'
import { createEntry, latestEntries } from '../data/entries.ts'

export const entries = new Hono()
  .get('/', async (c) => c.json({ items: await latestEntries(20) }, 200))
  .post('/', validate('json', CreateEntry), async (c) =>
    c.json(await createEntry(c.req.valid('json')), 201),
  )
