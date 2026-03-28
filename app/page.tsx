'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [clubName, setClubName] = useState('')
  const [submitMessage, setSubmitMessage] = useState<'registered' | 'already_registered' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    const res = await fetch('/api/launch-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, club_name: clubName }),
    })
    setSubmitting(false)
    const data = await res.json().catch(() => ({})) as { success?: boolean; message?: string; error?: string }
    if (res.ok && data.success) {
      setSubmitMessage(data.message === 'already_registered' ? 'already_registered' : 'registered')
    } else {
      setFormError(data.error ?? 'Jokin meni pieleen. Yritä uudelleen.')
    }
  }

  return (
    <main className="min-h-screen bg-green-950 text-white" style={{ scrollBehavior: 'smooth' }}>

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-green-950 via-green-950 to-green-900 pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="mb-8 inline-block rounded-full bg-green-800/60 px-4 py-1.5 text-sm font-semibold text-green-300 ring-1 ring-green-700/50">
            🚀 Suljettu beta käynnissä
          </span>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Käytä aikasi rakkaaseen<br className="hidden sm:block" /> harrastukseen.<br />
            <span className="text-green-300">Vähemmän hallintoon.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-green-200">
            JahtiPro hoitaa metsästysseuran hallinnon puolestasi — jäsenrekisteristä
            maksuihin ja saalisilmoituksista eräkartanon varauksiin.
          </p>

          <p className="text-sm text-green-400">
            Kehitetty yhdessä Kyyjärven Erämiehet ry:n kanssa
          </p>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-green-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── SECTION 2: PAIN POINTS ──────────────────────────────────────── */}
      <section className="bg-green-900/40 py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-white md:text-4xl">
            Tuntuuko tämä tutulta?
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: '😤',
                title: 'WhatsApp-kaaos',
                body: 'Tapahtumat, maksut ja ilmoitukset hukkuvat ryhmäviesteihin. Tärkeät asiat katoavat.',
              },
              {
                icon: '📊',
                title: 'Excel kaikkialla',
                body: 'Jäsenrekisteri, maksut ja varaukset eri tiedostoissa. Hallitus tekee tuplatyötä joka vuosi.',
              },
              {
                icon: '⏰',
                title: 'Aikaa tuhlaantuu',
                body: 'Kokoukset, muistutukset, pöytäkirjat — hallintoon kuluu tunteja jotka voisi viettää metsässä.',
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-green-800 bg-green-900/60 px-6 py-6 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <p className="mb-3 text-3xl">{icon}</p>
                <p className="mb-2 font-bold text-white">{title}</p>
                <p className="text-sm leading-relaxed text-green-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: SOLUTION ─────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-green-500">Ratkaisu</p>
          <h2 className="mb-6 text-3xl font-extrabold text-white md:text-5xl">
            JahtiPro tekee kaiken tämän
            <span className="text-green-300"> puolestasi.</span>
          </h2>
          <p className="text-lg leading-relaxed text-green-300">
            Yksi sovellus. Kaikki yhdessä paikassa.<br />
            Toimii puhelimella metsässä.
          </p>
        </div>
      </section>

      {/* ── SECTION 4: BENEFITS ─────────────────────────────────────────── */}
      <section className="bg-green-900/30 py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-white md:text-4xl">
            Mitä saat
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '⏱️',
                title: 'Säästät tunteja kuukaudessa',
                body: 'Jäsenmaksut, kutsut ja ilmoitukset hoituvat minuuteissa, ei tunneissa.',
              },
              {
                icon: '📱',
                title: 'Toimii metsässä',
                body: 'Mobiilioptimioitu. Ilmoita saalis tai varaa kartano myös hitaalla yhteydellä.',
              },
              {
                icon: '💳',
                title: 'Maksut automaattisesti',
                body: 'Lähetä laskut kaikille jäsenille yhdellä klikkauksella. Näet heti maksutilanteen.',
              },
              {
                icon: '👥',
                title: 'Jäsenet helposti mukaan',
                body: 'Kutsu uudet jäsenet sähköpostilla. He pääsevät mukaan yhdellä klikkauksella.',
              },
              {
                icon: '🔒',
                title: 'Tiedot turvassa',
                body: 'Jokaisen seuran tiedot täysin erillään. GDPR-yhteensopiva suomalainen palvelu.',
              },
              {
                icon: '🏕️',
                title: 'Kartano hallinnassa',
                body: 'Varauskalenteri estää päällekkäiset varaukset. Hinnasto ja ohjeet aina saatavilla.',
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-green-800 bg-green-900/50 px-6 py-6 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <p className="mb-3 text-2xl">{icon}</p>
                <p className="mb-2 font-bold text-white">{title}</p>
                <p className="text-sm leading-relaxed text-green-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FEATURES ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-white md:text-4xl">
            Kaikki mitä seura tarvitsee
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🦌', title: 'Saalisilmoitukset', body: '30 sekunnissa metsästä. Eläin, määrä, paikka — kaikki kirjattu.' },
              { icon: '📅', title: 'Tapahtumat', body: 'Talkoot, kokoukset ja jahdit. Jäsenet näkevät kaiken heti.' },
              { icon: '👤', title: 'Jäsenrekisteri', body: 'Kaikki tiedot järjestyksessä. Digitaalinen jäsenkortti mukana.' },
              { icon: '📋', title: 'Asiakirjat', body: 'Säännöt ja pöytäkirjat aina löydettävissä. Kategorisoitu selkeästi.' },
              { icon: '👥', title: 'Ryhmähallinta', body: 'Hirviseurue, peurajaosto — omat ryhmät omilla jäsenillä.' },
              { icon: '🗺️', title: 'Karttatunnukset', body: 'Karttapalvelujen tunnukset turvallisesti kaikille jäsenille.' },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-green-800/60 bg-white/[0.03] px-5 py-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="mt-0.5 text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="mb-1 font-bold text-white">{title}</p>
                  <p className="text-sm leading-relaxed text-green-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: QUOTE ────────────────────────────────────────────── */}
      <section className="bg-green-900/40 py-24 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-6 text-6xl leading-none text-green-600 select-none">&ldquo;</p>
          <blockquote className="mb-8 text-2xl font-semibold italic leading-relaxed text-white md:text-3xl">
            Vihdoin kaikki seuran asiat yhdessä paikassa. Hallituksen työ on helpottunut huomattavasti.
          </blockquote>
          <p className="mb-3 font-medium text-green-300">
            — Jari Simola, toiminnanjohtaja<br />Kyyjärven Erämiehet ry
          </p>
          <p className="text-xs text-green-600">Kehitetty yhdessä Kyyjärven Erämiehet ry:n kanssa 2026</p>
        </div>
      </section>

      {/* ── SECTION 7: INTEREST CAPTURE ─────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            Haluatko seurasi mukaan?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-green-200">
            Ilmoittaudu kiinnostuneeksi.<br />
            Olemme yhteydessä ennen julkaisua.
          </p>

          {submitMessage === 'registered' ? (
            <div className="rounded-2xl bg-green-900/60 px-6 py-8 ring-1 ring-green-700/50">
              <p className="text-3xl mb-3">✅</p>
              <p className="text-lg font-bold text-green-200">Kiitos!</p>
              <p className="mt-2 text-sm text-green-400">Olemme yhteydessä kun sovellus avautuu.</p>
            </div>
          ) : submitMessage === 'already_registered' ? (
            <div className="rounded-2xl bg-amber-900/40 px-6 py-8 ring-1 ring-amber-700/40">
              <p className="text-3xl mb-3">🎉</p>
              <p className="text-lg font-bold text-amber-200">Olet jo listalla!</p>
              <p className="mt-2 text-sm text-amber-400">Olemme yhteydessä kun sovellus avautuu.</p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3 text-left">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Sähköpostiosoitteesi"
                className="w-full rounded-xl border border-green-700 bg-white/10 px-4 py-3.5 text-white placeholder-green-600 outline-none focus:border-green-500"
              />
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Seurasi nimi"
                className="w-full rounded-xl border border-green-700 bg-white/10 px-4 py-3.5 text-white placeholder-green-600 outline-none focus:border-green-500"
              />
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-green-600 py-4 text-base font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Lähetetään...' : 'Ilmoittaudu →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── SECTION 8: BETA ACCESS ──────────────────────────────────────── */}
      <section className="pb-16 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <div className="h-px bg-green-800 mb-10" />
          <p className="mb-3 text-sm text-green-500">Oletko kutsuttu beta-testaajaksi?</p>
          <Link
            href="/login"
            className="inline-block rounded-xl border border-green-700 px-6 py-2.5 text-sm font-medium text-green-300 hover:border-green-500 hover:text-green-200 transition-colors"
          >
            Kirjaudu sisään →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-green-900 py-10 px-6 text-center">
        <p className="text-sm text-green-700">© 2026 JahtiPro · jahtipro.fi</p>
        <p className="mt-1 text-sm text-green-700">info@jahtipro.fi</p>
        <p className="mt-3">
          <Link href="/tietosuoja" className="text-xs text-green-700 underline hover:text-green-500">
            Tietosuojaseloste
          </Link>
        </p>
      </footer>

    </main>
  )
}
