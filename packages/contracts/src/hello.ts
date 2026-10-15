import { z } from 'zod'

export const NoteId = z.uuid()

export const Note = z.object({
  id: NoteId,
  title: z.string().min(1).max(200),
  body: z.string().max(5000),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type Note = z.infer<typeof Note>

export const CreateNote = Note.pick({ title: true, body: true }).partial({ body: true })
export type CreateNote = z.infer<typeof CreateNote>

export const UpdateNote = CreateNote.partial()
export type UpdateNote = z.infer<typeof UpdateNote>
