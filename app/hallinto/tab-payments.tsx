'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { formatDate, formatEuros } from '@/lib/format'
import { generateReferenceNumber } from '@/lib/utils/reference-number'
import InvoicePreviewModal, { type InvoicePreviewPayment } from '@/app/components/invoice-preview-modal'

const PAYMENT_TYPES = [
  { value: 'jäsenmaksu', label: 'Jäsenmaksu' },
  { value: 'liittymismaksu', label: 'Liittymismaksu' },
  { value: 'jahtimaksu', label: 'Jahtimaksu' },
  { value: 'vieraslupa', label: 'Vieraslupa' },
  { value: 'eräkartano', label: 'Eräkartano' },
  { value: 'muu', label: 'Muu' },
]

const PAYMENT_METHODS = [
  { value: 'tilisiirto', label: 'Tilisiirto' },
  { value: 'käteinen', label: 'Käteinen' },
  { value: 'muu', label: 'Muu' },
]

type MemberOption = {
  id: string
  full_name: string | null
  email: string | null
}

type Payment = {
  id: string
  profile_id: string
  description: string
  amount_cents: number
  due_date: string | null
  paid_at: string | null
  status: string
  sent_at: string | null
  reference_number: string | null
  payment_type: string | null
  payment_method: string | null
  additional_info: string | null
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

interface Props {
  clubId: string
}

export default function TabPayments({ clubId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [members, setMembers] = useState<MemberOption[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [clubName, setClubName] = useState('Metsästysseura')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [invoiceBusy, setInvoiceBusy] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null)

  // Form section
  const [formOpen, setFormOpen] = useState(false)
  const [formTab, setFormTab] = useState<'single' | 'bulk'>('single')

  // Single invoice form
  const [singleTargetId, setSingleTargetId] = useState('')
  const [singleDescription, setSingleDescription] = useState('')
  const [singleAmountEur, setSingleAmountEur] = useState('')
  const [singleDueDate, setSingleDueDate] = useState('')
  const [singlePaymentType, setSinglePaymentType] = useState('jäsenmaksu')
  const [singleAdditionalInfo, setSingleAdditionalInfo] = useState('')
  const [singlePaymentMethod, setSinglePaymentMethod] = useState('tilisiirto')
  const [singleBusy, setSingleBusy] = useState<'save' | 'email' | 'pdf' | null>(null)
  const [singleError, setSingleError] = useState('')

  // Bulk invoice form
  const [bulkDescription, setBulkDescription] = useState('')
  const [bulkAmountEur, setBulkAmountEur] = useState('')
  const [bulkDueDate, setBulkDueDate] = useState('')
  const [bulkPaymentType, setBulkPaymentType] = useState('jäsenmaksu')
  const [bulkAdditionalInfo, setBulkAdditionalInfo] = useState('')
  const [bulkBusy, setBulkBusy] = useState<'create' | 'create-email' | null>(null)
  const [bulkError, setBulkError] = useState('')

  const singleActionRef = useRef<'save' | 'email' | 'pdf'>('save')

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: mData }, { data: pData }, { data: clubData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('club_id', clubId)
        .eq('member_status', 'active'),
      supabase
        .from('payments')
        .select(
          'id, profile_id, description, amount_cents, due_date, paid_at, status, sent_at, reference_number, payment_type, payment_method, additional_info, profiles(full_name)'
        )
        .eq('club_id', clubId)
        .order('due_date', { ascending: false, nullsFirst: false }),
      supabase.from('clubs').select('name').eq('id', clubId).single(),
    ])
    setMembers((mData ?? []) as unknown as MemberOption[])
    setPayments((pData ?? []) as unknown as Payment[])
    setClubName((clubData as { name: string } | null)?.name ?? 'Metsästysseura')
    setLoading(false)
  }, [clubId, supabase])

  useEffect(() => {
    void load()
  }, [load])

  const markPaid = async (id: string) => {
    setBusy(id)
    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
    setBusy(null)
    void load()
  }

  const deletePayment = async (id: string) => {
    if (!confirm('Poistetaanko maksu?')) return
    setBusy(id)
    await supabase.from('payments').delete().eq('id', id)
    setBusy(null)
    void load()
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
        await supabase
          .from('payments')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', paymentId)
        showToast('Lasku lähetetty!', 'success')
        void load()
      } else {
        const data = (await res.json()) as { error?: string }
        showToast(data.error ?? 'Lähetys epäonnistui.', 'error')
      }
    } catch {
      showToast('Verkkovirhe. Yritä uudelleen.', 'error')
    }
    setInvoiceBusy(null)
  }

  const resetSingleForm = () => {
    setSingleTargetId('')
    setSingleDescription('')
    setSingleAmountEur('')
    setSingleDueDate('')
    setSinglePaymentType('jäsenmaksu')
    setSingleAdditionalInfo('')
    setSinglePaymentMethod('tilisiirto')
    setSingleError('')
  }

  const resetBulkForm = () => {
    setBulkDescription('')
    setBulkAmountEur('')
    setBulkDueDate('')
    setBulkPaymentType('jäsenmaksu')
    setBulkAdditionalInfo('')
    setBulkError('')
  }

  const handleSingleSubmit = async () => {
    const action = singleActionRef.current
    setSingleError('')
    if (!singleTargetId) { setSingleError('Valitse jäsen.'); return }
    if (!singleDescription) { setSingleError('Kuvaus vaaditaan.'); return }
    const cents = Math.round(parseFloat(singleAmountEur.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setSingleError('Tarkista summa.'); return }

    setSingleBusy(action)

    const { data: newRaw, error: insertError } = await supabase
      .from('payments')
      .insert({
        club_id: clubId,
        profile_id: singleTargetId,
        description: singleDescription,
        amount_cents: cents,
        due_date: singleDueDate || null,
        status: 'pending',
        payment_type: singlePaymentType,
        reference_number: generateReferenceNumber(),
        additional_info: singleAdditionalInfo || null,
        payment_method: singlePaymentMethod,
      })
      .select('id')
      .single()

    if (insertError || !newRaw) {
      setSingleError(insertError?.message ?? 'Tallennus epäonnistui')
      setSingleBusy(null)
      return
    }

    const paymentId = (newRaw as { id: string }).id

    if (action === 'email') {
      try {
        const res = await fetch('/api/send-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId }),
        })
        if (res.ok) {
          await supabase
            .from('payments')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', paymentId)
          showToast('Lasku tallennettu ja sähköposti lähetetty!', 'success')
        } else {
          const errBody = (await res.json()) as { error?: string }
          showToast(
            (errBody.error ?? 'Sähköpostin lähetys epäonnistui') + ' – lasku tallennettu.',
            'error'
          )
        }
      } catch {
        showToast('Verkkovirhe lähettäessä. Lasku on tallennettu.', 'error')
      }
      resetSingleForm()
      setSingleBusy(null)
      void load()
    } else if (action === 'pdf') {
      resetSingleForm()
      setSingleBusy(null)
      router.push(`/laskut/${paymentId}`)
    } else {
      showToast('Lasku tallennettu!', 'success')
      resetSingleForm()
      setSingleBusy(null)
      void load()
    }
  }

  const handleBulk = async (sendEmail: boolean) => {
    setBulkError('')
    if (!bulkDescription) { setBulkError('Kuvaus vaaditaan.'); return }
    const cents = Math.round(parseFloat(bulkAmountEur.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setBulkError('Tarkista summa.'); return }

    setBulkBusy(sendEmail ? 'create-email' : 'create')

    try {
      const res = await fetch('/api/send-bulk-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          description: bulkDescription,
          amount_cents: cents,
          due_date: bulkDueDate || null,
          payment_type: bulkPaymentType,
          additional_info: bulkAdditionalInfo || null,
          send_email: sendEmail,
        }),
      })

      const data = (await res.json()) as {
        created?: number
        sent?: number
        skipped?: number
        error?: string
      }

      if (!res.ok) {
        setBulkError(data.error ?? 'Virhe massalaskujen luomisessa')
      } else {
        const { created = 0, sent = 0, skipped = 0 } = data
        let msg = `Luotu ${created} laskua`
        if (skipped > 0) msg += `, ohitettu ${skipped} duplikaattia`
        if (sendEmail && sent > 0) msg += `, lähetetty ${sent} sähköpostia`
        showToast(msg, 'success')
        resetBulkForm()
        setFormOpen(false)
        void load()
      }
    } catch {
      setBulkError('Verkkovirhe. Yritä uudelleen.')
    } finally {
      setBulkBusy(null)
    }
  }

  // Bulk preview values
  const bulkCents = Math.round(parseFloat(bulkAmountEur.replace(',', '.')) * 100)
  const bulkPreviewValid = !isNaN(bulkCents) && bulkCents > 0 && bulkDescription.length > 0
  const activeCount = members.length

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>

  const inputCls =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectCls =
    'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-sm text-green-300'
  const tabBtn = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-green-700 text-white'
        : 'bg-white/5 text-green-400 hover:bg-white/10'
    }`

  return (
    <div className="space-y-5">
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                t.type === 'success' ? 'bg-green-800/60 text-green-200' : 'bg-red-900/60 text-red-200'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Luo uusi lasku section ── */}
      {!formOpen ? (
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
        >
          + Luo uusi lasku
        </button>
      ) : (
        <div className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Luo uusi lasku</h2>
            <button
              onClick={() => {
                setFormOpen(false)
                resetSingleForm()
                resetBulkForm()
              }}
              className="text-xs text-green-500 hover:text-green-300"
            >
              Sulje
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button className={tabBtn(formTab === 'single')} onClick={() => setFormTab('single')}>
              Yksittäinen lasku
            </button>
            <button className={tabBtn(formTab === 'bulk')} onClick={() => setFormTab('bulk')}>
              Massalasku kaikille
            </button>
          </div>

          {/* ── Single invoice form ── */}
          {formTab === 'single' && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Jäsen *</label>
                <select
                  value={singleTargetId}
                  onChange={(e) => setSingleTargetId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Valitse jäsen...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name ?? m.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Laskun tyyppi</label>
                  <select
                    value={singlePaymentType}
                    onChange={(e) => setSinglePaymentType(e.target.value)}
                    className={selectCls}
                  >
                    {PAYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Maksutapa</label>
                  <select
                    value={singlePaymentMethod}
                    onChange={(e) => setSinglePaymentMethod(e.target.value)}
                    className={selectCls}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Kuvaus *</label>
                <input
                  type="text"
                  value={singleDescription}
                  onChange={(e) => setSingleDescription(e.target.value)}
                  placeholder="esim. Jäsenmaksu 2025"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Summa (€) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={singleAmountEur}
                    onChange={(e) => setSingleAmountEur(e.target.value)}
                    placeholder="0,00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Eräpäivä</label>
                  <input
                    type="date"
                    value={singleDueDate}
                    onChange={(e) => setSingleDueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Lisätiedot</label>
                <textarea
                  value={singleAdditionalInfo}
                  onChange={(e) => setSingleAdditionalInfo(e.target.value)}
                  rows={2}
                  placeholder="Lisätietoja laskulle (valinnainen)"
                  className={inputCls}
                />
              </div>

              {singleError && (
                <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{singleError}</p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={singleBusy !== null}
                  onClick={() => { singleActionRef.current = 'save'; void handleSingleSubmit() }}
                  className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {singleBusy === 'save' ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button
                  type="button"
                  disabled={singleBusy !== null}
                  onClick={() => { singleActionRef.current = 'email'; void handleSingleSubmit() }}
                  className="flex-1 rounded-lg border border-green-700 py-2 text-sm font-semibold text-green-300 hover:bg-green-900/40 disabled:opacity-50 transition-colors"
                >
                  {singleBusy === 'email' ? 'Lähetetään...' : 'Tallenna ja lähetä sähköpostilla'}
                </button>
                <button
                  type="button"
                  disabled={singleBusy !== null}
                  onClick={() => { singleActionRef.current = 'pdf'; void handleSingleSubmit() }}
                  className="flex-1 rounded-lg border border-green-700 py-2 text-sm font-semibold text-green-300 hover:bg-green-900/40 disabled:opacity-50 transition-colors"
                >
                  {singleBusy === 'pdf' ? 'Tallennetaan...' : 'Tallenna ja tulosta PDF'}
                </button>
              </div>
            </div>
          )}

          {/* ── Bulk invoice form ── */}
          {formTab === 'bulk' && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Laskun tyyppi</label>
                <select
                  value={bulkPaymentType}
                  onChange={(e) => setBulkPaymentType(e.target.value)}
                  className={selectCls}
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Kuvaus *</label>
                <input
                  type="text"
                  value={bulkDescription}
                  onChange={(e) => setBulkDescription(e.target.value)}
                  placeholder="esim. Jäsenmaksu 2025"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Summa (€) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={bulkAmountEur}
                    onChange={(e) => setBulkAmountEur(e.target.value)}
                    placeholder="0,00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Eräpäivä</label>
                  <input
                    type="date"
                    value={bulkDueDate}
                    onChange={(e) => setBulkDueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Lisätiedot</label>
                <textarea
                  value={bulkAdditionalInfo}
                  onChange={(e) => setBulkAdditionalInfo(e.target.value)}
                  rows={2}
                  placeholder="Lisätietoja (valinnainen)"
                  className={inputCls}
                />
              </div>

              {/* Preview */}
              {bulkPreviewValid && (
                <div className="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-3 text-sm">
                  <p className="font-medium text-green-300">Esikatselu</p>
                  <p className="mt-1 text-green-400">
                    Lähetetään <span className="font-semibold text-white">{activeCount}</span> aktiiviselle
                    jäsenelle
                  </p>
                  <p className="text-green-400">
                    Yhteensä:{' '}
                    <span className="font-semibold text-white">
                      {formatEuros(bulkCents * activeCount)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    Duplikaatit (sama kuvaus + sama vuosi) ohitetaan automaattisesti.
                  </p>
                </div>
              )}

              {bulkError && (
                <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{bulkError}</p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={bulkBusy !== null}
                  onClick={() => void handleBulk(false)}
                  className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {bulkBusy === 'create' ? 'Luodaan...' : 'Luo laskut kaikille'}
                </button>
                <button
                  type="button"
                  disabled={bulkBusy !== null}
                  onClick={() => void handleBulk(true)}
                  className="flex-1 rounded-lg border border-green-700 py-2 text-sm font-semibold text-green-300 hover:bg-green-900/40 disabled:opacity-50 transition-colors"
                >
                  {bulkBusy === 'create-email' ? 'Lähetetään...' : 'Luo ja lähetä sähköpostilla'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Payment list ── */}
      {payments.length === 0 ? (
        <p className="text-sm text-green-600">Ei maksuja.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const cfg = statusConfig[p.status] ?? statusConfig.pending
            const profileName = (
              p.profiles as unknown as { full_name: string | null } | null
            )?.full_name
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
                    {p.sent_at && (
                      <p className="text-xs text-green-600">
                        Lähetetty {formatDate(p.sent_at)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-white">{formatEuros(p.amount_cents)}</p>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {p.status !== 'paid' && (
                    <button
                      onClick={() => void markPaid(p.id)}
                      disabled={isBusy}
                      className="rounded-lg bg-green-800 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Merkitse maksetuksi
                    </button>
                  )}

                  {p.status !== 'paid' && !p.sent_at && (
                    <button
                      onClick={() => void sendInvoice(p.id)}
                      disabled={isBusy}
                      className="rounded-lg border border-green-700 px-3 py-1 text-xs font-semibold text-green-300 hover:bg-green-800/40 disabled:opacity-50"
                    >
                      {invoiceBusy === p.id ? 'Lähetetään...' : 'Lähetä sähköpostilla'}
                    </button>
                  )}

                  <button
                    onClick={() => setPreviewPayment(p)}
                    className="rounded-lg border border-green-800 px-3 py-1 text-xs font-semibold text-green-400 hover:bg-white/5"
                  >
                    Esikatsele
                  </button>

                  <Link
                    href={`/laskut/${p.id}`}
                    className="rounded-lg border border-green-800 px-3 py-1 text-xs font-semibold text-green-400 hover:bg-white/5"
                  >
                    Tulosta PDF
                  </Link>

                  <button
                    onClick={() => void deletePayment(p.id)}
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

      {previewPayment && (
        <InvoicePreviewModal
          payment={previewPayment as unknown as InvoicePreviewPayment}
          memberName={
            (previewPayment.profiles as unknown as { full_name: string | null } | null)
              ?.full_name ?? null
          }
          clubName={clubName}
          onClose={() => setPreviewPayment(null)}
        />
      )}
    </div>
  )
}
