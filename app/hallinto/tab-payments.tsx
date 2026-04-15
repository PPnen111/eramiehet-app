'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Check, Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { formatDate, formatEuros } from '@/lib/format'
import { generateReferenceNumber } from '@/lib/utils/reference-number'

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

type FilterType = 'all' | 'unpaid' | 'overdue' | 'paid'

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Maksettu', cls: 'bg-green-800 text-green-200' },
  pending: { label: 'Odottaa', cls: 'bg-yellow-900 text-yellow-200' },
  overdue: { label: 'Myöhässä', cls: 'bg-red-900 text-red-200' },
}

function isOverdue(p: Payment): boolean {
  if (p.status === 'paid') return false
  if (!p.due_date) return false
  return p.due_date < new Date().toISOString().slice(0, 10)
}

function getEffectiveStatus(p: Payment): string {
  if (p.status === 'paid') return 'paid'
  if (isOverdue(p)) return 'overdue'
  return 'pending'
}

function sortPayments(payments: Payment[]): Payment[] {
  return [...payments].sort((a, b) => {
    const sa = getEffectiveStatus(a)
    const sb = getEffectiveStatus(b)
    const order: Record<string, number> = { overdue: 0, pending: 1, paid: 2 }
    const oa = order[sa] ?? 1
    const ob = order[sb] ?? 1
    if (oa !== ob) return oa - ob
    // Within overdue: oldest due_date first
    if (sa === 'overdue') {
      return (a.due_date ?? '').localeCompare(b.due_date ?? '')
    }
    // Within pending: nearest due_date first
    if (sa === 'pending') {
      return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
    }
    // Within paid: most recently paid first
    return (b.paid_at ?? '').localeCompare(a.paid_at ?? '')
  })
}

interface Props {
  clubId: string
}

export default function TabPayments({ clubId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [members, setMembers] = useState<MemberOption[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [remindBusy, setRemindBusy] = useState<string | null>(null)
  const [bulkRemindBusy, setBulkRemindBusy] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pdfModal, setPdfModal] = useState<Payment | null>(null)
  const [pdfName, setPdfName] = useState('')
  const [pdfEmail, setPdfEmail] = useState('')
  const [pdfAddress, setPdfAddress] = useState('')
  const [pdfPostal, setPdfPostal] = useState('')
  const [pdfNotes, setPdfNotes] = useState('14 päivän maksuehto. Kiitos!')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [filter, setFilter] = useState<FilterType>('unpaid')

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
    const [{ data: mData }, { data: pData }] = await Promise.all([
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
    ])
    setMembers((mData ?? []) as unknown as MemberOption[])
    setPayments((pData ?? []) as unknown as Payment[])
    setLoading(false)
  }, [clubId, supabase])

  useEffect(() => {
    void load()
  }, [load])

  // Computed counts
  const overduePayments = useMemo(() => payments.filter((p) => isOverdue(p)), [payments])
  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status !== 'paid' && !isOverdue(p)),
    [payments]
  )
  const paidPayments = useMemo(() => payments.filter((p) => p.status === 'paid'), [payments])

  // Filtered + sorted list
  const filteredPayments = useMemo(() => {
    let list: Payment[]
    switch (filter) {
      case 'unpaid':
        list = payments.filter((p) => p.status !== 'paid')
        break
      case 'overdue':
        list = overduePayments
        break
      case 'paid':
        list = paidPayments
        break
      default:
        list = payments
    }
    return sortPayments(list)
  }, [payments, filter, overduePayments, paidPayments])

  const quickTogglePaid = async (id: string) => {
    // Optimistic update
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'paid', paid_at: new Date().toISOString() } : p
      )
    )
    const res = await fetch(`/api/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
    })
    if (!res.ok) {
      showToast('Virhe merkittäessä maksetuksi', 'error')
      void load() // Revert on error
    }
  }

  const deletePayment = async (id: string) => {
    if (!confirm('Haluatko varmasti poistaa laskun?')) return
    setBusy(id)
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    setBusy(null)
    if (res.ok) {
      showToast('Lasku poistettu', 'success')
      void load()
    } else {
      const data = (await res.json()) as { error?: string }
      showToast(data.error ?? 'Poisto epäonnistui', 'error')
    }
  }


  const sendReminder = async (paymentId: string) => {
    setRemindBusy(paymentId)
    try {
      const res = await fetch('/api/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ids: [paymentId] }),
      })
      if (res.ok) {
        showToast('Muistutus lähetetty!', 'success')
      } else {
        const data = (await res.json()) as { error?: string }
        showToast(data.error ?? 'Muistutuksen lähetys epäonnistui', 'error')
      }
    } catch {
      showToast('Verkkovirhe.', 'error')
    }
    setRemindBusy(null)
  }

  const sendBulkReminder = async () => {
    const ids = overduePayments.map((p) => p.id)
    if (ids.length === 0) return
    setBulkRemindBusy(true)
    try {
      const res = await fetch('/api/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ids: ids }),
      })
      if (res.ok) {
        const data = (await res.json()) as { sent: number; skipped: number }
        showToast(`Muistutus lähetetty ${data.sent} jäsenelle`, 'success')
      } else {
        const data = (await res.json()) as { error?: string }
        showToast(data.error ?? 'Lähetys epäonnistui', 'error')
      }
    } catch {
      showToast('Verkkovirhe.', 'error')
    }
    setBulkRemindBusy(false)
  }

  const openPdfModal = (p: Payment) => {
    setPdfModal(p)
    const profileName = (p.profiles as unknown as { full_name: string | null } | null)?.full_name
    setPdfName(profileName ?? '')
    setPdfEmail('')
    setPdfAddress('')
    setPdfPostal('')
    setPdfNotes('14 päivän maksuehto. Kiitos!')
  }

  const sendPdfInvoice = async () => {
    if (!pdfModal || !pdfEmail.trim()) return
    setPdfBusy(true)
    const res = await fetch('/api/invoice-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: pdfModal.id,
        recipient_email: pdfEmail,
        recipient_name: pdfName || undefined,
        recipient_address: pdfAddress || undefined,
        recipient_postal: pdfPostal || undefined,
        notes: pdfNotes || undefined,
      }),
    })
    setPdfBusy(false)
    if (res.ok) {
      showToast('PDF-lasku lähetetty sähköpostiin', 'success')
      setPdfModal(null)
      void load()
    } else {
      const d = (await res.json()) as { error?: string }
      showToast(d.error ?? 'Lähetys epäonnistui', 'error')
    }
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

  const filterBtn = (f: FilterType, label: string, count?: number, badgeCls?: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        filter === f
          ? 'bg-green-700 text-white'
          : 'bg-white/5 text-green-400 hover:bg-white/10'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
            badgeCls ?? 'bg-green-600 text-white'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )

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

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {filterBtn('unpaid', 'Maksamattomat', pendingPayments.length + overduePayments.length)}
        {filterBtn('overdue', 'Myöhässä', overduePayments.length, 'bg-red-600 text-white')}
        {filterBtn('paid', 'Maksettu', paidPayments.length)}
        {filterBtn('all', 'Kaikki', payments.length)}

        {/* Bulk remind button */}
        {overduePayments.length > 0 && (
          <button
            onClick={() => void sendBulkReminder()}
            disabled={bulkRemindBusy}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-800/60 disabled:opacity-50 transition-colors"
          >
            <Bell size={12} />
            {bulkRemindBusy
              ? 'Lähetetään...'
              : `Muistutus kaikille myöhässä (${overduePayments.length})`}
          </button>
        )}
      </div>

      {/* ── Payment list ── */}
      {filteredPayments.length === 0 ? (
        <p className="text-sm text-green-600">
          {filter === 'all' ? 'Ei maksuja.' : 'Ei maksuja tässä näkymässä.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredPayments.map((p) => {
            const effectiveStatus = getEffectiveStatus(p)
            const cfg = statusConfig[effectiveStatus] ?? statusConfig.pending
            const profileName = (
              p.profiles as unknown as { full_name: string | null } | null
            )?.full_name
            const isBusy = busy === p.id
            const isPaid = p.status === 'paid'
            const isOD = effectiveStatus === 'overdue'

            return (
              <div
                key={p.id}
                className={`rounded-xl border p-3 transition-colors ${
                  isPaid
                    ? 'border-green-900/50 bg-green-900/10'
                    : isOD
                      ? 'border-red-800/60 bg-red-900/10'
                      : 'border-green-800 bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Quick toggle checkbox */}
                  <button
                    onClick={() => { if (!isPaid) void quickTogglePaid(p.id) }}
                    disabled={isPaid}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      isPaid
                        ? 'border-green-600 bg-green-700 text-white cursor-default'
                        : 'border-green-700 bg-transparent text-transparent hover:border-green-500 hover:bg-green-900/40 cursor-pointer'
                    }`}
                    title={isPaid ? 'Maksettu' : 'Merkitse maksetuksi'}
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate font-medium ${isPaid ? 'text-green-500 line-through' : 'text-white'}`}>
                          {p.description}
                        </p>
                        <p className="text-xs text-green-400">
                          {profileName ?? '—'}
                          {p.due_date && ` · eräpäivä ${formatDate(p.due_date)}`}
                          {p.reference_number && ` · viite ${p.reference_number}`}
                        </p>
                        {p.sent_at && (
                          <p className="text-xs text-green-600">
                            Lähetetty {formatDate(p.sent_at)}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`font-semibold ${isPaid ? 'text-green-500' : 'text-white'}`}>
                          {formatEuros(p.amount_cents)}
                        </p>
                        <span
                          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {!isPaid && (
                        <button
                          onClick={() => openPdfModal(p)}
                          className="rounded-lg bg-green-800 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Lähetä PDF-lasku
                        </button>
                      )}

                      <a
                        href={`/api/invoice-pdf/preview?payment_id=${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-green-800 px-3 py-1 text-xs font-semibold text-green-400 hover:bg-white/5"
                      >
                        Lataa PDF
                      </a>

                      {isOD && (
                        <button
                          onClick={() => void sendReminder(p.id)}
                          disabled={remindBusy === p.id}
                          className="flex items-center gap-1 rounded-lg bg-red-900/40 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-800/40 disabled:opacity-50"
                        >
                          <Bell size={11} />
                          {remindBusy === p.id ? 'Lähetetään...' : 'Lähetä muistutus'}
                        </button>
                      )}

                      <button
                        onClick={() => void deletePayment(p.id)}
                        disabled={isBusy}
                        title="Poista lasku"
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Poista
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PDF Invoice modal */}
      {pdfModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setPdfModal(null)} />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-green-700 bg-green-950 p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Lähetä PDF-lasku</h2>
              <button onClick={() => setPdfModal(null)} className="text-green-500 hover:text-green-300"><X size={16} /></button>
            </div>
            <div><label className="mb-1 block text-xs text-green-400">Vastaanottajan nimi</label><input type="text" value={pdfName} onChange={(e) => setPdfName(e.target.value)} className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500" /></div>
            <div><label className="mb-1 block text-xs text-green-400">Sähköposti *</label><input type="email" value={pdfEmail} onChange={(e) => setPdfEmail(e.target.value)} className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500" placeholder="vastaanottaja@esimerkki.fi" /></div>
            <div><label className="mb-1 block text-xs text-green-400">Osoite</label><input type="text" value={pdfAddress} onChange={(e) => setPdfAddress(e.target.value)} className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500" /></div>
            <div><label className="mb-1 block text-xs text-green-400">Postinumero ja -toimipaikka</label><input type="text" value={pdfPostal} onChange={(e) => setPdfPostal(e.target.value)} className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500" /></div>
            <div><label className="mb-1 block text-xs text-green-400">Lisätiedot</label><input type="text" value={pdfNotes} onChange={(e) => setPdfNotes(e.target.value)} className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500" /></div>
            <button onClick={() => void sendPdfInvoice()} disabled={pdfBusy || !pdfEmail.trim()} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50">
              {pdfBusy ? 'Lähetetään...' : 'Lähetä PDF-lasku →'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
