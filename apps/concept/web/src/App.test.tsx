// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'

// jsdom has no IntersectionObserver or matchMedia; the page only needs them for motion.
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
})

describe('App', () => {
  it('shows the title lockup as the page heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('DR4WIRON HUNT')
  })

  it('lists five stages and keeps the fifth a tease', () => {
    const { container } = render(<App />)
    const names = [...container.querySelectorAll('.node-name')].map((n) => n.textContent)
    expect(names).toEqual([
      'Solar Scrap Yard',
      'Dead Signal Tower',
      'Purge Core',
      'Memory Archive',
      'The Crown',
    ])
    expect(container.textContent).not.toMatch(/Crown Engine/)
  })

  it('has every anchor the links point to', () => {
    const { container } = render(<App />)
    for (const id of ['main', 'figures', 'story', 'hunt', 'bosses', 'spec', 'archive']) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull()
    }
  })

  it('gives the antenna no special call to action (D4)', () => {
    const { container } = render(<App />)
    expect(container.textContent).not.toMatch(/Tune the antenna|Listen/)
  })

  it('shows no Portuguese HUD text (D3)', () => {
    const { container } = render(<App />)
    expect(container.textContent).not.toMatch(/UNIDADE|PROTOCOLO|MISSÃO|FUNÇÃO|OBEDECER|ESCOLHA/)
  })

  it('keeps colours and durations in tokens.css only', () => {
    const dir = __dirname
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
      (f) => /\.(css|tsx?)$/.test(f) && !f.endsWith('tokens.css') && !f.endsWith('.test.tsx'),
    )
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8')
      // Colours can only hide in CSS or JSX; .ts files use #private fields that look like hex.
      if (!f.endsWith('.ts')) expect(src, f).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(src, f).not.toMatch(/\b[1-9]\d*m?s\b/)
    }
  })
})
