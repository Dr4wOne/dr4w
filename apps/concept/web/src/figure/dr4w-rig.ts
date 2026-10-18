import './rig.css'
import { type RigPart, rigMarkup } from './pixel/rig-markup.ts'

/**
 * <dr4w-rig>: Fig. 01, DR4W as a playable pixel-CSS rig (Daniel's dr4w-css parts). JS only flips data
 * attributes and sets --x / --face / --zoom; every motion lives in rig.css. Keys act while the stage
 * has focus, so the page keeps its scroll keys (D25): ← → move (hold to run), Space/↑ jump, Shift dash,
 * F/J shoot (hold to charge), X hit, S slash, H blade heat, V visor, C core, R aim, A antenna, E parts.
 * Every part is also a button. Event: `rigstate` { state }.
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
  hurt: 4,
}
const RUN_AFTER = 4 // frames held before a walk becomes a run
const FIG_W = 142 // generated figure box, CSS px (rig.generated.css)
const FIG_H = 197
const KEYS: Record<string, string> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ' ': 'jump',
  ArrowUp: 'jump',
  Shift: 'dash',
  f: 'shoot',
  j: 'shoot',
  x: 'hurt',
  s: 'slash',
  h: 'heat',
  v: 'visor',
  c: 'core',
  r: 'aim',
  a: 'antenna',
  e: 'explode',
}
const PAD = [
  ['left', '◀', 'Move left'],
  ['right', '▶', 'Move right'],
  ['jump', 'Jump', 'Jump'],
  ['dash', 'Dash', 'Dash'],
  ['shoot', 'Shoot', 'Shoot, hold to charge'],
  ['slash', 'Slash', 'Slash'],
  ['explode', 'Parts', 'Separate the parts'],
] as const
// Tapping a part does what that part does.
const PART_KEY: Record<RigPart, string> = {
  head: 'visor',
  antenna: 'antenna',
  cannon: 'shoot',
  arm_cannon: 'aim',
  arm_blade: 'slash',
  blade: 'heat',
  torso: 'core',
  pelvis: 'jump',
  leg_l: 'dash',
  leg_r: 'dash',
}
const HOLDS = new Set(['left', 'right', 'shoot'])

export class Dr4wRig extends HTMLElement {
  state: RigState = 'idle'
  #fig!: HTMLElement
  #body!: HTMLElement
  #live!: HTMLElement
  #g: Record<string, HTMLElement> = {}
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
  #blink = 0
  #resize?: ResizeObserver
  #pulses = new Map<string, number>() // one running timer per part + attribute

  connectedCallback() {
    if (this.childElementCount) return
    this.innerHTML = `
      <div class="rig-stage" tabindex="0" role="application" aria-roledescription="playable figure"
        aria-label="DR4W practice room. Arrow keys move, hold to run. Space jumps, Shift dashes, F shoots: hold to charge. S slashes, H heats the blade, V switches the visor, C overloads the core, R aims, A moves the antenna, E separates the parts, X takes a hit.">
        <div class="rig-floor"></div>
        <div class="rig-body"><div class="rig-zoom">${rigMarkup()}</div></div>
      </div>
      <div class="rig-pad" aria-label="Controls">${PAD.map(([k, t, l]) => `<button type="button" data-key="${k}" aria-label="${l}">${t}</button>`).join('')}</div>
      <p class="rig-live" aria-live="polite"></p>`
    this.#fig = this.querySelector('.dr4w') as HTMLElement
    this.#body = this.querySelector('.rig-body') as HTMLElement
    this.#live = this.querySelector('.rig-live') as HTMLElement
    for (const g of this.querySelectorAll<HTMLElement>('.g'))
      this.#g[g.classList[1]?.slice(2) ?? ''] = g
    const stage = this.querySelector('.rig-stage') as HTMLElement
    stage.addEventListener('keydown', (e) => this.#key(e, true))
    stage.addEventListener('keyup', (e) => this.#key(e, false))
    stage.addEventListener('focusout', (e) => {
      if (!stage.contains(e.relatedTarget as Node)) this.release()
    })
    this.#fig.addEventListener('click', (e) => {
      const part = (e.target as Element).closest<HTMLElement>('.hs')?.dataset.part as
        | RigPart
        | undefined
      if (!part) return
      const k = PART_KEY[part]
      this.press(k, true)
      if (HOLDS.has(k)) this.press(k, false)
    })
    for (const b of this.querySelectorAll<HTMLButtonElement>('.rig-pad button')) {
      const k = b.dataset.key as string
      const down = (e: Event) => {
        e.preventDefault()
        b.dataset.held = ''
        this.press(k, true)
      }
      const up = () => {
        if (b.dataset.held === undefined) return
        delete b.dataset.held
        this.press(k, false)
      }
      b.addEventListener('pointerdown', down)
      b.addEventListener('pointerup', up)
      b.addEventListener('pointerleave', up)
      b.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) down(e)
      })
      b.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.key === ' ') up()
      })
    }
    // Whole-number zoom keeps every box-shadow pixel crisp.
    if (typeof ResizeObserver !== 'undefined') {
      this.#resize = new ResizeObserver(([e]) => {
        const r = e?.contentRect
        if (!r) return
        const z = Math.max(
          1,
          Math.min(5, Math.floor(Math.min((r.height * 0.82) / FIG_H, (r.width * 0.9) / FIG_W))),
        )
        this.#body.style.setProperty('--zoom', String(z))
      })
      this.#resize.observe(stage)
    }
    // Idle life: an occasional blink.
    if (!matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.#blink = window.setInterval(
        () => this.#pulse(this.#g.head, 'data-blink', this.#ms(1.1)),
        this.#ms(30) || 3800,
      )
    }
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#raf)
    clearTimeout(this.#busy)
    clearInterval(this.#blink)
    this.#resize?.disconnect()
  }

  /** Drive the rig: `down` true on press, false on release (keyboard, pad, parts and tests use this). */
  press(key: string, down: boolean) {
    if (HOLDS.has(key) && down === this.#held.has(key)) return
    if (key === 'left' || key === 'right') return this.#move(key, down)
    if (key === 'shoot') return down ? this.#shootDown() : this.#shootUp()
    if (!down) return
    const act: Record<string, () => void> = {
      jump: () => {
        if (this.#air) return
        this.#air = true
        this.#oneShot('jump', 'Jump.', () =>
          this.#oneShot('fall', '', () => {
            this.#air = false
            this.#oneShot('land')
          }),
        )
      },
      dash: () => {
        if (this.#busy) return
        this.#dashUntil = performance.now() + this.#ms(FRAMES.dash as number)
        this.#oneShot('dash', 'Dash.')
        this.#loop()
      },
      hurt: () => this.#oneShot('hurt', 'Hit taken.'),
      slash: () => {
        this.#pulse(this.#g.arm_blade, 'data-swing', this.#ms(4.6))
        this.#say('Slash.')
      },
      heat: () => this.#toggle(this.#g.blade, 'heat', '1', '0', 'Blade heated.', 'Blade cooled.'),
      visor: () =>
        this.#toggle(
          this.#g.head,
          'visor',
          'cyan',
          'red',
          'Visor: scan, cyan.',
          'Visor: hunt, red.',
        ),
      core: () =>
        this.#toggle(this.#g.torso, 'core', 'pulse', '', 'Core overload.', 'Core steady.'),
      aim: () =>
        this.#toggle(this.#g.arm_cannon, 'aim', '1', '0', 'Cannon raised.', 'Cannon lowered.'),
      antenna: () =>
        this.#toggle(this.#g.antenna, 'ext', '0', '1', 'Antenna retracted.', 'Antenna extended.'),
      explode: () =>
        this.#say(this.#fig.toggleAttribute('data-explode') ? 'Parts separated.' : 'Assembled.'),
    }
    act[key]?.()
  }

  /** Let go of everything (focus lost). */
  release() {
    for (const k of [...this.#held]) this.press(k, false)
  }

  #move(key: string, down: boolean) {
    if (down) this.#held.add(key)
    else this.#held.delete(key)
    if (down) {
      const dir = key === 'left' ? -1 : 1
      this.#moveSince = performance.now()
      if (dir !== this.#face) {
        this.#face = dir
        this.#place()
        this.#fig.style.setProperty('--dir', String(dir))
        if (!this.#air && !this.#busy) {
          this.#loop()
          return this.#oneShot('turn')
        }
      }
    }
    this.#loop()
    this.#settle()
  }

  #shootDown() {
    this.#held.add('shoot') // charging starts now, or as soon as the running move ends (#settle)
    if (!this.#busy && !this.#air) this.#charge()
  }

  #shootUp() {
    this.#held.delete('shoot')
    if (this.state !== 'charge') return
    const charged = performance.now() - this.#chargeSince >= this.#ms(7.2) // --dur-charge
    this.#fig.toggleAttribute('data-charged', charged)
    const cannon = this.#g.cannon as HTMLElement
    cannon.dataset.charge = 'cool'
    this.#pulse(cannon, 'data-recoil', this.#ms(2.6))
    this.#oneShot('shoot', charged ? 'Charged shot.' : 'Shot.')
    window.setTimeout(() => {
      if (this.state !== 'charge') delete cannon.dataset.charge
    }, this.#ms(10.4))
  }

  #charge() {
    this.#chargeSince = performance.now()
    ;(this.#g.cannon as HTMLElement).dataset.charge = '1'
    this.#set('charge', 'Charging.')
  }

  #toggle(
    el: HTMLElement | undefined,
    attr: string,
    on: string,
    off: string,
    sayOn: string,
    sayOff: string,
  ) {
    if (!el) return
    const now = el.dataset[attr] === on
    if (now && !off) delete el.dataset[attr]
    else el.dataset[attr] = now ? off : on
    this.#say(now ? sayOff : sayOn)
  }

  #pulse(el: HTMLElement | undefined, attr: string, ms: number) {
    if (!el) return
    const key = `${el.className}|${attr}`
    clearTimeout(this.#pulses.get(key))
    el.removeAttribute(attr)
    void el.offsetWidth // restart the CSS animation
    el.setAttribute(attr, '')
    this.#pulses.set(
      key,
      window.setTimeout(() => el.removeAttribute(attr), ms),
    )
  }

  #say(text: string) {
    this.#live.textContent = text
  }

  #key(e: KeyboardEvent, down: boolean) {
    if ((e.target as Element).closest('.hs')) return // part buttons handle their own Enter/Space
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

  // Back to the locomotion state that matches the held keys (or to charging, if shoot is held).
  #settle() {
    if (this.#busy || this.#air || this.state === 'charge') return
    if (this.#held.has('shoot')) return this.#charge()
    const moving = this.#held.has('left') || this.#held.has('right')
    const running = moving && performance.now() - this.#moveSince > this.#ms(RUN_AFTER)
    this.#set(moving ? (running ? 'run' : 'walk') : 'idle')
  }

  // Position + facing on the body box. A transform (not an inherited custom property) so moving
  // never restyles the thousands of pixels inside.
  #place() {
    this.#body.style.transform = `translateX(calc(-50% + ${this.#x}px)) scaleX(${this.#face})`
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
      this.#place()
      if (this.state === 'walk') this.#settle() // walk turns into run while held
      this.#raf = dir || dashing ? requestAnimationFrame(step) : 0
    }
    this.#raf = requestAnimationFrame(step)
  }
}

if (!customElements.get('dr4w-rig')) customElements.define('dr4w-rig', Dr4wRig)
