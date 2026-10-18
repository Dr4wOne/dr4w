import './rig.generated.css'
import './rig.css'
import { RIG_HTML } from './rig.generated.ts'

/**
 * <dr4w-rig>: Fig. 01, DR4W as a playable CSS rig (v2 rig spec). JS only flips `data-state` and sets
 * `--x` / `--face`; every pose and timing lives in rig.css. Keys act while the stage has focus, so the
 * page never loses its scroll keys: ← → (A/D) move, hold to run, Space/↑ jump, Shift dash, X/J shoot
 * (hold to charge), H hurt. On-screen pad for touch. Event: `rigstate` { state }.
 */
export type RigState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'dash'
  | 'jump'
  | 'fall'
  | 'land'
  | 'shoot'
  | 'charge'
  | 'hurt'
  | 'turn'

// One-shot states and their length in sprite frames (pixel sheet: 8 fps base).
const FRAMES: Partial<Record<RigState, number>> = {
  turn: 2,
  jump: 3,
  fall: 2,
  land: 2,
  shoot: 3,
  dash: 3,
  hurt: 2,
}
const RUN_AFTER = 4 // frames held before a walk becomes a run
const KEYS: Record<string, string> = {
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
  ' ': 'jump',
  ArrowUp: 'jump',
  w: 'jump',
  Shift: 'dash',
  x: 'shoot',
  j: 'shoot',
  h: 'hurt',
}
const PAD = [
  ['left', '◀', 'Move left'],
  ['right', '▶', 'Move right'],
  ['jump', 'Jump', 'Jump'],
  ['dash', 'Dash', 'Dash'],
  ['shoot', 'Shoot', 'Shoot, hold to charge'],
  ['hurt', 'Hit', 'Take a hit'],
] as const

export class Dr4wRig extends HTMLElement {
  state: RigState = 'idle'
  #fig!: HTMLElement
  #body!: HTMLElement
  #live!: HTMLElement
  #held = new Set<string>()
  #busy = 0 // timer of the running one-shot, 0 when free
  #air = false
  #face = 1
  #x = 0
  #moveSince = 0
  #chargeSince = 0
  #raf = 0
  #last = 0
  #dashUntil = 0

  connectedCallback() {
    if (this.childElementCount) return
    this.innerHTML = `
      <div class="rig-stage" tabindex="0" role="application" aria-roledescription="playable figure"
        aria-label="DR4W practice room. Arrow keys move, hold to run. Space jumps, Shift dashes, X shoots: hold to charge. H takes a hit.">
        <div class="rig-floor"></div>
        <div class="rig-body"><div class="fig" data-state="idle">${RIG_HTML}</div></div>
      </div>
      <div class="rig-pad" aria-label="Controls">${PAD.map(([k, t, l]) => `<button type="button" data-key="${k}" aria-label="${l}">${t}</button>`).join('')}</div>
      <p class="rig-live" aria-live="polite"></p>`
    this.#fig = this.querySelector('.fig') as HTMLElement
    this.#body = this.querySelector('.rig-body') as HTMLElement
    this.#live = this.querySelector('.rig-live') as HTMLElement
    const stage = this.querySelector('.rig-stage') as HTMLElement
    stage.addEventListener('keydown', (e) => this.#key(e, true))
    stage.addEventListener('keyup', (e) => this.#key(e, false))
    stage.addEventListener('blur', () => this.release())
    for (const b of this.querySelectorAll<HTMLButtonElement>('.rig-pad button')) {
      const k = b.dataset.key as string
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        b.dataset.held = ''
        this.press(k, true)
      })
      const up = () => {
        if (b.dataset.held === undefined) return
        delete b.dataset.held
        this.press(k, false)
      }
      b.addEventListener('pointerup', up)
      b.addEventListener('pointerleave', up)
      b.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          this.press(k, true)
        }
      })
      b.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.key === ' ') this.press(k, false)
      })
    }
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#raf)
    clearTimeout(this.#busy)
  }

  /** Drive the rig: `down` true on press, false on release (keyboard, pad and tests use this). */
  press(key: string, down: boolean) {
    if (down === this.#held.has(key) && key !== 'jump' && key !== 'dash' && key !== 'hurt') return
    if (down) this.#held.add(key)
    else this.#held.delete(key)
    if (key === 'left' || key === 'right') {
      if (down) {
        const dir = key === 'left' ? -1 : 1
        this.#moveSince = performance.now()
        if (dir !== this.#face) {
          this.#face = dir
          this.#fig.style.setProperty('--face', String(dir))
          this.#fig.style.setProperty('--dir', String(dir))
          if (!this.#air && !this.#busy) {
            this.#loop()
            return this.#oneShot('turn')
          }
        }
      }
      this.#loop()
      return this.#settle()
    }
    if (!down) {
      if (key === 'shoot' && this.state === 'charge') {
        const charged = performance.now() - this.#chargeSince >= this.#ms(7.2) // --dur-charge
        this.#fig.toggleAttribute('data-charged', charged)
        this.#oneShot('shoot', charged ? 'Charged shot.' : 'Shot.')
      }
      this.#held.delete(key)
      return
    }
    this.#held.delete(key) // the rest are presses, not holds (shoot is re-added below)
    if (key === 'jump' && !this.#air) {
      this.#air = true
      this.#oneShot('jump', 'Jump.', () =>
        this.#oneShot('fall', '', () => {
          this.#air = false
          this.#oneShot('land')
        }),
      )
    } else if (key === 'dash' && !this.#busy) {
      this.#dashUntil = performance.now() + this.#ms(FRAMES.dash as number)
      this.#oneShot('dash', 'Dash.')
      this.#loop()
    } else if (key === 'shoot' && !this.#busy) {
      this.#held.add('shoot')
      this.#chargeSince = performance.now()
      this.#set('charge')
    } else if (key === 'hurt') {
      this.#oneShot('hurt', 'Hit taken.')
    }
  }

  /** Let go of everything (focus lost). */
  release() {
    for (const k of [...this.#held]) this.press(k, false)
  }

  #key(e: KeyboardEvent, down: boolean) {
    const k = KEYS[e.key] ?? KEYS[e.key.toLowerCase()]
    if (!k) return
    e.preventDefault()
    if (down && e.repeat) return
    this.press(k, down)
  }

  // A sprite frame in ms, read from the token so CSS and JS agree (0 where styles don't apply, e.g. tests).
  #ms(frames: number) {
    const idle = Number.parseFloat(getComputedStyle(this).getPropertyValue('--dur-idle')) || 0
    return (idle / 25.6) * frames
  }

  #set(s: RigState, say = '') {
    if (this.state === s) return
    this.state = s
    this.#fig.dataset.state = s
    if (say) this.#live.textContent = say
    this.dispatchEvent(new CustomEvent('rigstate', { detail: { state: s }, bubbles: true }))
  }

  #oneShot(s: RigState, say = '', then?: () => void) {
    clearTimeout(this.#busy)
    this.#set(s, say)
    this.#busy = window.setTimeout(
      () => {
        this.#busy = 0
        if (then) then()
        else this.#settle()
      },
      this.#ms(FRAMES[s] ?? 2),
    )
  }

  // Back to the locomotion state that matches the held keys.
  #settle() {
    if (this.#busy || this.#air || this.state === 'charge') return
    const moving = this.#held.has('left') || this.#held.has('right')
    const running = moving && performance.now() - this.#moveSince > this.#ms(RUN_AFTER)
    this.#set(moving ? (running ? 'run' : 'walk') : 'idle')
  }

  // Horizontal motion inside the practice room; runs only while moving or dashing.
  #loop() {
    if (this.#raf) return
    this.#last = performance.now()
    const step = (t: number) => {
      const dt = Math.min(50, t - this.#last) / 1000
      this.#last = t
      const dir = (this.#held.has('right') ? 1 : 0) - (this.#held.has('left') ? 1 : 0)
      const dashing = t < this.#dashUntil
      const w = this.clientWidth
      const speed = dashing ? 1.4 : this.state === 'run' ? 0.55 : 0.28 // stage widths per second
      const v = (dashing ? this.#face : dir) * speed * w
      this.#x = Math.max(-0.32 * w, Math.min(0.32 * w, this.#x + v * dt))
      this.#body.style.setProperty('--x', `${this.#x}px`)
      if (this.state === 'walk') this.#settle() // walk turns into run while held
      this.#raf = dir || dashing ? requestAnimationFrame(step) : 0
    }
    this.#raf = requestAnimationFrame(step)
  }
}

if (!customElements.get('dr4w-rig')) customElements.define('dr4w-rig', Dr4wRig)
