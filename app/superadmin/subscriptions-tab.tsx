'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export type SubscriptionRow = {
  id: string
  club_id: string
  club_name: string | null
  status: string
  trial_starts_at: string | null
  trial_ends_at: string | null
  activated_at: string | null
  created_at: string
}

interface Props {
  subscriptions: SubscriptionRow[]
}

type ToastState = { message: string; type: 'success' | 'error' } | null

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const now = new Date()
  const end = new Date(iso)
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function StatusBadge({ status, trialEndsAt }: { status: string; trialEndsAt: string | null }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-700 px-2.5 py-0.5 text-xs font-semibold text-green-100">
        <CheckCircle size={11} />
        Aktiivinen
      </span>
    )
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-900 px-2.5 py-0.5 text-xs font-semibold text-red-200">
        <XCircle size={11} />
        Päättynyt
      </span>
    )
  }
  if (status === 'trial') {
    const days = daysUntil(trialEndsAt)
    const isExpired = days !== null && days <= 0
    const isWarning = days !== null && days > 0 && days <= 7
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-900 px-2.5 py-0.5 text-xs font-semibold text-red-200">
          <XCircle size={11} />
          Kokeilu päättynyt
        </span>
      )
    }
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          isWarning ? 'bg-amber-600 text-white' : 'bg-blue-800 text-blue-100'
        }`}
      >
        <Clock size={11} />
        Kokeilu {days !== null ? `(${days} pv)` : ''}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-stone-700 px-2.5 py-0.5 text-xs font-semibold text-stone-300">
      {status}
    </span>
  )
}

interface ActivateModalProps {
  sub: SubscriptionRow
  onClose: () => void
  onSuccess: () => void
}

function ActivateModal({ sub, onClose, onSuccess }: ActivateModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleActivate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/superadmin/activate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: sub.id }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Virhe')
      } else {
        onSuccess()
      }
    } catch {
      setError('Verkkovirhe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-green-700 bg-stone-950 p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-bold text-white">Aktivoi tilaus</h2>
        <p className="mb-1 text-sm text-green-300">
          Seura: <strong className="text-white">{sub.club_name ?? sub.club_id}</strong>
        </p>
        <p className="mb-5 text-sm text-green-400">
          Asettaa tilauksen tilaksi &quot;Aktiivinen&quot; — ei enää kokeilu- tai kokeilupäättynyt-tila.
        </p>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-stone-700 py-2.5 text-sm font-semibold text-stone-300 hover:bg-stone-800 disabled:opacity-50"
          >
            Peruuta
          </button>
          <button
            onClick={handleActivate}
            disabled={loading}
            className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? 'Aktivoidaan...' : 'Aktivoi tilaus'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionsTab({ subscriptions }: Props) {
  const router = useRouter()
  const [activatingFor, setActivatingFor] = useState<SubscriptionRow | null>(null)
  const [extendingId, setExtendingId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleExtendTrial(sub: SubscriptionRow) {
    setExtendingId(sub.id)
    try {
      const res = await fetch('/api/superadmin/extend-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: sub.id }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        showToast(data.error ?? 'Virhe', 'error')
      } else {
        showToast('Kokeilu jatkettu 30 päivällä', 'success')
        router.refresh()
      }
    } catch {
      showToast('Verkkovirhe', 'error')
    } finally {
      setExtendingId(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
            Tilaukset ({subscriptions.length})
          </h2>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-sm text-green-600">Ei tilauksia.</p>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((sub) => {
              const days = daysUntil(sub.trial_ends_at)
              const isTrialExpiredOrLow =
                sub.status === 'trial' && (days === null || days <= 7)
              return (
                <div
                  key={sub.id}
                  className="rounded-xl border border-green-800 bg-white/5 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">
                        {sub.club_name ?? sub.club_id}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-green-600">
                        {sub.trial_starts_at && (
                          <span>Kokeilu alkanut {formatDate(sub.trial_starts_at)}</span>
                        )}
                        {sub.trial_ends_at && (
                          <span>Kokeilu päättyy {formatDate(sub.trial_ends_at)}</span>
                        )}
                        {sub.activated_at && (
                          <span>Aktivoitu {formatDate(sub.activated_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusBadge status={sub.status} trialEndsAt={sub.trial_ends_at} />
                      {sub.status !== 'active' && (
                        <button
                          onClick={() => setActivatingFor(sub)}
                          className="rounded-lg border border-green-700 px-2.5 py-1 text-xs font-semibold text-green-300 hover:bg-green-900/50 transition-colors"
                        >
                          Aktivoi tilaus
                        </button>
                      )}
                      {isTrialExpiredOrLow && (
                        <button
                          onClick={() => handleExtendTrial(sub)}
                          disabled={extendingId === sub.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-700 px-2.5 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-900/40 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw size={11} className={extendingId === sub.id ? 'animate-spin' : ''} />
                          {extendingId === sub.id ? '...' : 'Jatka kokeilua'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {activatingFor && (
        <ActivateModal
          sub={activatingFor}
          onClose={() => setActivatingFor(null)}
          onSuccess={() => {
            setActivatingFor(null)
            showToast('Tilaus aktivoitu', 'success')
            router.refresh()
          }}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl ${
            toast.type === 'success' ? 'bg-green-700 text-white' : 'bg-red-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}
