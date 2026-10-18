// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Dr4wFigure, GEAR, type Gear } from './dr4w-figure.ts'

let fig: Dr4wFigure
const btn = (id: string) => fig.querySelector(`#gear-${id}`) as HTMLButtonElement
const live = () => fig.querySelector('.d4-live')?.textContent

beforeEach(() => {
  fig = document.createElement('dr4w-figure') as Dr4wFigure
  document.body.append(fig)
})
afterEach(() => {
  fig.remove()
  history.replaceState(null, '', '/')
})

describe('<dr4w-figure>', () => {
  it('renders one named button per gear piece, all at rest', () => {
    const buttons = [...fig.querySelectorAll('button')]
    expect(buttons.map((b) => b.textContent)).toEqual(GEAR.map((g) => g.label))
    for (const g of GEAR) {
      expect(fig.state(g.id)).toBe(g.states[0])
      expect(btn(g.id).getAttribute('aria-pressed')).toBe('false')
    }
  })

  it('cycles the antenna through its states and announces each one', () => {
    const seen = []
    for (let i = 0; i < 4; i++) {
      btn('antenna').click()
      seen.push(fig.state('antenna'))
    }
    expect(seen).toEqual(['listening', 'transmitting', 'holding', 'quiet'])
    btn('antenna').click()
    expect(btn('antenna').dataset.state).toBe('listening')
    expect(btn('antenna').getAttribute('aria-pressed')).toBe('true')
    expect(live()).toBe('Antenna: listening. Static… static… still here.')
  })

  it('reaches every state of every gear piece', () => {
    vi.useFakeTimers()
    for (const g of GEAR) {
      const seen = new Set([fig.state(g.id)])
      for (let i = 0; i < g.states.length + 1; i++) {
        btn(g.id).click()
        seen.add(fig.state(g.id))
        vi.advanceTimersByTime(0) // the fired cannon re-arms itself
      }
      expect([...seen].sort(), g.id).toEqual([...g.states].sort())
    }
    vi.useRealTimers()
  })

  it('enters hunt mode when every piece is active, and Esc resets', () => {
    const onHunt = vi.fn()
    fig.addEventListener('huntmode', onHunt)
    for (const g of GEAR) btn(g.id).click()
    expect(onHunt).toHaveBeenCalledOnce()
    expect((fig.querySelector('.d4-hunt') as HTMLElement).hidden).toBe(false)
    btn('core').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    for (const g of GEAR) expect(fig.state(g.id)).toBe(g.states[0])
    expect(fig.dataset.hunt).toBe('off')
  })

  it('moves focus with the arrow keys, wrapping around', () => {
    btn('antenna').focus()
    btn('antenna').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(document.activeElement).toBe(btn((GEAR.at(-1) as Gear).id))
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
    expect(document.activeElement).toBe(btn('antenna'))
  })

  it('opens a #gear-<id> deep link: focus, operate, then clear the hash', () => {
    location.hash = '#gear-antenna'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(document.activeElement).toBe(btn('antenna'))
    expect(fig.state('antenna')).toBe('listening')
    expect(location.hash).toBe('')
  })
})
