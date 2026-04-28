'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function DemoPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Syötä sähköpostiosoite.'); return }
    setBusy(true)
    const res = await fetch('/api/demo-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setBusy(false)
    if (res.ok) {
      setDone(true)
    } else {
      const d = (await res.json()) as { error?: string }
      setError(d.error ?? 'Jokin meni pieleen.')
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 flex items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center space-y-6">
          <CheckCircle size={64} className="mx-auto text-green-400" />
          <h1 className="text-2xl font-bold text-white">Tunnukset lähetetty!</h1>
          <p className="text-green-300">
            Tarkista sähköpostisi <span className="font-semibold text-white">{email}</span> — kirjautumistiedot ovat matkalla.
          </p>
          <a
            href="https://jahtipro.fi/login"
            className="inline-block rounded-xl bg-green-600 px-8 py-3.5 text-base font-bold text-white hover:bg-green-500 transition-colors"
          >
            Kirjaudu JahtiProhon →
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/landing-test" className="text-2xl font-bold text-green-400">JahtiPro</Link>
          <h1 className="mt-4 text-3xl font-bold text-white">Kokeile JahtiProta ilmaiseksi</h1>
          <p className="mt-3 text-sm text-green-300 leading-relaxed">
            Syötä sähköpostiosoitteesi ja saat henkilökohtaiset tunnukset Demo Erämiehet -seuraan. Tunnus on voimassa 14 päivää.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-green-800 bg-white/5 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-green-300">Sähköposti</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="oma@email.fi"
              className="w-full rounded-lg border border-green-800 bg-white/10 px-4 py-3 text-sm text-white placeholder-green-600 outline-none focus:border-green-500"
            />
          </div>

          {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-green-600 py-3.5 text-base font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Luodaan tunnuksia...' : 'Aloita demo →'}
          </button>

          <p className="text-center text-xs text-green-600">
            Ei luottokorttia. Ei sitoumuksia.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-green-600">
          Onko sinulla jo tili?{' '}
          <Link href="/login" className="text-green-400 hover:text-green-300">Kirjaudu sisään</Link>
        </p>
      </div>
    </main>
  )
}
