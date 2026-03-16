'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'

type MemberOption = {
  id: string
  full_name: string | null
}

type Payment = {
  id: string
  profile_id: string
  description: string
  amount_cents: number
  due_date: string | null
  paid_at: string | null
  status: string
  profiles: { full_name: string | null } | null
}

type Toast = {
  id: string
  message: string
  type: 'success' | 'error'
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Maksettu', cls: 'bg-green-800 text-green-200' },
  pending: { label: 'Odottaa', cls: 'bg-yellow-900 text-yellow-200' },
  overdue: { label: 'Myöhässä', cls: 'bg-red-900 text-red-200' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
}

interface Props {
  clubId: string
}

export default function TabPayments({ clubId }: Props) {
  const supabase = createClient()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [invoiceBusy, setInvoiceBusy] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [description, setDescription] = useState('')
  const [amountEur, setAmountEur] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [formError, setFormError] = useState('')

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: mData }, { data: pData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('club_id', clubId)
        .eq('member_status', 'active'),
      supabase
        .from('payments')
        .select('id, profile_id, description, amount_cents, due_date, paid_at, status, profiles(full_name)')
        .eq('club_id', clubId)
        .order('due_date', { ascending: false, nullsFirst: false }),
    ])
    setMembers((mData ?? []) as MemberOption[])
    setPayments((pData ?? []) as unknown as Payment[])
    setLoading(false)
  }, [clubId, supabase])

  useEffect(() => { load() }, [load])

  const markPaid = async (id: string) => {
    setBusy(id)
    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
    setBusy(null)
    load()
  }

  const deletePayment = async (id: string) => {
    if (!confirm('Poistetaanko maksu?')) return
    setBusy(id)
    await supabase.from('payments').delete().eq('id', id)
    setBusy(null)
    load()
  }

  const sendInvoice = async (paymentId: string) => {
    setInvoiceBusy(paymentId)
    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId }),
      })
      if (res.ok) {
        showToast('Lasku lähetetty!', 'success')
      } else {
        const data = await res.json() as { error?: string }
        showToast(data.error ?? 'Lähetys epäonnistui.', 'error')
      }
    } catch {
      showToast('Verkkovirhe. Yritä uudelleen.', 'error')
    }
    setInvoiceBusy(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const cents = Math.round(parseFloat(amountEur.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setFormError('Tarkista summa.'); return }
    const { error } = await supabase.from('payments').insert({
      club_id: clubId,
      profile_id: targetId,
      description,
      amount_cents: cents,
      due_date: dueDate || null,
      status: 'pending',
    })
    if (error) { setFormError(error.message); return }
    setDescription('')
    setAmountEur('')
    setDueDate('')
    setTargetId('')
    setFormOpen(false)
    load()
  }

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelClass = 'mb-1 block text-sm text-green-300'

  return (
    <div className="space-y-5">
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                t.type === 'success'
                  ? 'bg-green-800/60 text-green-200'
                  : 'bg-red-900/60 text-red-200'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {!formOpen ? (
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Lisää maksu
        </button>
      ) : (
        <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <h2 className="mb-4 font-semibold text-white">Uusi maksu</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className={labelClass}>Jäsen *</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
              >
                <option value="">Valitse jäsen...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Kuvaus *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="esim. Jäsenmaksu 2025"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Summa (€) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountEur}
                  onChange={(e) => setAmountEur(e.target.value)}
                  required
                  placeholder="0,00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Eräpäivä</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {formError && (
              <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{formError}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white">
                Tallenna
              </button>
              <button
                type="button"
                onClick={() => { setFormOpen(false); setFormError('') }}
                className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-300"
              >
                Peruuta
              </button>
            </div>
          </form>
        </div>
      )}

      {payments.length === 0 ? (
        <p className="text-sm text-green-600">Ei maksuja.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const cfg = statusConfig[p.status] ?? statusConfig.pending
            const profileName = (p.profiles as unknown as { full_name: string | null } | null)?.full_name
            const isBusy = busy === p.id || invoiceBusy === p.id
            return (
              <div key={p.id} className="rounded-xl border border-green-800 bg-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{p.description}</p>
                    <p className="text-xs text-green-400">
                      {profileName ?? '—'}
                      {p.due_date && ` · eräpäivä ${formatDate(p.due_date)}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-white">{formatEuros(p.amount_cents)}</p>
                    <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.status !== 'paid' && (
                    <>
                      <button
                        onClick={() => markPaid(p.id)}
                        disabled={isBusy}
                        className="rounded-lg bg-green-800 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Merkitse maksetuksi
                      </button>
                      <button
                        onClick={() => sendInvoice(p.id)}
                        disabled={isBusy}
                        className="rounded-lg border border-green-700 px-3 py-1 text-xs font-semibold text-green-300 hover:bg-green-800/40 disabled:opacity-50"
                      >
                        {invoiceBusy === p.id ? 'Lähetetään...' : 'Lähetä lasku'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deletePayment(p.id)}
                    disabled={isBusy}
                    className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                  >
                    Poista
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
