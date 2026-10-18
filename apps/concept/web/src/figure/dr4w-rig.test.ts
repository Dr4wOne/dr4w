// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Dr4wRig, RigState } from './dr4w-rig.ts'
import './dr4w-rig.ts'

let rig: Dr4wRig
const fig = () => rig.querySelector('.dr4w') as HTMLElement
const g = (id: string) => rig.querySelector(`.g-${id}`) as HTMLElement
// jsdom has no styles, so every frame length is 0 ms: one tick finishes a one-shot.
const tick = () => vi.advanceTimersByTime(20)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  rig = document.createElement('dr4w-rig') as Dr4wRig
  document.body.append(rig)
})
afterEach(() => {
  rig.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('<dr4w-rig>', () => {
  it('builds the ten-part pixel rig, a part button each, and a labelled pad', () => {
    expect(rig.querySelectorAll('.dr4w .g').length).toBe(10)
    expect(rig.querySelectorAll('.dr4w .hs').length).toBe(10)
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
      'Slash',
      'Separate the parts',
    ])
    expect(fig().dataset.state).toBe('idle')
  })

  it('reaches all eleven body states', () => {
    const seen = new Set<RigState>([rig.state])
    rig.addEventListener('rigstate', (e) => seen.add((e as CustomEvent).detail.state))
    rig.press('right', true) // walk, then run once held
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
    expect((rig.querySelector('.rig-body') as HTMLElement).style.transform).toContain('scaleX(-1)')
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

  it('charges the cannon while held, fires a charged shot, then cools it', () => {
    rig.press('shoot', true)
    expect(rig.state).toBe('charge')
    expect(g('cannon').dataset.charge).toBe('1')
    rig.press('shoot', false)
    expect(rig.state).toBe('shoot')
    expect(g('cannon').dataset.charge).toBe('cool')
    expect(fig().hasAttribute('data-charged')).toBe(true) // 0 ms charge time in jsdom
    expect(rig.querySelector('.rig-live')?.textContent).toBe('Charged shot.')
  })

  it('runs the part actions: visor, heat, core, aim, antenna, parts, slash', () => {
    for (const k of ['visor', 'heat', 'core', 'aim', 'antenna', 'explode', 'slash'])
      rig.press(k, true)
    expect(g('head').dataset.visor).toBe('cyan')
    expect(g('blade').dataset.heat).toBe('0')
    expect(g('torso').dataset.core).toBe('pulse')
    expect(g('arm_cannon').dataset.aim).toBe('1')
    expect(g('antenna').dataset.ext).toBe('0')
    expect(fig().hasAttribute('data-explode')).toBe(true)
    expect(g('arm_blade').hasAttribute('data-swing')).toBe(true)
  })

  it('makes every part a button that does what the part does', () => {
    ;(rig.querySelector('.hs-head') as HTMLButtonElement).click()
    expect(g('head').dataset.visor).toBe('cyan')
    ;(rig.querySelector('.hs-pelvis') as HTMLButtonElement).click()
    expect(rig.state).toBe('jump')
  })

  it('maps keys only while the stage has focus, and lets go when focus leaves', () => {
    const stage = rig.querySelector('.rig-stage') as HTMLElement
    stage.focus()
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(['walk', 'run']).toContain(rig.state)
    stage.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(rig.state).toBe('idle')
  })
})
