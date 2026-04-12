'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

type Factor = { id: string; friendly_name: string | null; status: string }

export default function MfaSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState<Factor[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.mfa.listFactors()
      if (data) {
        setFactors((data.totp ?? []) as unknown as Factor[])
      }
      setLoading(false)
    }
    void load()
  }, [supabase])

  const startEnroll = async () => {
    setEnrolling(true)
    setError('')
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'JahtiPro Superadmin',
    })
    if (enrollError || !data) {
      setError(enrollError?.message ?? 'Virhe aloitettaessa')
      setEnrolling(false)
      return
    }
    setQrCode((data as unknown as { totp: { qr_code: string; secret: string; uri: string } }).totp.qr_code)
    setSecret((data as unknown as { totp: { secret: string } }).totp.secret)
    setFactorId(data.id)
  }

  const verifyEnroll = async () => {
    if (!factorId || !code.trim()) return
    setBusy(true)
    setError('')

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challengeData) {
      setError(challengeError?.message ?? 'Challenge epäonnistui')
      setBusy(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.trim(),
    })

    if (verifyError) {
      setError('Väärä koodi. Tarkista ja yritä uudelleen.')
      setBusy(false)
      return
    }

    setSuccess('2FA on nyt käytössä!')
    setEnrolling(false)
    setQrCode(null)
    setSecret(null)
    setCode('')
    setBusy(false)

    // Refresh factors
    const { data } = await supabase.auth.mfa.listFactors()
    if (data) setFactors((data.totp ?? []) as unknown as Factor[])
  }

  const unenroll = async () => {
    if (!confirm('Haluatko varmasti poistaa kaksivaiheisen tunnistautumisen käytöstä?')) return
    const factor = factors[0]
    if (!factor) return
    setBusy(true)
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    setBusy(false)
    if (unenrollError) {
      setError(unenrollError.message)
      return
    }
    setFactors([])
    setSuccess('2FA poistettu käytöstä')
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-green-600 outline-none focus:border-green-500 font-mono'
  const isEnrolled = factors.length > 0

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 flex items-center justify-center">
        <p className="text-green-500">Ladataan...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <Link href="/profiili" className="text-sm text-green-400 hover:text-green-300">← Profiili</Link>

        <div className="flex items-center gap-3">
          <Shield size={24} className="text-green-400" />
          <h1 className="text-xl font-bold text-white">Kaksivaiheinen tunnistautuminen</h1>
        </div>

        {success && <p className="rounded-lg bg-green-900/40 px-4 py-3 text-sm text-green-300">{success}</p>}
        {error && <p className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* Status */}
        <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
          {isEnrolled ? (
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-400" />
              <div>
                <p className="font-semibold text-white">2FA on käytössä</p>
                <p className="text-xs text-green-500">Kirjautuminen vaatii koodin sovelluksesta</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-yellow-400" />
              <div>
                <p className="font-semibold text-white">2FA ei ole käytössä</p>
                <p className="text-xs text-green-500">Suosittelemme ottamaan käyttöön</p>
              </div>
            </div>
          )}
        </div>

        {/* Enroll */}
        {!isEnrolled && !enrolling && (
          <button onClick={() => void startEnroll()} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors">
            Ota 2FA käyttöön
          </button>
        )}

        {/* QR Code + verification */}
        {enrolling && qrCode && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
            <p className="text-sm text-green-300">Skannaa QR-koodi Google Authenticator tai Authy -sovelluksella:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="flex justify-center">
              <img src={qrCode} alt="2FA QR code" className="rounded-lg bg-white p-2" width={200} height={200} />
            </div>
            {secret && (
              <div className="rounded-lg bg-green-900/30 px-3 py-2 text-center">
                <p className="text-xs text-green-500 mb-1">Tai syötä koodi käsin:</p>
                <p className="font-mono text-sm text-white tracking-wider break-all">{secret}</p>
              </div>
            )}
            <div>
              <p className="mb-2 text-sm text-green-300">Syötä 6-numeroinen koodi vahvistaaksesi:</p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoFocus
                className={inputCls}
              />
            </div>
            <button onClick={() => void verifyEnroll()} disabled={busy || code.length !== 6} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {busy ? 'Vahvistetaan...' : 'Vahvista ja ota käyttöön'}
            </button>
          </div>
        )}

        {/* Unenroll */}
        {isEnrolled && (
          <button onClick={() => void unenroll()} disabled={busy} className="w-full rounded-xl border border-red-800 py-3 text-sm font-semibold text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors">
            {busy ? 'Poistetaan...' : 'Poista 2FA käytöstä'}
          </button>
        )}
      </div>
    </main>
  )
}
