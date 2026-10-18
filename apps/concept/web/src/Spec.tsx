import { useEffect, useRef, useState } from 'react'
import { sheetSwatches, unitData } from './content.ts'

// Box sizes of the generated pieces (CSS px, from pixel/pieces/*.generated.css), so the section
// keeps its layout while the pixel CSS is still loading.
const PIECES = {
  'head-front': [62, 59],
  'head-side': [59, 64],
  'cannon-long': [104, 45],
  'cannon-short': [74, 35],
  'view-front': [50, 82],
  'view-back': [49, 84],
} as const
const TOKENS = [
  ...Array.from({ length: 12 }, (_, i) => `m${i}`),
  ...Array.from({ length: 6 }, (_, i) => `g${i}`),
]

// Zoom is a whole number set in CSS (--pz: 3, or 2 on phones) so the pixels stay crisp.
function Piece({ name, label }: { name: keyof typeof PIECES; label: string }) {
  const [w, h] = PIECES[name]
  return (
    <figure className="piece" style={{ '--w': w, '--h': h } as React.CSSProperties}>
      <div className={`pc-${name}`} role="img" aria-label={label} />
    </figure>
  )
}

/** Character sheet, rebuilt: Daniel's pixel pieces plus live labels (D26). Loads its CSS near view. */
export function Spec() {
  const ref = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const [cyan, setCyan] = useState(false)
  const [sampled, setSampled] = useState<string[]>([])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        io.disconnect()
        import('./figure/spec.ts').then(() => setReady(true))
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!ready) return
    const cs = getComputedStyle(document.documentElement)
    // Show the sampled tokens as hex, like the sheet prints its own.
    const hex = (v: string) =>
      v.replace(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)[^)]*\)/,
        (_, r, g, b) =>
          `#${[r, g, b].map((x) => Number(x).toString(16).padStart(2, '0')).join('')}`,
      )
    setSampled(TOKENS.map((t) => hex(cs.getPropertyValue(`--${t}`).trim())))
  }, [ready])

  return (
    <section
      className="spec wrap"
      id="spec"
      ref={ref}
      aria-labelledby="spec-title"
      data-ready={ready || undefined}
    >
      <h2 id="spec-title">The unit, on paper</h2>
      <p className="spec-lead">
        His character sheet, rebuilt in CSS: every pixel is drawn by the page and every label is
        text.
      </p>
      <div className="sheet">
        <div className="panel frame sheet-logo">
          <p className="lockup">
            <span className="lk-dr4w" data-text="DR4W">
              DR4W
            </span>
            <span className="lk-iron">
              <i className="lk-rule" aria-hidden="true" />
              IRON HUNT
              <i className="lk-rule" aria-hidden="true" />
            </span>
          </p>
        </div>
        <div className="panel frame span2" data-visor={cyan ? 'cyan' : 'red'}>
          <h3 className="hud">Head design</h3>
          <div className="art">
            <Piece name="head-front" label="DR4W's helmet, front" />
            <Piece name="head-side" label="DR4W's helmet, side, with the antenna" />
          </div>
          <button type="button" className="chip" aria-pressed={cyan} onClick={() => setCyan(!cyan)}>
            Visor: {cyan ? 'scan, cyan' : 'hunt, red'}
          </button>
        </div>
        <div className="panel frame">
          <h3 className="hud">Unit data</h3>
          <dl className="unit hud">
            {unitData.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className={k === 'Protocol override' ? 'on' : undefined}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="panel frame span2">
          <h3 className="hud">Weapon system</h3>
          <div className="weapons">
            <Piece name="cannon-long" label="Arm cannon, extended" />
            <Piece name="cannon-short" label="Arm cannon, retracted" />
          </div>
          <p className="hud weapons-note">Extend / retract</p>
        </div>
        <div className="panel frame">
          <h3 className="hud">Colour palette</h3>
          <p className="sub hud">Printed on the sheet</p>
          <ul className="swatches hud">
            {sheetSwatches.map((hex, i) => (
              <li key={hex}>
                <i style={{ background: `var(--sheet-${i + 1})` }} />
                {hex}
              </li>
            ))}
          </ul>
          <p className="sub hud">Sampled from his pixels (the tokens)</p>
          <ul className="swatches hud">
            {TOKENS.map((t, i) => (
              <li key={t}>
                <i style={{ background: `var(--${t})` }} />
                --{t} {sampled[i] ?? ''}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel frame span2">
          <h3 className="hud">Front / back view</h3>
          <div className="art">
            <Piece name="view-front" label="DR4W from the front" />
            <Piece name="view-back" label="DR4W from the back" />
          </div>
        </div>
      </div>
    </section>
  )
}
