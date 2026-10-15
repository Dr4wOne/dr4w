import { unwrap } from '@dr4w/web-kit'
import { ErrorBanner } from '@dr4w/web-kit/ui'
import { useEffect, useState } from 'react'
import { api } from './api.ts'

export function App() {
  const [status, setStatus] = useState('checking…')
  const [error, setError] = useState<string>()

  useEffect(() => {
    unwrap(api.health.$get())
      .then((h) => setStatus(h.ok ? 'API ok' : 'API not ok'))
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <main
      style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}
    >
      <h1>__NAME__</h1>
      <p>{status}</p>
      <ErrorBanner>{error}</ErrorBanner>
    </main>
  )
}
