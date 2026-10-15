// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('shows the API health', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ ok: true, project: '__NAME__' })),
    )
    render(<App />)
    expect(await screen.findByText('API ok')).toBeTruthy()
  })
})
