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
          <span className="text-green-300">Kaikki seuran asiat</span><br />
          yhdessä paikassa.
        </h1>

        {/* Subtext */}
        <p className="mb-4 text-base leading-relaxed text-green-200">
          Jäsenrekisteri, tapahtumat, saalisilmoitukset,
          eräkartanon varaukset ja maksut –{' '}
          <span className="font-medium text-white">toimii puhelimella metsässä.</span>
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

      {/* HOW IT WORKS */}
      <div className="mx-auto max-w-lg px-6 pb-14">
        <div className="h-px bg-green-900 mb-10" />
        <h2 className="mb-8 text-xl font-bold text-white">Näin se toimii</h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-0">
          {[
            {
              num: '1',
              icon: '🏢',
              title: 'Rekisteröi seura',
              text: 'Luo seurasi tili 2 minuutissa. Sinusta tulee automaattisesti ylläpitäjä.',
            },
            {
              num: '2',
              icon: '✉️',
              title: 'Kutsu jäsenet',
              text: 'Lähetä kutsulinkki sähköpostitse tai tuo jäsenrekisteri CSV-tiedostona.',
            },
            {
              num: '3',
              icon: '📱',
              title: 'Käytä metsässä',
              text: 'Jäsenet kirjautuvat puhelimella. Saalisilmoitus, varaukset ja tapahtumat aina mukana.',
            },
          ].map((step, i) => (
            <div key={step.num} className="flex md:flex-1 md:flex-col">
              {/* Step content */}
              <div className="flex gap-4 md:flex-col md:gap-3">
                <div className="flex shrink-0 flex-col items-center gap-2 md:flex-row">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-green-950">
                    {step.num}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="mb-0.5 text-lg">{step.icon}</p>
                  <p className="mb-1 font-semibold text-white">{step.title}</p>
                  <p className="text-sm leading-relaxed text-green-400">{step.text}</p>
                </div>
              </div>
              {/* Arrow between steps (desktop only) */}
              {i < 2 && (
                <div className="hidden md:flex md:w-8 md:shrink-0 md:items-start md:justify-center md:pt-3">
                  <span className="text-green-700 text-xl">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* USE CASE EXAMPLES */}
      <div className="mx-auto max-w-lg px-6 pb-14">
        <div className="h-px bg-green-900 mb-10" />
        <h2 className="mb-6 text-xl font-bold text-white">Käytännön esimerkkejä</h2>
        <div className="flex flex-col gap-3">
          {[
            {
              icon: '🦌',
              title: 'Hirvijahdissa',
              text: 'Matti ampuu hirven. Hän avaa sovelluksen ja ilmoittaa saaliin 30 sekunnissa. Kaikki seuran jäsenet näkevät sen heti.',
            },
            {
              icon: '💳',
              title: 'Jäsenmaksut',
              text: 'Puheenjohtaja lähettää jäsenmaksulaskun kaikille 42 jäsenelle yhdellä klikkauksella. Jokainen saa laskun sähköpostiin.',
            },
            {
              icon: '🏕️',
              title: 'Eräkartano',
              text: 'Jäsen haluaa varata mökin viikonlopuksi. Hän avaa varauskalenterin ja näkee vapaat päivät heti – ilman WhatsApp-kyselyjä.',
            },
          ].map(({ icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-green-800 bg-green-900/50 px-5 py-4"
            >
              <p className="mb-1 text-xl">{icon}</p>
              <p className="mb-1.5 font-semibold text-white">{title}</p>
              <p className="text-sm leading-relaxed text-green-300">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DEMO SECTION */}
      <div className="mx-auto max-w-lg px-6 pb-14">
        <div className="h-px bg-green-900 mb-10" />
        <h2 className="mb-4 text-xl font-bold text-white">Kokeile ilmaiseksi</h2>
        <div className="rounded-2xl border border-green-700 bg-green-900/60 p-6">
          <p className="mb-5 text-sm leading-relaxed text-green-200">
            Haluatko nähdä miten sovellus toimii ennen rekisteröitymistä?
          </p>
          <div className="mb-5 rounded-xl border border-green-700 bg-green-800/60 px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-24 text-green-400">Sähköposti</span>
              <span className="font-mono font-medium text-white">demo@eramiehet.fi</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-24 text-green-400">Salasana</span>
              <span className="font-mono font-medium text-white">demo2026</span>
            </div>
          </div>
          <Link
            href="/login"
            className="block rounded-xl bg-green-500 px-6 py-3 text-center text-sm font-bold text-green-950 hover:bg-green-400 transition-colors"
          >
            Avaa demo
          </Link>
          <p className="mt-3 text-center text-xs text-green-600">
            Demossa näet oikean sovelluksen esimerkkidatalla.
          </p>
        </div>
      </div>

      {/* TRUST SECTION */}
      <div className="mx-auto max-w-lg px-6 pb-20">
        <div className="h-px bg-green-900 mb-8" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
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
