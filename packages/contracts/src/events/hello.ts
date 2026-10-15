import { Note } from '../hello.ts'
import { defineEvent } from './envelope.ts'

export const NoteCreatedV1 = defineEvent({
  source: 'dr4w.hello',
  detailType: 'Note.Created.v1',
  detail: Note.pick({ id: true, title: true, createdAt: true }),
})
