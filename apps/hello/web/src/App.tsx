import type { Note } from '@dr4w/contracts'
import { unwrap } from '@dr4w/web-kit'
import { Button, ErrorBanner, Field } from '@dr4w/web-kit/ui'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { api } from './api.ts'

export function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string>()

  const guard = useCallback((p: Promise<unknown>) => p.catch((e: Error) => setError(e.message)), [])
  const refresh = useCallback(
    () => guard(unwrap(api.notes.$get()).then((r) => setNotes(r.items))),
    [guard],
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = (e: FormEvent) => {
    e.preventDefault()
    setError(undefined)
    guard(
      unwrap(api.notes.$post({ json: { title, body } })).then((note) => {
        setNotes((ns) => [note, ...ns])
        setTitle('')
        setBody('')
      }),
    )
  }

  const remove = (id: string) =>
    guard(
      unwrap(api.notes[':id'].$delete({ param: { id } })).then(() =>
        setNotes((ns) => ns.filter((n) => n.id !== id)),
      ),
    )

  return (
    <main
      style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}
    >
      <h1>Notes</h1>
      <form onSubmit={add} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Field label="Body" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit" disabled={!title.trim()}>
          Add note
        </Button>
      </form>
      <ErrorBanner>{error}</ErrorBanner>
      {notes.length === 0 ? (
        <p>No notes yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {notes.map((n) => (
            <li key={n.id} style={{ borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
              <strong>{n.title}</strong>
              {n.body && <p style={{ margin: '4px 0' }}>{n.body}</p>}
              <Button onClick={() => remove(n.id)} aria-label={`Delete ${n.title}`}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
