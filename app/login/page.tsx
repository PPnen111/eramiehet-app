'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'

type Mode = 'login' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [loading, setLoading] = useState(false)

  const showMsg = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage(text)
    setMessageType(type)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setMessage('')
    setEmail('')
    setPassword('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      showMsg(error.message, 'error')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)

    if (error) {
      showMsg(error.message, 'error')
      return
    }

    showMsg('Salasanan palautuslinkki lähetetty sähköpostiisi.', 'success')
  }

  const inputCls =
    'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700'
  const labelCls = 'mb-1 block text-sm font-medium text-neutral-700'

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-950 to-stone-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">JahtiPro</h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Sähköposti</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Salasana</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-800 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              >
                {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
              </button>
              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-green-700 hover:text-green-600 hover:underline"
                >
                  Unohditko salasanan?
                </button>
              </p>
            </form>
          )}

          {/* Password reset request form */}
          {mode === 'reset' && (
            <div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mb-4 text-sm text-green-700 hover:text-green-600"
              >
                ← Takaisin kirjautumiseen
              </button>
              <h2 className="mb-4 text-base font-semibold text-neutral-800">Palauta salasana</h2>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className={labelCls}>Sähköposti</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Syötä tilisi sähköpostiosoite"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-green-800 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Lähetetään...' : 'Lähetä palautuslinkki'}
                </button>
              </form>
            </div>
          )}

          {/* Message */}
          {message && (
            <p className={`mt-4 rounded-lg p-3 text-sm ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800'
                : messageType === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-neutral-100 text-neutral-700'
            }`}>
              {message}
            </p>
          )}

          {/* Bottom link — hidden: club registration disabled */}
          <p className="mt-3 text-center text-xs text-neutral-400">
            Rekisteröitymällä hyväksyt{' '}
            <Link href="/tietosuoja" className="text-green-700 underline hover:text-green-600">
              tietosuojaselosteen
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
