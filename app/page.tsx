'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [clubName, setClubName] = useState('')
  const [submitted, setSubmitted] = useState(false)
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
    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setFormError(data.error ?? 'Jokin meni pieleen. Yritä uudelleen.')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 text-white">

      {/* HERO */}
      <section className="mx-auto max-w-xl px-6 pb-12 pt-20 text-center">
        <div className="mb-4 text-6xl">🦌</div>

        <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-white md:text-6xl">
          JahtiPro
        </h1>

        <p className="mb-4 text-xl font-medium text-green-300">
          Metsästysseuran hallinta vihdoin helpoksi
        </p>

        <p className="mx-auto mb-6 max-w-sm text-base leading-relaxed text-green-100">
          Yksi sovellus jäsenrekisterille, tapahtumille, saalisilmoituksille,
          eräkartanon varauksille ja maksuille. Toimii puhelimella metsässä.
        </p>

        <span className="inline-block rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-semibold text-amber-300 ring-1 ring-amber-500/40">
          🚀 Tulossa 2026
        </span>
      </section>

      {/* INTEREST CAPTURE */}
      <section className="mx-auto max-w-md px-6 pb-14">
        <div className="rounded-2xl border border-green-800 bg-white/5 p-6">
          <h2 className="mb-1 text-center text-lg font-bold text-white">
            Haluatko seurasi ensimmäisten joukossa?
          </h2>
          <p className="mb-5 text-center text-sm text-green-400">
            Ilmoittaudu kiinnostuneeksi — olemme yhteydessä ennen julkaisua.
          </p>

          {submitted ? (
            <div className="rounded-xl bg-green-900/50 px-4 py-5 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold text-green-200">Kiitos!</p>
              <p className="mt-1 text-sm text-green-400">
                Olemme yhteydessä kun sovellus avautuu.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Sähköpostiosoitteesi"
                className="w-full rounded-xl border border-green-700 bg-white/10 px-4 py-3 text-sm text-white placeholder-green-600 outline-none focus:border-green-500"
              />
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Seurasi nimi"
                className="w-full rounded-xl border border-green-700 bg-white/10 px-4 py-3 text-sm text-white placeholder-green-600 outline-none focus:border-green-500"
              />
              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Lähetetään...' : 'Ilmoittaudu kiinnostuneeksi'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-xl px-6 pb-14">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: '🦌', title: 'Saalisilmoitus 30 sekunnissa', desc: 'Nopea ilmoitus suoraan metsästä.' },
            { icon: '📅', title: 'Tapahtumat ja varaukset', desc: 'Kalenteri, talkoot ja eräkartano.' },
            { icon: '💳', title: 'Jäsenmaksut hallinnassa', desc: 'Lähetä laskut yhdellä klikkauksella.' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-green-800 bg-white/5 px-5 py-4"
            >
              <p className="mb-2 text-3xl">{icon}</p>
              <p className="mb-1 font-semibold text-white text-sm">{title}</p>
              <p className="text-xs leading-relaxed text-green-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BETA ACCESS */}
      <section className="mx-auto max-w-xl px-6 pb-16">
        <div className="h-px bg-green-900 mb-8" />
        <div className="text-center">
          <p className="mb-3 text-sm text-green-500">
            Oletko kutsuttu beta-testaajaksi?
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl border border-green-700 px-5 py-2.5 text-sm font-medium text-green-300 hover:border-green-500 hover:text-green-200 transition-colors"
          >
            Kirjaudu beta-versioon →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-xl px-6 pb-12 text-center">
        <div className="h-px bg-green-900 mb-6" />
        <p className="text-xs text-green-700">© 2026 JahtiPro</p>
        <p className="mt-0.5 text-xs text-green-700">jahtipro.fi</p>
        <p className="mt-2">
          <Link href="/tietosuoja" className="text-xs text-green-700 underline hover:text-green-500">
            Tietosuojaseloste
          </Link>
        </p>
      </footer>

    </main>
  )
}
