import { Hono } from 'hono'
import { getNoteCount } from '../data/counter.ts'

export const count = new Hono().get('/', async (c) => c.json(await getNoteCount(), 200))
