'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface Props {
  email: string
  clubId: string
  token: string
}

export default function JoinForm({ email, clubId, token }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputClass =
    'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700'
  const labelClass = 'mb-1 block text-sm font-medium text-neutral-700'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Salasanan täytyy olla vähintään 6 merkkiä pitkä.')
      return
    }

    if (password !== confirmPassword) {
      setError('Salasanat eivät täsmää.')
      return
    }

    setLoading(true)

    // Create auth user with club metadata
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          club_id: clubId,
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      setError('Tilin luominen epäonnistui: ' + signUpError.message)
      setLoading(false)
      return
    }

    // Mark invitation as accepted
    await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className={labelClass}>Vahvista salasana *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Toista salasana"
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
          {loading ? 'Luodaan tiliä...' : 'Luo tili ja liity seuraan'}
        </button>
      </form>
    </div>
  )
}
