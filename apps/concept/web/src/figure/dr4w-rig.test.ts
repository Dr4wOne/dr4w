// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Dr4wRig, RigState } from './dr4w-rig.ts'
import './dr4w-rig.ts'

let rig: Dr4wRig
const fig = () => rig.querySelector('.fig') as HTMLElement
// jsdom has no styles, so every frame length is 0 ms: one tick finishes a one-shot.
const tick = () => vi.advanceTimersByTime(20)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
  rig = document.createElement('dr4w-rig') as Dr4wRig
  document.body.append(rig)
})
afterEach(() => {
  rig.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('<dr4w-rig>', () => {
  it('builds the rig, the stage and a labelled pad', () => {
    expect(rig.querySelectorAll('.j').length).toBeGreaterThan(10)
    expect(rig.querySelector('.rig-stage')?.getAttribute('tabindex')).toBe('0')
    const labels = [...rig.querySelectorAll('.rig-pad button')].map((b) =>
      b.getAttribute('aria-label'),
    )
    expect(labels).toEqual([
      'Move left',
      'Move right',
      'Jump',
      'Dash',
      'Shoot, hold to charge',
      'Take a hit',
    ])
    expect(fig().dataset.state).toBe('idle')
  })

  it('reaches all eleven states', () => {
    const seen = new Set<RigState>([rig.state])
    rig.addEventListener('rigstate', (e) => seen.add((e as CustomEvent).detail.state))
    rig.press('right', true) // walk, then run once held (0 ms threshold in jsdom)
    tick()
    rig.press('right', false)
    tick()
    rig.press('left', true) // turn first: facing changes
    tick()
    rig.press('left', false)
    tick()
    rig.press('jump', true) // jump → fall → land
    tick()
    tick()
    tick()
    rig.press('dash', true)
    tick()
    rig.press('shoot', true) // charge while held, shoot on release
    rig.press('shoot', false)
    tick()
    rig.press('hurt', true)
    tick()
    rig.press('right', true)
    expect([...seen].sort()).toEqual([
      'charge',
      'dash',
      'fall',
      'hurt',
      'idle',
      'jump',
      'land',
      'run',
      'shoot',
      'turn',
      'walk',
    ])
  })

  it('mirrors the figure when it turns', () => {
    rig.press('left', true)
    expect(rig.state).toBe('turn')
    expect(fig().style.getPropertyValue('--face')).toBe('-1')
  })

  it('lands back in idle after a jump', () => {
    rig.press('jump', true)
    expect(rig.state).toBe('jump')
    vi.advanceTimersToNextTimer()
    expect(rig.state).toBe('fall')
    vi.advanceTimersToNextTimer()
    expect(rig.state).toBe('land')
    vi.advanceTimersToNextTimer()
    expect(rig.state).toBe('idle')
  })

  it('marks a held shot as charged and announces it', () => {
    rig.press('shoot', true)
    expect(rig.state).toBe('charge')
    rig.press('shoot', false)
    expect(rig.state).toBe('shoot')
    expect(fig().hasAttribute('data-charged')).toBe(true) // 0 ms charge time in jsdom
    expect(rig.querySelector('.rig-live')?.textContent).toBe('Charged shot.')
  })

  it('maps keys only while the stage has focus, and lets go on blur', () => {
    const stage = rig.querySelector('.rig-stage') as HTMLElement
    stage.focus()
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(['walk', 'run']).toContain(rig.state)
    stage.dispatchEvent(new FocusEvent('blur'))
    expect(rig.state).toBe('idle')
  })
})
