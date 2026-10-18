import './dr4w-figure.css'

/**
 * <dr4w-figure>: DR4W from the character sheet, with gear you can operate. Each gear piece is a
 * real <button> over the art; its state lives in `data-<gear>` on the host and CSS animates the
 * glow. JS only flips states and announces them. Standalone use: load the page tokens
 * (tokens.css), this module and /art/dr4w-*.webp. Events: `gearchange` `{ id, state }`,
 * `huntmode` (every gear piece active). Deep link: `#gear-<id>`.
 * shortcut: a still image with hotspots, not a rigged figure; upgrade when layered art exists.
 */
export type Gear = {
  id: string
  label: string
  line: string
  states: readonly [string, ...string[]]
}

export const GEAR: readonly Gear[] = [
  {
    id: 'antenna',
    label: 'Antenna',
    line: 'Static… static… still here.',
    states: ['quiet', 'listening', 'transmitting', 'holding'],
  },
  { id: 'core', label: 'Core', line: 'The part they call a defect.', states: ['steady', 'surge'] },
  {
    id: 'cannon',
    label: 'Arm cannon',
    line: 'Built to hunt people. Aimed at the hunt.',
    states: ['ready', 'charging', 'fired'],
  },
]

export class Dr4wFigure extends HTMLElement {
  #live!: HTMLElement
  #timers: number[] = []

  connectedCallback() {
    if (this.childElementCount) return
    this.innerHTML = `
      <div class="d4-body">
        <img src="/art/dr4w-1096.webp" srcset="/art/dr4w-548.webp 548w, /art/dr4w-1096.webp 1096w"
          sizes="(max-width: 640px) 80vw, 40vw" width="548" height="628" fetchpriority="high"
          alt="DR4W: a dark armoured droid with a red-lit arm cannon on his right arm, a blade in his left hand and an antenna on his head">
        ${GEAR.map((g) => `<div class="d4-fx d4-fx-${g.id}" aria-hidden="true"></div>`).join('')}
        <div class="d4-fx d4-fx-flash" aria-hidden="true"></div>
      </div>
      <div class="d4-gear" role="group" aria-label="DR4W's gear. Arrow keys move, Escape resets.">
        ${GEAR.map((g) => `<button type="button" class="d4-btn d4-at-${g.id}" id="gear-${g.id}" data-gear="${g.id}" aria-pressed="false"><span>${g.label}</span></button>`).join('')}
      </div>
      <a class="d4-hunt" href="#hunt" hidden>Hunt mode. See the chapters</a>
      <p class="d4-live" aria-live="polite"></p>`
    this.#live = this.querySelector('.d4-live') as HTMLElement
    for (const g of GEAR) this.#set(g.id, g.states[0], false)
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKey)
    window.addEventListener('hashchange', this.#fromHash)
    this.#fromHash()
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.#fromHash)
    for (const t of this.#timers) clearTimeout(t)
  }

  state(id: string) {
    return this.dataset[id] ?? ''
  }

  /** Advance one gear piece to its next state (what a press does). */
  operate(id: string) {
    const g = GEAR.find((x) => x.id === id)
    if (!g) return
    if (id === 'cannon' && this.state('cannon') === 'fired') return
    const next = g.states[(g.states.indexOf(this.state(id)) + 1) % g.states.length] ?? g.states[0]
    this.#set(id, next)
    // A shot is brief: the cannon re-arms on its own and stays "active".
    if (next === 'fired') this.#after('--dur-charge', () => this.#set('cannon', 'charging', false))
  }

  reset() {
    for (const t of this.#timers) clearTimeout(t)
    this.#timers = []
    for (const g of GEAR) this.#set(g.id, g.states[0], false)
    this.#live.textContent = 'All gear reset.'
  }

  #after(token: string, fn: () => void) {
    const ms = Number.parseFloat(getComputedStyle(this).getPropertyValue(token)) || 0
    this.#timers.push(window.setTimeout(fn, ms))
  }

  #set(id: string, state: string, announce = true) {
    const g = GEAR.find((x) => x.id === id) as Gear
    this.dataset[id] = state
    const btn = this.querySelector(`[data-gear="${id}"]`) as HTMLButtonElement
    btn.dataset.state = state
    btn.setAttribute('aria-pressed', String(state !== g.states[0]))
    if (announce) {
      this.#live.textContent = `${g.label}: ${state}. ${g.line}`
      this.dispatchEvent(new CustomEvent('gearchange', { detail: { id, state }, bubbles: true }))
    }
    this.#checkHunt()
  }

  #checkHunt() {
    const on = GEAR.every((g) => this.state(g.id) !== g.states[0])
    if (on === (this.dataset.hunt === 'on')) return
    this.dataset.hunt = on ? 'on' : 'off'
    ;(this.querySelector('.d4-hunt') as HTMLElement).hidden = !on
    if (on) {
      this.#live.textContent = 'Hunt mode.'
      this.dispatchEvent(new CustomEvent('huntmode', { bubbles: true }))
    }
  }

  #onClick = (e: Event) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('.d4-btn')
    if (btn?.dataset.gear) this.operate(btn.dataset.gear)
  }

  #onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return this.reset()
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const btns = [...this.querySelectorAll<HTMLButtonElement>('.d4-btn')]
    const i = btns.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    e.preventDefault()
    btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length]?.focus()
  }

  #fromHash = () => {
    const id = /^#gear-([a-z]+)$/.exec(location.hash)?.[1]
    const g = GEAR.find((x) => x.id === id)
    if (!g) return
    ;(this.querySelector(`#gear-${g.id}`) as HTMLButtonElement).focus()
    if (this.state(g.id) === g.states[0]) this.operate(g.id)
    // Drop the hash so the same link works again on the next click.
    history.replaceState(null, '', location.pathname + location.search)
  }
}

if (!customElements.get('dr4w-figure')) customElements.define('dr4w-figure', Dr4wFigure)
