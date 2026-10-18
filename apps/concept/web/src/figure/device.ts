/**
 * Shared controller for the device figures (Fig. 02+). A device is a CSS drawing plus parts; each part
 * is a real <button> whose state lives in `data-<part>` on the host, so CSS animates it and JS only
 * flips states. Cycle parts advance on press; hold parts go to `down` while held and `up` on release,
 * then back to rest after --dur-settle. Event: `partchange` { id, state }.
 */
export type Part = {
  id: string
  label: string
  line: string
  states: readonly [string, ...string[]]
  hold?: { down: string; up: string }
}

export abstract class DeviceFigure extends HTMLElement {
  abstract parts: readonly Part[]
  abstract drawing: string
  abstract name: string
  #live!: HTMLElement
  #timer = 0

  connectedCallback() {
    if (this.childElementCount) return
    this.innerHTML = `
      <div class="dev-art" aria-hidden="true">${this.drawing}</div>
      <div class="dev-parts" role="group" aria-label="${this.name}: operable parts">
        ${this.parts.map((p) => `<button type="button" class="dev-btn" data-part="${p.id}" aria-pressed="false">${p.label}</button>`).join('')}
      </div>
      <p class="dev-live" aria-live="polite"></p>`
    this.#live = this.querySelector('.dev-live') as HTMLElement
    for (const p of this.parts) this.set(p.id, p.states[0], false)
    for (const b of this.querySelectorAll<HTMLButtonElement>('.dev-btn')) {
      const p = this.parts.find((x) => x.id === b.dataset.part) as Part
      if (!p.hold) {
        b.addEventListener('click', () => this.operate(p.id))
        continue
      }
      const down = (e: Event) => {
        e.preventDefault()
        this.hold(p.id, true)
      }
      const up = () => this.hold(p.id, false)
      b.addEventListener('pointerdown', down)
      b.addEventListener('pointerup', up)
      b.addEventListener('pointerleave', up)
      b.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e)
      })
      b.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') up()
      })
    }
  }

  disconnectedCallback() {
    clearTimeout(this.#timer)
  }

  state(id: string) {
    return this.dataset[id] ?? ''
  }

  operate(id: string) {
    const p = this.parts.find((x) => x.id === id)
    if (!p || p.hold) return
    this.set(id, p.states[(p.states.indexOf(this.state(id)) + 1) % p.states.length] ?? p.states[0])
  }

  hold(id: string, down: boolean) {
    const p = this.parts.find((x) => x.id === id)
    if (!p?.hold) return
    if (down) return this.set(id, p.hold.down)
    if (this.state(id) !== p.hold.down) return
    this.set(id, p.hold.up)
    const ms = Number.parseFloat(getComputedStyle(this).getPropertyValue('--dur-settle')) || 0
    clearTimeout(this.#timer)
    this.#timer = window.setTimeout(() => this.set(id, p.states[0], false), ms)
  }

  reset() {
    for (const p of this.parts) this.set(p.id, p.states[0], false)
  }

  set(id: string, state: string, announce = true) {
    const p = this.parts.find((x) => x.id === id) as Part
    this.dataset[id] = state
    const b = this.querySelector(`[data-part="${id}"]`)
    b?.setAttribute('aria-pressed', String(state !== p.states[0]))
    if (b) (b as HTMLElement).dataset.state = state
    if (!announce) return
    this.#live.textContent = `${p.label}: ${state}. ${p.line}`
    this.dispatchEvent(new CustomEvent('partchange', { detail: { id, state }, bubbles: true }))
  }
}
