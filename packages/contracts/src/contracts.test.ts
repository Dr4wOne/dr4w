import { describe, expect, it } from 'vitest'
import { NoteCreatedV1, parseEvent } from './events/index.ts'
import { CreateNote } from './index.ts'

describe('CreateNote', () => {
  it('accepts a title-only note', () => {
    expect(CreateNote.parse({ title: 'hi' })).toEqual({ title: 'hi' })
  })
  it('rejects an empty title', () => {
    expect(CreateNote.safeParse({ title: '' }).success).toBe(false)
  })
})

describe('parseEvent', () => {
  const envelope = {
    id: '1',
    source: 'dr4w.hello',
    'detail-type': 'Note.Created.v1',
    time: '2026-10-14T00:00:00Z',
    detail: {
      id: '3b241101-e2bb-4255-8caf-4136c566a962',
      title: 't',
      createdAt: '2026-10-14T00:00:00.000Z',
    },
  }

  it('returns the typed detail', () => {
    expect(parseEvent(NoteCreatedV1, envelope).title).toBe('t')
  })
  it('rejects another detail-type', () => {
    expect(() =>
      parseEvent(NoteCreatedV1, { ...envelope, 'detail-type': 'Note.Created.v2' }),
    ).toThrow()
  })
  it('rejects an invalid detail', () => {
    expect(() => parseEvent(NoteCreatedV1, { ...envelope, detail: { id: 'x' } })).toThrow()
  })
})
