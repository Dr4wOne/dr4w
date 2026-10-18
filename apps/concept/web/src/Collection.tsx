import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import './figure/dr4w-cannon.ts'
import './figure/dr4w-rig.ts'
import './figure/dr4w-tube.ts'

// Figures stay mounted (hidden when not shown) so each keeps its state; ← → belong to the DR4W rig,
// so the collection switches with [ ] or PageUp / PageDown (DECISIONS D24).
export const FIGURES = [
  {
    id: 'dr4w',
    name: 'DR4W',
    code: 'D-4RW-020',
    line: 'Built to hunt people. Chose to hunt the hunt.',
    controls:
      'Select the room, then ← → to move (hold to run), Space to jump, Shift to dash, F to shoot (hold to charge). S slash, H heat, V visor, C core, E parts.',
    touch:
      'Use the pad under him, or tap a part: head for the visor, chest for the core, blade for heat, cannon to fire.',
    chapter: 'Playable in every chapter',
    tag: 'dr4w-rig',
  },
  {
    id: 'cannon',
    name: 'Arm cannon',
    code: 'FOREARM WEAPON',
    line: 'His right forearm. Charges on the network’s own signal.',
    controls:
      'Hold “Charge and fire”, then let go. Open the vents to bleed heat. Switch the sight on.',
    touch:
      'Hold “Charge and fire”, then let go. Open the vents to bleed heat. Switch the sight on.',
    chapter: 'From chapter 1',
    tag: 'dr4w-cannon',
  },
  {
    id: 'tube',
    name: 'Stasis tube',
    code: 'THE TOMB',
    line: 'Where he wakes, years after the war, to a voice on the radio.',
    controls: 'Drain the fluid, release the clamps, open the glass, wake him.',
    touch: 'Drain the fluid, release the clamps, open the glass, wake him.',
    chapter: 'Chapter 1',
    tag: 'dr4w-tube',
  },
] as const

const idFromHash = () => /^#fig-([a-z]+)$/.exec(location.hash)?.[1]

export function Collection() {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      FIGURES.findIndex((f) => f.id === idFromHash()),
    ),
  )
  const root = useRef<HTMLElement>(null)

  const show = useCallback((next: number, focus = false) => {
    const i = (next + FIGURES.length) % FIGURES.length
    const swap = () => flushSync(() => setIndex(i))
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      doc.startViewTransition(swap)
    else swap()
    history.replaceState(null, '', `#fig-${FIGURES[i]?.id}`)
    if (focus) root.current?.querySelector<HTMLElement>(`[data-fig="${FIGURES[i]?.id}"]`)?.focus()
  }, [])

  useEffect(() => {
    const onHash = () => {
      const i = FIGURES.findIndex((f) => f.id === idFromHash())
      if (i < 0) return
      setIndex(i)
      root.current?.scrollIntoView()
    }
    window.addEventListener('hashchange', onHash)
    if (idFromHash()) root.current?.scrollIntoView()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === ']' || e.key === 'PageDown') show(index + 1)
    else if (e.key === '[' || e.key === 'PageUp') show(index - 1)
    else return
    e.preventDefault()
  }

  const fig = FIGURES[index] ?? FIGURES[0]
  return (
    <section className="collection" ref={root} onKeyDown={onKey} aria-label="DR4W figures">
      <nav className="fig-index" aria-label="Figures. [ and ] switch.">
        <ol>
          {FIGURES.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                data-fig={f.id}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => show(i)}
              >
                <span className="fig-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="fig-name">{f.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="fig-stage">
        {FIGURES.map((f, i) => {
          const Tag = f.tag
          return (
            <div key={f.id} className="fig-slot" id={`fig-${f.id}`} hidden={i !== index}>
              <Tag />
            </div>
          )
        })}
      </div>
      <div className="fig-card" aria-live="polite">
        <p className="fig-code">{fig.code}</p>
        <h2>{fig.name}</h2>
        <p>{fig.line}</p>
        <p className="fig-controls keys">{fig.controls}</p>
        <p className="fig-controls touch">{fig.touch}</p>
        <p className="fig-chapter">{fig.chapter}</p>
      </div>
    </section>
  )
}
