import { publish, validate } from '@dr4w/api-kit'
import { CreateNote, NoteId, UpdateNote } from '@dr4w/contracts'
import { NoteCreatedV1 } from '@dr4w/contracts/events'
import { Hono } from 'hono'
import { z } from 'zod'
import { createNote, deleteNote, getNote, listNotes, updateNote } from '../data/notes.ts'

const byId = validate('param', z.object({ id: NoteId }))
const notFound = { error: 'not_found' } as const

export const notes = new Hono()
  .get('/', async (c) => c.json({ items: await listNotes() }, 200))
  .get('/:id', byId, async (c) => {
    const note = await getNote(c.req.valid('param').id)
    return note ? c.json(note, 200) : c.json(notFound, 404)
  })
  .post('/', validate('json', CreateNote), async (c) => {
    const note = await createNote(c.req.valid('json'))
    await publish(NoteCreatedV1, { id: note.id, title: note.title, createdAt: note.createdAt })
    return c.json(note, 201)
  })
  .patch('/:id', byId, validate('json', UpdateNote), async (c) => {
    const note = await updateNote(c.req.valid('param').id, c.req.valid('json'))
    return note ? c.json(note, 200) : c.json(notFound, 404)
  })
  .delete('/:id', byId, async (c) => {
    return (await deleteNote(c.req.valid('param').id)) ? c.body(null, 204) : c.json(notFound, 404)
  })
