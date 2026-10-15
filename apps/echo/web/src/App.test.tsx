// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('shows the count and the last note', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ count: 3, lastTitle: 'hi', lastAt: '2026-10-15T00:00:00.000Z' }),
      ),
    )
    render(<App />)
    expect((await screen.findByLabelText('notes created')).textContent).toBe('3')
    expect(screen.getByText('hi')).toBeTruthy()
  })

  it('shows API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'x' }, { status: 500 })),
    )
    render(<App />)
    expect((await screen.findByRole('alert')).textContent).toContain('500')
  })
})
