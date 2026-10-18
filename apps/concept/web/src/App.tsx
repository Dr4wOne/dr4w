import { useEffect, useRef, useState } from 'react'
import { Collection } from './Collection.tsx'
import { type Art, archive, bosses, chapters, comic, facts, premise, tomb } from './content.ts'
import { Spec } from './Spec.tsx'

const SECTIONS = [
  ['figures', 'Figures'],
  ['story', 'Story'],
  ['hunt', 'Hunt'],
  ['bosses', 'Bosses'],
  ['spec', 'Spec'],
  ['archive', 'Archive'],
] as const
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function Picture({
  art,
  sizes = '(max-width: 720px) 100vw, 50vw',
  eager,
}: {
  art: Art
  sizes?: string
  eager?: boolean
}) {
  const top = art.widths[art.widths.length - 1]
  return (
    <img
      src={`/art/${art.file}-${top}.webp`}
      srcSet={art.widths.map((w) => `/art/${art.file}-${w}.webp ${w}w`).join(', ')}
      sizes={sizes}
      alt={art.alt}
      width={art.w}
      height={art.h}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}

// The title-screen lockup, rebuilt as live text (A5): cyan glitch "DR4W", red "IRON HUNT", skull emblem.
function Lockup({ as: Tag = 'p', small }: { as?: 'h1' | 'p'; small?: boolean }) {
  return (
    <Tag className={small ? 'lockup lockup-sm' : 'lockup'}>
      <span className="lk-dr4w" data-text="DR4W">
        DR4W
      </span>
      <span className="lk-iron">
        <i className="lk-rule" aria-hidden="true" />
        IRON HUNT
        <i className="lk-rule" aria-hidden="true" />
      </span>
      {!small && <span className="lk-skull" aria-hidden="true" />}
    </Tag>
  )
}

function useActiveSection() {
  const [active, setActive] = useState<string>('figures')
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const [id] of SECTIONS) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])
  return active
}

function Counter({ to, label }: { to: number; label: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !to || reduced()) return
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const span = Number.parseFloat(getComputedStyle(el).getPropertyValue('--dur-charge')) || 1
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / span)
        const from = to > 1000 ? to - 94 : 0
        el.textContent = label.replace(
          String(to),
          String(Math.round(from + (to - from) * (1 - (1 - k) ** 3))),
        )
        if (k < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to, label])
  return <dt ref={ref}>{label}</dt>
}

export function App() {
  const active = useActiveSection()
  const [stage, setStage] = useState(0)
  const [zoom, setZoom] = useState<Art | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const ch = chapters[stage] ?? chapters[0]

  useEffect(() => {
    if (zoom) dialog.current?.showModal?.()
    else dialog.current?.close?.()
  }, [zoom])

  // Pointer-reactive light (hero) and tilt (boss cards): one rAF-throttled handler sets CSS variables.
  const light = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || reduced()) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    requestAnimationFrame(() => {
      el.style.setProperty('--mx', x.toFixed(1))
      el.style.setProperty('--my', y.toFixed(1))
    })
  }
  const unlight = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty('--mx')
    e.currentTarget.style.removeProperty('--my')
  }

  const play = () => {
    location.hash = '#fig-dr4w'
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('#fig-dr4w .rig-stage')?.focus(),
    )
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav hud">
        <a href="#figures" className="nav-home" aria-label="DR4W: Iron Hunt, back to the figures">
          <Lockup small />
        </a>
        <nav aria-label="Sections">
          <ul>
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} aria-current={active === id ? 'location' : undefined}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="figures" aria-labelledby="hero-title" onPointerMove={light}>
          <div className="world" aria-hidden="true">
            <i className="moon" />
            <i className="sky sky-far" />
            <i className="sky sky-near" />
            <i className="rain" />
          </div>
          <div className="hero-head wrap">
            <div id="hero-title">
              <Lockup as="h1" />
            </div>
            <p className="hero-line">
              The war ended. The hunt didn't. <span>An action platformer in development.</span>
            </p>
            <button type="button" className="press" onClick={play}>
              Press start <span className="press-hint">Play with DR4W</span>
            </button>
          </div>
          <Collection />
        </section>

        <section className="story wrap" id="story" aria-labelledby="story-title">
          <div className="story-row">
            <h2 id="story-title">The hunt never ended</h2>
            <p>{premise}</p>
          </div>
          <dl className="facts hud">
            {facts.map((f) => (
              <div key={f.label}>
                <Counter to={f.to} label={f.label} />
                <dd>{f.note}</dd>
              </div>
            ))}
          </dl>
          <figure className="tomb frame">
            <Picture art={tomb} sizes="(max-width: 720px) 100vw, 80vw" />
            <figcaption className="hud-panel hud">
              <span>
                UNIT: <b>DR4W</b>
              </span>
              <span>
                HUNT PROTOCOL: <b>ACTIVE</b>
              </span>
              <span>
                MISSION: <b className="type-on">SURVIVE</b>
              </span>
            </figcaption>
          </figure>
        </section>

        <section className="comic wrap" aria-labelledby="comic-title">
          <h2 id="comic-title" className="hud-title hud">
            {comic.header}
          </h2>
          <ol className="panels">
            {comic.panels.map((p, i) => (
              <li key={`${i}-${p.caption.join('')}`} className="panel frame">
                <span className="panel-no" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {p.art ? (
                  <img
                    src={`/art/${p.art}-480.webp`}
                    alt={p.alt}
                    width="480"
                    height="360"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="terminal hud">
                    {comic.terminal.map((t) => (
                      <p key={t}>{t}</p>
                    ))}
                    <i className="lk-skull" aria-hidden="true" />
                  </div>
                )}
                {p.box.length > 0 && (
                  <p className="panel-box hud">
                    {p.box.map((b) => (
                      <span key={b}>{b}</span>
                    ))}
                  </p>
                )}
                <p className="panel-cap hud">
                  {p.caption[0]}
                  <b>{p.caption[1]}</b>
                </p>
              </li>
            ))}
          </ol>
          <p className="comic-foot hud">{comic.footer.join('  ·  ')}</p>
        </section>

        <section className="hunt wrap" id="hunt" aria-labelledby="hunt-title">
          <h2 id="hunt-title">Select a stage</h2>
          <div className="map">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={chapters.map((c) => `${c.x},${c.y}`).join(' ')} />
            </svg>
            <i className="map-unit" aria-hidden="true" />
            <ol>
              {chapters.map((c, i) => (
                <li key={c.name} style={{ '--x': c.x, '--y': c.y } as React.CSSProperties}>
                  <button
                    type="button"
                    className={`node ${c.tone}`}
                    aria-pressed={i === stage}
                    aria-controls="stage-card"
                    onClick={() => setStage(i)}
                  >
                    <span className="node-stage">{c.stage}</span>
                    <span className="node-name">{c.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <article className={`stage-card frame ${ch.tone}`} id="stage-card" aria-live="polite">
            <p className="hud">{ch.stage}</p>
            <h3>{ch.name}</h3>
            <p>{ch.blurb}</p>
            <p className="stage-boss">
              <b>{ch.boss}</b> — {ch.tagline}
            </p>
          </article>
        </section>

        <section className="bosses wrap" id="bosses" aria-labelledby="bosses-title">
          <h2 id="bosses-title">The hunters</h2>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: scrolls sideways on phones, so it must take focus for keyboard scrolling (axe scrollable-region-focusable) */}
          <ul className="boss-row" tabIndex={0} aria-label="Bosses">
            {bosses.map((b) => (
              <li
                key={b.name}
                className="boss frame"
                onPointerMove={light}
                onPointerLeave={unlight}
              >
                <i className={`boss-shape ${b.shape}`} aria-hidden="true" />
                <p className="hud">{b.where}</p>
                <h3>{b.name}</h3>
                <p>{b.tagline}</p>
                <p className="threat hud">
                  Threat{' '}
                  <meter min={0} max={5} value={b.threat} aria-label={`Threat ${b.threat} of 5`} />
                </p>
              </li>
            ))}
          </ul>
        </section>

        <Spec />

        <section className="archive wrap" id="archive" aria-labelledby="archive-title">
          <h2 id="archive-title">From the archive</h2>
          <ul className="masonry">
            {archive.map((a) => (
              <li key={a.file}>
                <button
                  type="button"
                  className="thumb"
                  onClick={() => setZoom(a)}
                  aria-label={`Open: ${a.caption}`}
                >
                  <Picture art={a} sizes="(max-width: 720px) 100vw, 33vw" />
                </button>
                <p className="caption">{a.caption}</p>
              </li>
            ))}
          </ul>
          <dialog
            ref={dialog}
            className="lightbox"
            onClose={() => setZoom(null)}
            aria-label={zoom?.caption}
          >
            {zoom && (
              <>
                <Picture art={zoom} sizes="90vw" eager />
                <p className="caption">{zoom.caption}</p>
              </>
            )}
            <form method="dialog">
              <button type="submit" className="close">
                Close
              </button>
            </form>
          </dialog>
        </section>

        <section className="cta wrap" aria-label="Play">
          <button type="button" className="cta-link" onClick={play}>
            <span className="cta-word">Play the figures</span>
            <span className="cta-note">
              DR4W, his arm cannon and the tomb are waiting at the top.
            </span>
          </button>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-grid">
          <Lockup />
          <nav aria-label="Footer">
            <ul>
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="legal">
            © 2026 DR4W: All Iron Hunt. Type: Hanken Grotesk and Pixelify Sans, SIL Open Font
            License 1.1.
          </p>
        </div>
      </footer>
    </>
  )
}
