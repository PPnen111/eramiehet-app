'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

// Check hash before component mounts so initial state is correct
function hasRecoveryHash(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hash.includes('type=recovery')
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [ready, setReady] = useState(hasRecoveryHash)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  useEffect(() => {
    // Check hash fragment (implicit flow fallback)
    if (window.location.hash.includes('type=recovery')) {
      setReady(true)
    }

    // Handle PKCE code in URL (if redirected here directly instead of via callback)
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          setReady(true)
          // Clean URL
          window.history.replaceState({}, '', '/reset-password')
        }
      })
    }

    // Check if session already exists (set by callback route)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (password !== confirm) {
      setMessage('Salasanat eivät täsmää.')
      setMessageType('error')
      return
    }

    if (password.length < 6) {
      setMessage('Salasanan on oltava vähintään 6 merkkiä.')
      setMessageType('error')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setMessage('Salasanan vaihto epäonnistui. Pyydä uusi palautuslinkki.')
      setMessageType('error')
      return
    }

    setMessage('Salasana vaihdettu onnistuneesti!')
    setMessageType('success')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const inputCls =
    'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700'
  const labelCls = 'mb-1 block text-sm font-medium text-neutral-700'

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-950 to-stone-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">JahtiPro</h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-5 text-lg font-semibold text-neutral-800">Aseta uusi salasana</h2>

          {!ready ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-neutral-500">
                Ladataan palautuslinkkiä...
              </p>
              <p className="text-xs text-neutral-400">
                Jos sivu ei lataudu, palautuslinkki on saattanut vanhentua.{' '}
                <a href="/login" className="text-green-700 hover:underline">
                  Pyydä uusi linkki
                </a>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Uusi salasana</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Vähintään 6 merkkiä"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Vahvista salasana</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Toista salasana"
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-800 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              >
                {loading ? 'Vaihdetaan...' : 'Vaihda salasana'}
              </button>
            </form>
          )}

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
        </div>
      </div>
    </main>
  )
}
