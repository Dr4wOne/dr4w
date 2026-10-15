import type { Entry } from '@dr4w/contracts'
import { unwrap } from '@dr4w/web-kit'
import { Button, ErrorBanner, Field } from '@dr4w/web-kit/ui'
import { type FormEvent, useEffect, useState } from 'react'
import { api } from './api.ts'

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(iso).toLocaleDateString()
}

export function App() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    unwrap(api.entries.$get())
      .then((r) => setEntries(r.items))
      .catch((e: Error) => setError(e.message))
  }, [])

  const sign = (e: FormEvent) => {
    e.preventDefault()
    setError(undefined)
    unwrap(api.entries.$post({ json: { name, message } }))
      .then((entry) => {
        setEntries((es) => [entry, ...es].slice(0, 20))
        setMessage('')
      })
      .catch((err: Error) => setError(err.message))
  }

  return (
    <main
      style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}
    >
      <h1>Guestbook</h1>
      <form onSubmit={sign} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <Field
          label="Name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="Message"
          value={message}
          maxLength={280}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <Button type="submit" disabled={!name.trim() || !message.trim()}>
          Sign
        </Button>
      </form>
      <ErrorBanner>{error}</ErrorBanner>
      {entries.length === 0 ? (
        <p>Be the first to sign.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {entries.map((e) => (
            <li key={e.id} style={{ borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
              <strong>{e.name}</strong> <small>· {ago(e.createdAt)}</small>
              <p style={{ margin: '4px 0' }}>{e.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
