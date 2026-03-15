'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

    router.push('/dashboard')
    router.refresh()
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700'
  const labelClass = 'mb-1 block text-sm font-medium text-neutral-700'

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-950 to-stone-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Rekisteröi uusi seura</h1>
          <p className="mt-2 text-sm text-green-400">Luo tili ja rekisteröi metsästysseurasi</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-800 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {loading ? 'Rekisteröidään...' : 'Rekisteröi seura'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-500">
            Onko sinulla jo tili?{' '}
            <Link href="/login" className="font-medium text-green-700 hover:text-green-600">
              Kirjaudu sisään
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
