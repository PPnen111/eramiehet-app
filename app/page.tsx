'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Rocket,
  MessageSquareWarning,
  FileSpreadsheet,
  Clock,
  Timer,
  Smartphone,
  CreditCard,
  Users,
  Shield,
  Tent,
  Crosshair,
  CalendarDays,
  FileText,
  Map,
  CheckCircle,
} from 'lucide-react'

const iconBox = 'inline-flex items-center justify-center rounded-lg bg-green-900/50 p-2 text-green-400'
const card = 'rounded-2xl border border-green-800 bg-green-900 px-6 py-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-950/60'

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

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-green-900 bg-green-950/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <img
          src="/jahtipro-logo.png"
          alt="JahtiPro"
          className="h-8 md:h-9 w-auto object-contain brightness-110 contrast-110 mix-blend-darken drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]"
        />
        <a
          href="/login"
          className="rounded-xl border border-green-700 px-4 py-2 text-sm text-green-200 transition hover:bg-green-900"
        >
          Kirjaudu sisään (beta)
        </a>
      </header>

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-green-950 via-green-950 to-green-900 pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full bg-green-800/60 px-4 py-1.5 text-sm font-semibold text-green-300 ring-1 ring-green-700/50">
            <Rocket className="h-4 w-4" />
            Suljettu beta käynnissä
          </span>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Käytä aikasi rakkaaseen harrastukseen.<br />
            <span className="text-green-300">Vähemmän hallintoon.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-green-200">
            JahtiPro hoitaa metsästysseuran hallinnon puolestasi — jäsenrekisteristä
            maksuihin ja saalisilmoituksista eräkartanon varauksiin.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#signup"
              className="w-full rounded-xl bg-green-600 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-green-500 sm:w-auto"
            >
              Ilmoittaudu beta-listalle →
            </a>
            <a
              href="#features"
              className="w-full rounded-xl border border-green-700 px-8 py-4 text-base font-medium text-green-300 transition-colors hover:border-green-500 hover:text-green-200 sm:w-auto"
            >
              Katso miten toimii ↓
            </a>
          </div>

          <p className="mt-10 text-sm text-green-500">
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
      <section className="bg-green-900/40 py-24 px-6 md:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Tuntuuko tämä tutulta?
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { icon: <MessageSquareWarning className="h-6 w-6" />, title: 'WhatsApp-kaaos', body: 'Tapahtumat, maksut ja ilmoitukset hukkuvat ryhmäviesteihin. Tärkeät asiat katoavat.' },
              { icon: <FileSpreadsheet className="h-6 w-6" />, title: 'Excel kaikkialla', body: 'Jäsenrekisteri, maksut ja varaukset eri tiedostoissa. Hallitus tekee tuplatyötä joka vuosi.' },
              { icon: <Clock className="h-6 w-6" />, title: 'Aikaa tuhlaantuu', body: 'Kokoukset, muistutukset, pöytäkirjat — hallintoon kuluu tunteja jotka voisi viettää metsässä.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className={card}>
                <div className={`${iconBox} mb-4`}>{icon}</div>
                <p className="mb-2 font-bold text-white">{title}</p>
                <p className="text-sm leading-relaxed text-green-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: SOLUTION ─────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center md:py-32">
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-green-500">Ratkaisu</p>
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
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
      <section className="bg-green-900/30 py-24 px-6 md:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Mitä saat
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Timer className="h-6 w-6" />, title: 'Säästät tunteja kuukaudessa', body: 'Jäsenmaksut, kutsut ja ilmoitukset hoituvat minuuteissa, ei tunneissa.' },
              { icon: <Smartphone className="h-6 w-6" />, title: 'Toimii metsässä', body: 'Mobiilioptimioitu. Ilmoita saalis tai varaa kartano myös hitaalla yhteydellä.' },
              { icon: <CreditCard className="h-6 w-6" />, title: 'Maksut automaattisesti', body: 'Lähetä laskut kaikille jäsenille yhdellä klikkauksella. Näet heti maksutilanteen.' },
              { icon: <Users className="h-6 w-6" />, title: 'Jäsenet helposti mukaan', body: 'Kutsu uudet jäsenet sähköpostilla. He pääsevät mukaan yhdellä klikkauksella.' },
              { icon: <Shield className="h-6 w-6" />, title: 'Tiedot turvassa', body: 'Jokaisen seuran tiedot täysin erillään. GDPR-yhteensopiva suomalainen palvelu.' },
              { icon: <Tent className="h-6 w-6" />, title: 'Kartano hallinnassa', body: 'Varauskalenteri estää päällekkäiset varaukset. Hinnasto ja ohjeet aina saatavilla.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className={card}>
                <div className={`${iconBox} mb-4`}>{icon}</div>
                <p className="mb-2 font-bold text-white">{title}</p>
                <p className="text-sm leading-relaxed text-green-300">{body}</p>
              </div>
            ))}
          </div>

          {/* Secondary CTA after benefits */}
          <div className="mt-12 text-center">
            <a
              href="#signup"
              className="inline-block rounded-xl bg-green-600 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-green-500"
            >
              Ilmoittaudu mukaan →
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 md:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Kaikki mitä seura tarvitsee
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Crosshair className="h-6 w-6" />, title: 'Saalisilmoitukset', body: '30 sekunnissa metsästä. Eläin, määrä, paikka — kaikki kirjattu.' },
              { icon: <CalendarDays className="h-6 w-6" />, title: 'Tapahtumat', body: 'Talkoot, kokoukset ja jahdit. Jäsenet näkevät kaiken heti.' },
              { icon: <Users className="h-6 w-6" />, title: 'Jäsenrekisteri', body: 'Kaikki tiedot järjestyksessä. Digitaalinen jäsenkortti mukana.' },
              { icon: <FileText className="h-6 w-6" />, title: 'Asiakirjat', body: 'Säännöt ja pöytäkirjat aina löydettävissä. Kategorisoitu selkeästi.' },
              { icon: <Users className="h-6 w-6" />, title: 'Ryhmähallinta', body: 'Hirviseurue, peurajaosto — omat ryhmät omilla jäsenillä.' },
              { icon: <Map className="h-6 w-6" />, title: 'Karttatunnukset', body: 'Karttapalvelujen tunnukset turvallisesti kaikille jäsenille.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-green-800 bg-green-900 px-5 py-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-950/60">
                <div className={`${iconBox} mt-0.5 shrink-0`}>{icon}</div>
                <div>
                  <p className="mb-1 font-bold text-white">{title}</p>
                  <p className="text-sm leading-relaxed text-green-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: INTEREST CAPTURE ─────────────────────────────────── */}
      <section id="signup" className="bg-green-900/30 py-24 px-6 md:py-32">
        <div className="mx-auto max-w-md text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Haluatko seurasi mukaan?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-green-200">
            Ilmoittaudu kiinnostuneeksi.<br />
            Olemme yhteydessä ennen julkaisua.
          </p>

          {submitMessage === 'registered' ? (
            <div className="rounded-2xl bg-green-900 px-6 py-8 ring-1 ring-green-700/50">
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-400" />
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
                className="w-full rounded-xl border border-green-800 bg-green-900 px-4 py-3 text-white placeholder-green-500 outline-none focus:border-green-500"
              />
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Seurasi nimi"
                className="w-full rounded-xl border border-green-800 bg-green-900 px-4 py-3 text-white placeholder-green-500 outline-none focus:border-green-500"
              />
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-green-600 py-4 text-base font-bold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
              >
                {submitting ? 'Lähetetään...' : 'Ilmoittaudu →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── SECTION 7: BETA ACCESS ──────────────────────────────────────── */}
      <section className="pb-16 pt-16 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <div className="h-px bg-green-800 mb-10" />
          <p className="mb-3 text-sm text-green-500">Oletko kutsuttu beta-testaajaksi?</p>
          <Link
            href="/login"
            className="inline-block rounded-xl border border-green-700 px-6 py-2.5 text-sm font-medium text-green-300 transition-colors hover:border-green-500 hover:text-green-200"
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
