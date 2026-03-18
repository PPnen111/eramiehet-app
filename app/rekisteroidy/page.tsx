'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

export default function RekisteroidyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [clubName, setClubName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          club_name: clubName,
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-green-950/60 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'
  const labelClass = 'mb-1 block text-sm font-medium text-green-300'

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-green-500">
            Erämiehet
          </p>
          <h1 className="text-3xl font-bold text-white">Aloita käyttö</h1>
          <p className="mt-2 text-sm text-green-400">
            Valitse vaihtoehto joka sopii tilanteeseesi
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Vaihtoehto A — Uusi seura */}
          <div className="rounded-2xl border border-green-700 bg-green-950/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-800">
                <Building2 size={20} className="text-green-200" />
              </div>
              <div>
                <h2 className="font-bold text-white">Uusi seura</h2>
                <p className="text-xs text-green-500">Rekisteröi metsästysseurasi</p>
              </div>
            </div>

            {success ? (
              <p className="rounded-lg bg-green-900/60 p-3 text-sm text-green-200">
                Rekisteröityminen onnistui! Siirrytään sovellukseen…
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className={labelClass}>Seuran nimi *</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    placeholder="esim. Koiviston Erämiehet ry"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Oma nimi *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Etunimi Sukunimi"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Sähköposti *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nimi@esimerkki.fi"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Salasana *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Vähintään 6 merkkiä"
                    className={inputClass}
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-950/60 p-3 text-sm text-red-300">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Rekisteröidään...' : 'Rekisteröi seura'}
                </button>

                <p className="text-center text-xs text-green-600">
                  Sinusta tulee seuran ylläpitäjä
                </p>
              </form>
            )}
          </div>

          {/* Vaihtoehto B — Liity olemassa olevaan seuraan */}
          <div className="rounded-2xl border border-green-800 bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-900">
                <Users size={20} className="text-green-300" />
              </div>
              <div>
                <h2 className="font-bold text-white">Liity seuraan</h2>
                <p className="text-xs text-green-500">Seurasi on jo rekisteröity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-green-800/60 bg-green-950/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Mail size={14} className="text-green-400" />
                  <p className="text-sm font-medium text-green-300">Pyydä kutsu sähköpostitse</p>
                </div>
                <p className="text-sm text-green-500">
                  Pyydä seurasi ylläpitäjää lähettämään sinulle kutsu sähköpostitse.
                </p>
              </div>

              <p className="text-xs text-green-600">
                Ylläpitäjä voi lähettää kutsun <strong className="text-green-500">Hallinto</strong>-sivulta.
                Saat sähköpostiisi linkin, jonka kautta pääset rekisteröitymään suoraan oikeaan seuraan.
              </p>

              <Link
                href="/liity"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-700 py-2.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-900/40"
              >
                Minulla on kutsu →
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-green-600">
          Onko sinulla jo tili?{' '}
          <Link href="/login" className="font-medium text-green-400 hover:text-green-300">
            Kirjaudu sisään
          </Link>
        </p>
      </div>
    </main>
  )
}
