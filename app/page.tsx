import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-stone-950 text-white">

      {/* HERO */}
      <div className="relative mx-auto max-w-lg px-6 pb-10 pt-16">

        {/* Decorative SVG — right side on desktop */}
        <div className="pointer-events-none absolute right-0 top-8 opacity-10 md:opacity-15" aria-hidden="true">
          <svg width="220" height="220" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stylised deer / stag silhouette */}
            <path d="M50 80 Q48 65 44 58 Q38 55 32 50 Q28 46 30 40 Q32 36 36 38 Q34 32 36 28 Q38 24 40 28 Q39 22 42 20 Q44 18 44 24 Q46 18 48 20 Q50 16 50 24 Q52 18 54 20 Q56 18 56 24 Q56 18 58 20 Q60 22 61 28 Q63 24 65 28 Q67 32 64 38 Q68 36 70 40 Q72 46 68 50 Q62 55 56 58 Q52 65 50 80Z" fill="white"/>
            <path d="M50 80 L49 88 L51 88 Z" fill="white"/>
            <path d="M49 88 L46 96 M51 88 L54 96" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Label */}
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-green-400">
          Metsästysseuran sovellus
        </p>

        {/* Headline */}
        <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
          Lopeta WhatsApp&#8209;kaaos.<br />
          <span className="text-green-300">Kaikki seuran asiat</span><br />
          yhdessä paikassa.
        </h1>

        {/* Subtext */}
        <p className="mb-4 text-base leading-relaxed text-green-200">
          Jäsenrekisteri, tapahtumat, saalisilmoitukset,
          eräkartanon varaukset ja maksut –{' '}
          <span className="font-medium text-white">toimii puhelimella metsässä.</span>
        </p>

        {/* Social proof */}
        <p className="mb-8 text-sm text-green-400">
          ✓ Kyyjärven Erämiehet ja muut seurat jo käytössä
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/rekisteroidy"
            className="rounded-xl bg-green-500 px-6 py-4 text-center text-base font-bold text-green-950 shadow-lg transition-colors hover:bg-green-400 active:bg-green-600"
          >
            Rekisteröi uusi seura ilmaiseksi →
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-green-700 px-6 py-3 text-center text-sm font-semibold text-green-300 transition-colors hover:border-green-500 hover:text-green-200"
          >
            Kirjaudu sisään
          </Link>
          <p className="text-center text-xs text-green-600">
            Liittymässä jo olemassa olevaan seuraan?{' '}
            <Link href="/liity" className="text-green-500 underline hover:text-green-300">
              Käytä kutsulinkkiä
            </Link>
          </p>
        </div>
      </div>

      {/* FEATURE CARDS */}
      <div className="mx-auto max-w-lg px-6 pb-10">
        <div className="flex flex-col gap-3 md:flex-row">
          {[
            { icon: '🦌', text: 'Saalis ilmoitettu 30 sekunnissa' },
            { icon: '🏕️', text: 'Eräkartanon varaus puhelimella' },
            { icon: '💳', text: 'Jäsenmaksut aina seurannassa' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-xl border border-green-800 bg-green-950/60 px-4 py-3 md:flex-1 md:flex-col md:items-start md:py-4"
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-medium text-green-200">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TRUST SECTION */}
      <div className="mx-auto max-w-lg px-6 pb-20">
        <div className="h-px bg-green-900 mb-8" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: '🔒',
              title: 'Tietoturvallinen',
              body: 'Jokaisen seuran data on erillään. Suomalainen tietosuoja.',
            },
            {
              icon: '📱',
              title: 'Toimii metsässä',
              body: 'Mobiilioptimioitu. Toimii myös hitaalla verkkoyhteydellä.',
            },
            {
              icon: '⚡',
              title: 'Helppo ottaa käyttöön',
              body: 'Rekisteröidy 2 minuutissa. Ei teknistä osaamista tarvita.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex flex-row gap-4 md:flex-col md:gap-2">
              <span className="mt-0.5 text-2xl">{icon}</span>
              <div>
                <p className="mb-1 text-sm font-semibold text-white">{title}</p>
                <p className="text-xs leading-relaxed text-green-400">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  )
}
