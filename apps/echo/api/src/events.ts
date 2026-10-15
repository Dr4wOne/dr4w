import { type EventRoute, log, onEvent } from '@dr4w/api-kit'
import { NoteCreatedV1 } from '@dr4w/contracts/events'
import { recordNoteCreated } from './data/counter.ts'

// Events this project consumes from dr4w-bus. Each also needs an `event-subscription`
// module block in infra/main.tf (and the provider must expose "events" to us).
export const events: EventRoute[] = [
  onEvent(NoteCreatedV1, async (note, meta) => {
    const counted = await recordNoteCreated(meta.id, note.title, note.createdAt)
    if (!counted) log('info', 'duplicate event ignored', { eventId: meta.id })
  }),
]
