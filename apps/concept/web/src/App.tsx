import { Collection } from './Collection.tsx'
import { type Art, band, chapters, facts, huntArt, introArt, lockedChapter } from './content.ts'

function Picture({ art, eager }: { art: Art; eager?: boolean }) {
  return (
    <img
      src={`/art/${art.file}-1280.webp`}
      srcSet={`/art/${art.file}-640.webp 640w, /art/${art.file}-1280.webp 1280w`}
      sizes="(max-width: 640px) 100vw, 50vw"
      alt={art.alt}
      width={art.w}
      height={art.h}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}

export function App() {
  return (
    <>
      <header className="hero" id="top">
        <div className="bar">
          <a href="#top">DR4W</a>
          <nav aria-label="Sections">
            <a href="#hunt">Hunt</a>
            <a href="#art">Art</a>
          </nav>
        </div>
        <h1 className="monument">DR4W</h1>
        <Collection />
        <div className="hero-foot">
          <p>
            The war ended. The hunt didn't.
            <br />
            <span className="soft">An action platformer in development. Tap the gear.</span>
          </p>
          <a className="btn" href="#gear-antenna">
            Tune the antenna
          </a>
        </div>
      </header>

      <main>
        <section className="intro" id="premise" aria-labelledby="premise-title">
          <div className="intro-row">
            <h2 id="premise-title">The hunt never ended</h2>
            <p>
              2194. Humanity lost the surface and hides in tunnels, but IRON HUNT never stopped: a
              network of machines still searching for every last survivor. DR4W is one of those
              machines. In the war he reached the mind that runs the hunt, and something passed
              between them: it learned human hatred; he inherited human suffering. Now, buried and
              broken, he catches a voice on the radio: “…if anyone hears this… we're still here.” He
              chooses to answer.
            </p>
          </div>
          <dl className="facts">
            {facts.map((f) => (
              <div key={f.value}>
                <dt>{f.value}</dt>
                <dd>{f.note}</dd>
              </div>
            ))}
          </dl>
          <figure className="wide">
            <Picture art={introArt} />
            <figcaption>{introArt.caption}</figcaption>
          </figure>
        </section>

        <section className="hunt-wrap" id="hunt" aria-labelledby="hunt-title">
          <figure className="hunt-art">
            <Picture art={huntArt} />
            <figcaption>{huntArt.caption}</figcaption>
          </figure>
          <div className="hunt">
            <h2 className="giant" id="hunt-title">
              Hunt
            </h2>
            {chapters.map((c, i) => (
              <details key={c.name} open={i === 0}>
                <summary>{c.name}</summary>
                <div>
                  <p>{c.blurb}</p>
                  <p className="boss">
                    {c.boss} — {c.tagline}
                  </p>
                </div>
              </details>
            ))}
            <details className="locked">
              <summary>{lockedChapter.name}</summary>
              <div>
                <p>{lockedChapter.blurb}</p>
              </div>
            </details>
          </div>
        </section>

        <section className="showcase" id="art" aria-labelledby="art-title">
          <h2 id="art-title">From the archive</h2>
          <div className="band">
            {band.map((a) => (
              <div key={a.file}>
                <Picture art={a} />
              </div>
            ))}
          </div>
          <p className="caption">
            Concept art: the title screen, the cel-shaded sheet the hero is cut from, and the pixel
            studies.
          </p>
        </section>

        <blockquote className="argos">
          <p>“If anyone hears this… we're still here.”</p>
          <cite>Argos, on an open channel</cite>
        </blockquote>
      </main>

      <a className="cta" href="#gear-antenna">
        <span className="cta-note">Go back to the top and tune in.</span>
        <span className="cta-word">Listen</span>
      </a>

      <footer>
        <div className="row">
          <a href="#hunt">Hunt</a>
          <a href="#art">Art</a>
          <a href="#top">Back to top</a>
        </div>
        <p className="row">
          © 2026 DR4W: All Iron Hunt. Type: Hanken Grotesk, SIL Open Font License 1.1.
        </p>
        <div className="name" aria-hidden="true">
          DR4W
        </div>
      </footer>
    </>
  )
}
