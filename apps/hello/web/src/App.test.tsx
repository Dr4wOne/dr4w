// @vitest-environment jsdom
import type { Note } from '@dr4w/contracts'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'

const note = (title: string): Note => ({
  id: crypto.randomUUID(),
  title,
  body: '',
  createdAt: '2026-10-14T00:00:00.000Z',
  updatedAt: '2026-10-14T00:00:00.000Z',
})

/** Minimal in-memory /api/notes for the typed client to talk to. */
function fakeApi(initial: Note[]) {
  let notes = [...initial]
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const method = init?.method ?? 'GET'
    if (method === 'GET') return Response.json({ items: notes })
    if (method === 'POST') {
      const created = note(JSON.parse(String(init?.body)).title)
      notes = [created, ...notes]
      return Response.json(created, { status: 201 })
    }
    if (method === 'DELETE') {
      notes = notes.filter((n) => !url.pathname.endsWith(n.id))
      return new Response(null, { status: 204 })
    }
    return new Response(null, { status: 405 })
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('lists notes from the API', async () => {
    vi.stubGlobal('fetch', fakeApi([note('existing')]))
    render(<App />)
    expect(await screen.findByText('existing')).toBeTruthy()
  })

  it('creates a note', async () => {
    vi.stubGlobal('fetch', fakeApi([]))
    render(<App />)
    await screen.findByText('No notes yet.')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'new one' } })
    fireEvent.click(screen.getByText('Add note'))
    expect(await screen.findByText('new one')).toBeTruthy()
  })

  it('deletes a note', async () => {
    vi.stubGlobal('fetch', fakeApi([note('doomed')]))
    render(<App />)
    fireEvent.click(await screen.findByLabelText('Delete doomed'))
    expect(await screen.findByText('No notes yet.')).toBeTruthy()
  })

  it('shows API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'forbidden' }, { status: 403 })),
    )
    render(<App />)
    expect((await screen.findByRole('alert')).textContent).toContain('403')
  })
})
