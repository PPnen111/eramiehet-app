'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

export default function MfaVerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = (factors?.totp ?? []) as unknown as { id: string }[]
      if (totp.length === 0) {
        // No MFA enrolled, go straight to dashboard
        router.push('/dashboard')
        return
      }
      setFactorId(totp[0].id)

      // Check if already verified at aal2
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') {
        router.push('/dashboard')
        return
      }
      setLoading(false)
    }
    void check()
  }, [supabase, router])

  const verify = async () => {
    if (!factorId || code.length !== 6) return
    setBusy(true)
    setError('')

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challengeData) {
      setError('Challenge epäonnistui')
      setBusy(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.trim(),
    })

    if (verifyError) {
      setError('Väärä koodi, yritä uudelleen')
      setCode('')
      setBusy(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) void verify()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 flex items-center justify-center">
        <p className="text-green-500">Ladataan...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 flex items-center justify-center px-4">
      <div className="mx-auto max-w-sm w-full space-y-6">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-green-400 mb-4" />
          <h1 className="text-xl font-bold text-white">Kaksivaiheinen tunnistautuminen</h1>
          <p className="mt-2 text-sm text-green-400">Syötä 6-numeroinen koodi sovelluksestasi</p>
        </div>

        <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={handleKeyDown}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoFocus
            className="w-full rounded-lg border border-green-800 bg-white/10 px-4 py-4 text-center text-3xl tracking-[0.6em] text-white placeholder-green-700 outline-none focus:border-green-500 font-mono"
          />

          {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-center text-red-300">{error}</p>}

          <button
            onClick={() => void verify()}
            disabled={busy || code.length !== 6}
            className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Vahvistetaan...' : 'Vahvista'}
          </button>
        </div>

        <p className="text-center text-xs text-green-600">
          Avaa Google Authenticator tai Authy ja syötä koodi
        </p>
      </div>
    </main>
  )
}
