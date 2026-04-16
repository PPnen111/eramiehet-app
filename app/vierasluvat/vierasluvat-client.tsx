'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Ticket, X, Check, AlertCircle, ChevronDown } from 'lucide-react'

export type MemberOption = {
  id: string
  type: 'profile' | 'registry'
  full_name: string
  email: string | null
}

export type PermitView = {
  id: string
  guest_name: string
  guest_email: string | null
  host_name: string | null
  area: string | null
  valid_from: string | null
  valid_until: string | null
  price_cents: number | null
  status: 'active' | 'expired' | 'cancelled'
  payment_id: string | null
  payment_status: 'paid' | 'pending' | 'none'
  notes: string | null
  is_active: boolean
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fi-FI')
}

function fmtRange(from: string | null, until: string | null): string {
  if (!from && !until) return '—'
  return `${fmtDate(from)} – ${fmtDate(until)}`
}

function fmtEuros(cents: number | null): string {
  if (cents === null || cents === undefined) return '—'
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`
}

export default function VierasluvatClient({
  active,
  past,
  hostOptions,
  canManage,
}: {
  active: PermitView[]
  past: PermitView[]
  hostOptions: MemberOption[]
  canManage: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [invoicePermit, setInvoicePermit] = useState<PermitView | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300">
          <ArrowLeft size={14} /> Takaisin
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ticket size={22} className="text-green-400" />
            <h1 className="text-2xl font-bold text-white">Vierasluvat</h1>
            <span className="rounded-full bg-green-800/60 px-2.5 py-0.5 text-xs font-medium text-green-200">
              {active.length}
            </span>
          </div>
          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              <Plus size={15} />
              Myönnä uusi lupa
            </button>
          )}
        </div>

        {/* Aktiiviset luvat */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
            Aktiiviset luvat
          </h2>
          {active.length === 0 ? (
            <div className="rounded-2xl border border-green-900 bg-white/[0.02] py-10 text-center text-sm text-green-600">
              Ei aktiivisia vieraslupia.
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((p) => (
                <PermitCard key={p.id} permit={p} canManage={canManage} onInvoice={() => setInvoicePermit(p)} />
              ))}
            </div>
          )}
        </section>

        {/* Menneet luvat */}
        {past.length > 0 && (
          <section>
            <button
              onClick={() => setShowPast((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-green-600 hover:text-green-500"
            >
              <span>Menneet luvat ({past.length})</span>
              <ChevronDown size={16} className={`transition-transform ${showPast ? 'rotate-180' : ''}`} />
            </button>
            {showPast && (
              <div className="mt-3 space-y-2">
                {past.map((p) => (
                  <PermitCard key={p.id} permit={p} canManage={false} onInvoice={() => setInvoicePermit(p)} dimmed />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showModal && (
        <NewPermitModal
          hostOptions={hostOptions}
          onClose={() => setShowModal(false)}
        />
      )}

      {invoicePermit && (
        <InvoiceModal
          permit={invoicePermit}
          onClose={() => setInvoicePermit(null)}
        />
      )}
    </main>
  )
}

function PermitCard({
  permit,
  canManage,
  onInvoice,
  dimmed,
}: {
  permit: PermitView
  canManage: boolean
  onInvoice: () => void
  dimmed?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const statusBadge =
    permit.status === 'cancelled'
      ? { label: 'Peruutettu', cls: 'bg-stone-800 text-stone-300' }
      : !permit.is_active
      ? { label: 'Päättynyt', cls: 'bg-stone-700 text-stone-200' }
      : permit.payment_status === 'paid'
      ? { label: '✅ Maksettu', cls: 'bg-green-800 text-green-200' }
      : permit.payment_status === 'pending'
      ? { label: '⏳ Odottaa maksua', cls: 'bg-yellow-900 text-yellow-200' }
      : { label: 'Ei laskutettu', cls: 'bg-stone-700 text-stone-300' }

  const cancel = async () => {
    if (!confirm('Haluatko varmasti peruuttaa tämän vierasluvan?')) return
    setBusy(true)
    const res = await fetch(`/api/guest-permits/${permit.id}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) router.refresh()
    else alert('Peruuttaminen epäonnistui')
  }

  return (
    <div className={`rounded-2xl border border-green-800 bg-white/5 p-4 ${dimmed ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{permit.guest_name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          </div>
          <div className="mt-1 grid gap-x-4 gap-y-0.5 text-xs text-green-400 sm:grid-cols-2">
            <p><span className="text-green-600">Isäntä:</span> {permit.host_name ?? '—'}</p>
            <p><span className="text-green-600">Alue:</span> {permit.area ?? '—'}</p>
            <p><span className="text-green-600">Voimassa:</span> {fmtRange(permit.valid_from, permit.valid_until)}</p>
            <p><span className="text-green-600">Hinta:</span> {fmtEuros(permit.price_cents)}</p>
          </div>
          {permit.notes && <p className="mt-2 text-xs text-green-500">{permit.notes}</p>}
        </div>
      </div>
      {canManage && permit.is_active && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onInvoice}
            className="rounded-lg border border-green-700 bg-green-900/40 px-3 py-1.5 text-xs font-semibold text-green-200 hover:bg-green-900/70 transition-colors"
          >
            Lähetä lasku
          </button>
          <button
            onClick={() => void cancel()}
            disabled={busy}
            className="rounded-lg border border-red-800 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/20 disabled:opacity-50 transition-colors"
          >
            Peruuta
          </button>
        </div>
      )}
    </div>
  )
}

function NewPermitModal({
  hostOptions,
  onClose,
}: {
  hostOptions: MemberOption[]
  onClose: () => void
}) {
  const router = useRouter()
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [hostSearch, setHostSearch] = useState('')
  const [selectedHost, setSelectedHost] = useState<MemberOption | null>(null)
  const [area, setArea] = useState('')
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10))
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [priceEur, setPriceEur] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const filteredHosts = useMemo(() => {
    const q = hostSearch.toLowerCase().trim()
    if (!q) return hostOptions.slice(0, 8)
    return hostOptions.filter((h) => h.full_name.toLowerCase().includes(q)).slice(0, 12)
  }, [hostSearch, hostOptions])

  const save = async () => {
    setError('')
    if (!guestName.trim()) { setError('Vieraan nimi puuttuu'); return }
    if (!selectedHost) { setError('Valitse isäntä'); return }

    const cents = priceEur.trim()
      ? Math.round(parseFloat(priceEur.replace(',', '.')) * 100)
      : null
    if (cents !== null && (isNaN(cents) || cents < 0)) {
      setError('Tarkista hinta'); return
    }

    setBusy(true)
    const res = await fetch('/api/guest-permits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_name: guestName,
        guest_email: guestEmail || undefined,
        host_profile_id: selectedHost.type === 'profile' ? selectedHost.id : undefined,
        host_registry_id: selectedHost.type === 'registry' ? selectedHost.id : undefined,
        area: area || undefined,
        valid_from: validFrom || undefined,
        valid_until: validUntil || undefined,
        price_cents: cents ?? undefined,
        notes: notes || undefined,
      }),
    })
    setBusy(false)
    if (res.ok) {
      router.refresh()
      onClose()
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      setError(d.error ?? 'Tallennus epäonnistui')
    }
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-green-700 bg-green-950 p-6 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Myönnä uusi vierasluvan</h2>
          <button onClick={onClose} className="text-green-500"><X size={16} /></button>
        </div>

        <div>
          <label className={labelCls}>Vieraan nimi *</label>
          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Vieraan sähköposti</label>
          <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={inputCls} placeholder="jos tiedossa — lasku lähtee sähköpostitse" />
        </div>

        <div>
          <label className={labelCls}>Isäntä *</label>
          {selectedHost ? (
            <div className="flex items-center justify-between rounded-lg border border-green-700 bg-green-900/40 px-3 py-2">
              <span className="text-sm text-green-200">{selectedHost.full_name}</span>
              <button onClick={() => setSelectedHost(null)} className="text-green-400 hover:text-green-300"><X size={14} /></button>
            </div>
          ) : (
            <>
              <input type="text" value={hostSearch} onChange={(e) => setHostSearch(e.target.value)} className={inputCls} placeholder="Hae jäseniä nimellä…" />
              {hostSearch && filteredHosts.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-green-800 bg-green-950">
                  {filteredHosts.map((h) => (
                    <button
                      key={`${h.type}-${h.id}`}
                      onClick={() => { setSelectedHost(h); setHostSearch('') }}
                      className="block w-full px-3 py-2 text-left text-sm text-green-200 hover:bg-green-900/60"
                    >
                      {h.full_name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className={labelCls}>Alue</label>
          <input type="text" value={area} onChange={(e) => setArea(e.target.value)} className={inputCls} placeholder="esim. Itälohko" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Voimassa alkaen</label>
            <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Voimassa asti</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Hinta (€)</label>
          <input type="text" inputMode="decimal" value={priceEur} onChange={(e) => setPriceEur(e.target.value)} className={inputCls} placeholder="esim. 30,00" />
        </div>

        <div>
          <label className={labelCls}>Lisätiedot</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} />
        </div>

        {error && (
          <p className="flex items-start gap-1.5 rounded-lg bg-red-900/40 px-3 py-2 text-xs text-red-300">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        <button
          onClick={() => void save()}
          disabled={busy || !guestName.trim() || !selectedHost}
          className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Tallennetaan…' : 'Tallenna'}
        </button>
      </div>
    </>
  )
}

function InvoiceModal({ permit, onClose }: { permit: PermitView; onClose: () => void }) {
  const router = useRouter()
  const [description, setDescription] = useState(
    `Vieraslupa — ${permit.guest_name}${permit.area ? ` (${permit.area})` : ''}`,
  )
  const [amountEur, setAmountEur] = useState(
    permit.price_cents !== null ? (permit.price_cents / 100).toFixed(2).replace('.', ',') : '',
  )
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
  const [email, setEmail] = useState(permit.guest_email ?? '')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ mode: 'email' | 'print'; paymentId: string } | null>(null)

  const willPrint = !permit.guest_email || !email.trim()

  const send = async () => {
    setError('')
    const cents = Math.round(parseFloat(amountEur.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setError('Tarkista summa'); return }

    setBusy(true)

    const createRes = await fetch(`/api/guest-permits/${permit.id}/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        amount_cents: cents,
        due_date: dueDate,
        notes: notes || undefined,
      }),
    }).catch(() => null)

    if (!createRes || !createRes.ok) {
      const err = createRes ? (await createRes.json().catch(() => ({}))) as { error?: string } : {}
      setError(err.error ?? 'Laskun luonti epäonnistui')
      setBusy(false)
      return
    }

    const data = (await createRes.json()) as { payment_id: string; delivery_mode: 'email' | 'print' }
    const paymentId = data.payment_id
    const mode: 'email' | 'print' = willPrint ? 'print' : data.delivery_mode

    if (mode === 'email') {
      const sendRes = await fetch('/api/invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          recipient_email: email,
          recipient_name: permit.guest_name,
        }),
      }).catch(() => null)

      if (!sendRes || !sendRes.ok) {
        setError('Lasku luotu, mutta sähköpostin lähetys epäonnistui. Voit avata PDF:n tulostettavaksi.')
        setDone({ mode: 'print', paymentId })
        setBusy(false)
        return
      }
    } else {
      window.open(`/api/invoice-pdf/preview?payment_id=${paymentId}`, '_blank', 'noopener,noreferrer')
    }

    setBusy(false)
    setDone({ mode, paymentId })
    router.refresh()
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-green-700 bg-green-950 p-6 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Lähetä lasku</h2>
          <button onClick={onClose} className="text-green-500"><X size={16} /></button>
        </div>

        {done ? (
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-sm text-green-300">
              <Check size={14} />
              {done.mode === 'email' ? 'Lasku lähetetty sähköpostiin' : 'Lasku avattu tulostettavaksi'}
            </p>
            {done.mode === 'print' && (
              <a
                href={`/api/invoice-pdf/preview?payment_id=${done.paymentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg border border-green-700 py-2 text-center text-sm text-green-300 hover:bg-white/5"
              >
                Avaa PDF uudelleen
              </a>
            )}
            <button onClick={onClose} className="w-full rounded-lg bg-green-700 py-2 text-sm font-semibold text-white">Sulje</button>
          </div>
        ) : (
          <>
            <div>
              <label className={labelCls}>Vastaanottaja</label>
              <p className="rounded-lg bg-white/5 px-3 py-2 text-sm text-green-200">{permit.guest_name}</p>
            </div>
            <div>
              <label className={labelCls}>Laskutustapa</label>
              <p className="rounded-lg bg-white/5 px-3 py-2 text-sm text-green-200">
                {willPrint ? 'Tulostettava PDF' : 'Sähköposti'}
              </p>
            </div>
            <div>
              <label className={labelCls}>Summa (€)</label>
              <input type="text" inputMode="decimal" value={amountEur} onChange={(e) => setAmountEur(e.target.value)} className={inputCls} placeholder="30,00" />
            </div>
            <div>
              <label className={labelCls}>Eräpäivä</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kuvaus</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
            </div>
            {permit.guest_email && (
              <div>
                <label className={labelCls}>Sähköposti</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Lisätiedot</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} />
            </div>
            {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-xs text-red-300">{error}</p>}
            <button
              onClick={() => void send()}
              disabled={busy}
              className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Käsitellään…' : willPrint ? 'Luo ja avaa tulostettavaksi' : 'Lähetä sähköpostilla'}
            </button>
          </>
        )}
      </div>
    </>
  )
}
