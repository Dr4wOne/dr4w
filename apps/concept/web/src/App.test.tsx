// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'

describe('App', () => {
  it('shows the name as the page heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('DR4W')
  })

  it('lists five chapters and keeps the fifth locked', () => {
    const { container } = render(<App />)
    const summaries = [...container.querySelectorAll('summary')].map((s) => s.textContent)
    expect(summaries).toEqual([
      'Solar Scrap Yard',
      'Dead Signal Tower',
      'Purge Core',
      'Memory Archive',
      'The Crown',
    ])
    const locked = container.querySelector('details.locked')
    expect(locked?.querySelector('.boss')).toBeNull()
    expect(container.textContent).not.toMatch(/Crown Engine/)
  })

  it('has every anchor the links point to', () => {
    const { container } = render(<App />)
    for (const id of ['top', 'premise', 'hunt', 'art']) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull()
    }
  })

  it('keeps colours and durations in tokens.css only', () => {
    const dir = __dirname
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
      (f) => /\.(css|tsx?)$/.test(f) && !f.endsWith('tokens.css') && !f.endsWith('.test.tsx'),
    )
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8')
      expect(src, f).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(src, f).not.toMatch(/\b[1-9]\d*m?s\b/)
    }
  })
})
