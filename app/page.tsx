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

      {/* PRICING */}
      <div className="mx-auto max-w-lg px-6 pb-14">
        <div className="h-px bg-green-900 mb-10" />
        <h2 className="mb-2 text-xl font-bold text-white">Hinnoittelu</h2>
        <p className="mb-8 text-sm text-green-400">30 päivän ilmainen kokeilu. Ei luottokorttia.</p>
        <div className="flex flex-col gap-4 md:flex-row">
          {[
            { name: 'Perus', price: 249, monthly: 21, desc: 'Sopii pienille seuroille. Kaikki perusominaisuudet.' },
            { name: 'Standardi', price: 399, monthly: 33, desc: 'Suosituin. Lisäksi joukkolaskutus ja CSV-tuonti.', popular: true },
            { name: 'Pro', price: 599, monthly: 50, desc: 'Suurille seuroille. Prioriteettituki ja lisäominaisuudet.' },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`flex-1 rounded-2xl border p-5 ${
                plan.popular
                  ? 'border-green-500 bg-green-800/40'
                  : 'border-green-800 bg-white/5'
              }`}
            >
              {plan.popular && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">
                  Suosituin
                </p>
              )}
              <h3 className="mb-3 font-bold text-white">{plan.name}</h3>
              <div className="mb-0.5">
                <span className="text-3xl font-extrabold text-white">{plan.price} €</span>
                <span className="text-sm text-green-400"> / vuosi</span>
              </div>
              <p className="mb-1 text-sm text-green-400">(noin {plan.monthly} €/kk)</p>
              <p className="mb-4 text-xs text-green-600">sis. alv 0%</p>
              <p className="mb-5 text-xs leading-5 text-green-300">{plan.desc}</p>
              <Link
                href="/rekisteroidy"
                className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-green-500 text-green-950 hover:bg-green-400'
                    : 'border border-green-700 text-green-300 hover:border-green-500 hover:text-green-200'
                }`}
              >
                Kokeile ilmaiseksi
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="mx-auto max-w-lg px-6 pb-14">
        <div className="h-px bg-green-900 mb-10" />
        <div className="rounded-2xl border border-green-700 bg-green-800 p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white">Kokeile ilmaiseksi 30 päivää</h2>
          <p className="mb-6 text-sm leading-relaxed text-green-200">
            Rekisteröi seurasi ja kokeile kaikkia ominaisuuksia 30 päivää ilmaiseksi.
            Ei luottokorttia. Ei sitoutumista.
          </p>
          <ul className="mb-7 space-y-2">
            {[
              'Käyttövalmis 2 minuutissa',
              'Kaikki ominaisuudet käytössä heti',
              'Peruuta milloin tahansa',
            ].map((item) => (
              <li key={item} className="flex items-center justify-center gap-2 text-sm text-green-200">
                <span className="font-bold text-green-400">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/rekisteroidy"
            className="block rounded-xl bg-green-500 px-6 py-4 text-center text-base font-bold text-green-950 shadow-lg hover:bg-green-400 transition-colors"
          >
            Rekisteröi seura ilmaiseksi →
          </Link>
          <p className="mt-4 text-xs text-green-500">
            Yli X metsästysseuraa jo käytössä
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
