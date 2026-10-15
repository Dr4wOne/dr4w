// @vitest-environment jsdom
import type { Entry } from '@dr4w/contracts'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'

const entry = (name: string, message: string): Entry => ({
  id: crypto.randomUUID(),
  name,
  message,
  createdAt: new Date().toISOString(),
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('lists entries and signs the guestbook', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          const { name, message } = JSON.parse(String(init.body))
          return Response.json(entry(name, message), { status: 201 })
        }
        return Response.json({ items: [entry('Ana', 'hello there')] })
      }),
    )
    render(<App />)
    expect(await screen.findByText('hello there')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bo' } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'nice site' } })
    fireEvent.click(screen.getByText('Sign'))
    expect(await screen.findByText('nice site')).toBeTruthy()
  })
})
