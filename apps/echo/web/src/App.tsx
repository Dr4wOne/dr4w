import { type InferResponseType, unwrap } from '@dr4w/web-kit'
import { ErrorBanner } from '@dr4w/web-kit/ui'
import { useEffect, useState } from 'react'
import { api } from './api.ts'

type Count = InferResponseType<typeof api.count.$get, 200>

const HELLO_URL = import.meta.env.DEV ? 'http://localhost:5173' : 'https://hello.dr4w.io'

export function App() {
  const [data, setData] = useState<Count>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const load = () =>
      unwrap(api.count.$get())
        .then((d) => {
          setData(d)
          setError(undefined)
        })
        .catch((e: Error) => setError(e.message))
    load()
    const timer = setInterval(load, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <main
      style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}
    >
      <h1>echo</h1>
      <p>
        Counts <code>Note.Created.v1</code> events published by <a href={HELLO_URL}>hello</a> on the
        shared bus.
      </p>
      <output
        aria-label="notes created"
        style={{ display: 'block', fontSize: '3rem', margin: '1rem 0' }}
      >
        {data ? data.count : '…'}
      </output>
      {data?.lastTitle && (
        <p>
          Last: <strong>{data.lastTitle}</strong>
          {data.lastAt && ` at ${new Date(data.lastAt).toLocaleString()}`}
        </p>
      )}
      <ErrorBanner>{error}</ErrorBanner>
    </main>
  )
}
