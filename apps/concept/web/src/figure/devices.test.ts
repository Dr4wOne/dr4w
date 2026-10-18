// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DeviceFigure } from './device.ts'
import './dr4w-cannon.ts'
import './dr4w-tube.ts'

const make = (tag: string) => {
  const el = document.createElement(tag) as DeviceFigure
  document.body.append(el)
  return el
}
const btn = (el: Element, id: string) =>
  el.querySelector(`[data-part="${id}"]`) as HTMLButtonElement

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('device figures', () => {
  it.each([
    ['dr4w-cannon', ['Charge and fire', 'Heat vents', 'Sight']],
    ['dr4w-tube', ['Drain', 'Clamps', 'Glass', 'Wake']],
  ])('%s has at least two named, operable parts', (tag, labels) => {
    const el = make(tag)
    expect([...el.querySelectorAll('.dev-btn')].map((b) => b.textContent)).toEqual(labels)
    for (const p of el.parts) expect(el.state(p.id)).toBe(p.states[0])
  })

  it('cycles every state of every cycle part and announces it', () => {
    for (const tag of ['dr4w-cannon', 'dr4w-tube']) {
      const el = make(tag)
      for (const p of el.parts.filter((x) => !x.hold)) {
        const seen = new Set([el.state(p.id)])
        for (let i = 0; i < p.states.length; i++) {
          btn(el, p.id).click()
          seen.add(el.state(p.id))
        }
        expect([...seen].sort(), `${tag} ${p.id}`).toEqual([...p.states].sort())
      }
      expect(el.querySelector('.dev-live')?.textContent).toMatch(/: /)
    }
  })

  it('charges the cannon while held, fires on release, then rests', () => {
    vi.useFakeTimers()
    const el = make('dr4w-cannon')
    const b = btn(el, 'charge')
    b.dispatchEvent(new Event('pointerdown'))
    expect(el.state('charge')).toBe('charging')
    expect(b.getAttribute('aria-pressed')).toBe('true')
    b.dispatchEvent(new Event('pointerup'))
    expect(el.state('charge')).toBe('fired')
    vi.advanceTimersByTime(10)
    expect(el.state('charge')).toBe('ready')
  })

  it('wakes DR4W inside the tube with the HUD text as live text', () => {
    const el = make('dr4w-tube')
    expect(el.querySelector('.tb-panel')?.textContent).toMatch(
      /UNIT: DR4W.*HUNT PROTOCOL: ACTIVE.*MISSION: SURVIVE/s,
    )
    expect(el.querySelectorAll('.tb-unit .dr4w .g').length).toBe(10)
  })
})
