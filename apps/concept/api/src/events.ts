import type { EventRoute } from '@dr4w/api-kit'

// Events this project consumes from dr4w-bus, e.g.
//   onEvent(NoteCreatedV1, async (detail, meta) => { … })
// Each also needs an `event-subscription` module block in infra/main.tf.
export const events: EventRoute[] = []
