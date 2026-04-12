'use client'

import { useEffect, useState, useCallback } from 'react'
import { Pencil, Trash2, X, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { formatDate } from '@/lib/format'

const LOCATIONS = [
  { value: 'erakartano', label: 'Eräkartano' },
  { value: 'takkatupa', label: 'Takkatupa' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'nylkyvaja', label: 'Nylkyvaja' },
  { value: 'majoitustilat', label: 'Majoitustilat' },
]

const STATUSES = [
  { value: 'pending', label: 'Odottaa' },
  { value: 'confirmed', label: 'Vahvistettu' },
  { value: 'cancelled', label: 'Peruutettu' },
]

type BookingRow = {
  id: string
  profile_id: string
  starts_on: string
  ends_on: string
  note: string | null
  profiles: { full_name: string | null } | null
}

type ParsedBooking = {
  id: string
  profile_id: string
  starts_on: string
  ends_on: string
  location: string
  booker_name: string | null
  status: string
  note: string | null
  profile_name: string | null
}

type Toast = { id: string; message: string; type: 'success' | 'error' }

function parseLocation(note: string | null): string {
  return note?.match(/\[kohde:(\w+)\]/)?.[1] ?? 'erakartano'
}

function parseStatus(note: string | null): string {
  return note?.match(/\[tila:(\w+)\]/)?.[1] ?? 'pending'
}

function parseBookerName(note: string | null): string | null {
  return note?.match(/\[varaaja:([^\]]+)\]/)?.[1] ?? null
}

function parseCleanNote(note: string | null): string | null {
  const clean = note
    ?.replace(/\[kohde:[^\]]+\]\n?/g, '')
    .replace(/\[varaaja:[^\]]+\]\n?/g, '')
    .replace(/\[tila:[^\]]+\]\n?/g, '')
    .trim()
  return clean || null
}

function parseBooking(b: BookingRow): ParsedBooking {
  return {
    id: b.id,
    profile_id: b.profile_id,
    starts_on: b.starts_on,
    ends_on: b.ends_on,
    location: parseLocation(b.note),
    booker_name: parseBookerName(b.note),
    status: parseStatus(b.note),
    note: parseCleanNote(b.note),
    profile_name: (b.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
  }
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Odottaa', cls: 'bg-orange-500/30 text-orange-300' },
  confirmed: { label: 'Vahvistettu', cls: 'bg-green-800 text-green-200' },
  cancelled: { label: 'Peruutettu', cls: 'bg-red-900/60 text-red-300' },
}

const locationLabel: Record<string, string> = Object.fromEntries(
  LOCATIONS.map((l) => [l.value, l.label])
)

interface Props {
  clubId: string
}

export default function TabBookings({ clubId }: Props) {
  const supabase = createClient()
  const [bookings, setBookings] = useState<ParsedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [editing, setEditing] = useState<ParsedBooking | null>(null)

  // Edit form state
  const [editBookerName, setEditBookerName] = useState('')
  const [editStartsOn, setEditStartsOn] = useState('')
  const [editEndsOn, setEditEndsOn] = useState('')
  const [editLocation, setEditLocation] = useState('erakartano')
  const [editNote, setEditNote] = useState('')
  const [editStatus, setEditStatus] = useState('pending')
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState('')
  const [filterLocation, setFilterLocation] = useState<string>('all')

  // Invoice modal state
  const [invoiceBookingId, setInvoiceBookingId] = useState<string | null>(null)
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [invoiceDesc, setInvoiceDesc] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDue, setInvoiceDue] = useState('')
  const [invoiceBusy, setInvoiceBusy] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('id, profile_id, starts_on, ends_on, note, profiles(full_name)')
      .eq('club_id', clubId)
      .order('starts_on', { ascending: false })

    const rows = (data ?? []) as unknown as BookingRow[]
    setBookings(rows.map(parseBooking))
    setLoading(false)
  }, [clubId, supabase])

  useEffect(() => {
    void load()
  }, [load])

  const openEdit = (b: ParsedBooking) => {
    setEditing(b)
    setEditBookerName(b.booker_name ?? '')
    setEditStartsOn(b.starts_on)
    setEditEndsOn(b.ends_on)
    setEditLocation(b.location)
    setEditNote(b.note ?? '')
    setEditStatus(b.status)
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editing) return
    setEditError('')
    if (!editStartsOn || !editEndsOn) {
      setEditError('Päivämäärät ovat pakollisia')
      return
    }
    if (editEndsOn < editStartsOn) {
      setEditError('Loppupäivä ei voi olla ennen alkupäivää')
      return
    }

    setEditBusy(true)
    const res = await fetch(`/api/bookings/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        starts_on: editStartsOn,
        ends_on: editEndsOn,
        location: editLocation,
        booker_name: editBookerName || null,
        note: editNote || null,
        status: editStatus,
      }),
    })
    setEditBusy(false)

    if (res.ok) {
      showToast('Varaus päivitetty', 'success')
      setEditing(null)
      void load()
    } else {
      const data = (await res.json()) as { error?: string }
      setEditError(data.error ?? 'Tallennus epäonnistui')
    }
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Haluatko varmasti poistaa varauksen?')) return
    setBusy(id)
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    setBusy(null)
    if (res.ok) {
      showToast('Varaus poistettu', 'success')
      void load()
    } else {
      const data = (await res.json()) as { error?: string }
      showToast(data.error ?? 'Poisto epäonnistui', 'error')
    }
  }

  const openInvoiceModal = (b: ParsedBooking) => {
    setInvoiceBookingId(b.id)
    setInvoiceEmail('')
    setInvoiceDesc(`${locationLabel[b.location] ?? b.location} varaus ${b.starts_on}–${b.ends_on}`)
    setInvoiceAmount('')
    setInvoiceDue(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
    setInvoiceError('')
  }

  const sendInvoice = async () => {
    if (!invoiceBookingId || !invoiceEmail || !invoiceAmount) { setInvoiceError('Täytä pakolliset kentät.'); return }
    setInvoiceBusy(true)
    const res = await fetch(`/api/bookings/${invoiceBookingId}/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booker_email: invoiceEmail,
        description: invoiceDesc,
        amount_cents: Math.round(parseFloat(invoiceAmount.replace(',', '.')) * 100),
        due_date: invoiceDue,
      }),
    })
    setInvoiceBusy(false)
    if (res.ok) {
      showToast('Lasku lähetetty ja lisätty maksulistalle', 'success')
      setInvoiceBookingId(null)
    } else {
      const d = (await res.json()) as { error?: string }
      setInvoiceError(d.error ?? 'Lähetys epäonnistui')
    }
  }

  const filtered = filterLocation === 'all'
    ? bookings
    : bookings.filter((b) => b.location === filterLocation)

  // Count active (non-cancelled) bookings
  const activeCount = bookings.filter((b) => b.status !== 'cancelled').length

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>

  const inputCls =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectCls =
    'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-sm text-green-300'

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

      {/* Location filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterLocation('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filterLocation === 'all'
              ? 'bg-green-700 text-white'
              : 'bg-white/5 text-green-400 hover:bg-white/10'
          }`}
        >
          Kaikki ({activeCount})
        </button>
        {LOCATIONS.map((loc) => {
          const count = bookings.filter(
            (b) => b.location === loc.value && b.status !== 'cancelled'
          ).length
          return (
            <button
              key={loc.value}
              onClick={() => setFilterLocation(loc.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterLocation === loc.value
                  ? 'bg-green-700 text-white'
                  : 'bg-white/5 text-green-400 hover:bg-white/10'
              }`}
            >
              {loc.label}
              {count > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-green-600">Ei varauksia.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const badge = statusBadge[b.status] ?? statusBadge.pending
            const isCancelled = b.status === 'cancelled'

            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 transition-colors ${
                  isCancelled
                    ? 'border-red-900/40 bg-red-900/5 opacity-60'
                    : b.status === 'pending'
                      ? 'border-orange-800/40 bg-orange-900/5'
                      : 'border-green-800 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-medium ${isCancelled ? 'text-red-400 line-through' : 'text-white'}`}>
                        {formatDate(b.starts_on)} – {formatDate(b.ends_on)}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-green-400">
                        {locationLabel[b.location] ?? b.location}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-green-300">
                      {b.booker_name ?? b.profile_name ?? '—'}
                    </p>
                    {b.note && (
                      <p className="mt-0.5 text-xs text-green-500">{b.note}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => openInvoiceModal(b)}
                        title="Lähetä lasku"
                        className="rounded-md p-1.5 text-amber-500 hover:bg-amber-900/30 hover:text-amber-300 transition-colors"
                      >
                        <Receipt size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(b)}
                      title="Muokkaa"
                      className="rounded-md p-1.5 text-green-600 hover:bg-green-900/40 hover:text-green-300 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    {!isCancelled && (
                      <button
                        onClick={() => void deleteBooking(b.id)}
                        disabled={busy === b.id}
                        title="Peruuta varaus"
                        className="rounded-md p-1.5 text-stone-600 hover:bg-red-900/40 hover:text-red-400 disabled:opacity-40 transition-colors"
                      >
                        {busy === b.id ? <span className="text-xs">...</span> : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit slide-in panel */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setEditing(null)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Muokkaa varausta</h2>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-green-400 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Varaaja</label>
                <input
                  type="text"
                  value={editBookerName}
                  onChange={(e) => setEditBookerName(e.target.value)}
                  placeholder="Varaajan nimi"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Alkupäivä *</label>
                  <input
                    type="date"
                    value={editStartsOn}
                    onChange={(e) => setEditStartsOn(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Loppupäivä *</label>
                  <input
                    type="date"
                    value={editEndsOn}
                    onChange={(e) => setEditEndsOn(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Sijainti</label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className={selectCls}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Tila</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={selectCls}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Lisätiedot</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  placeholder="Lisätietoja (valinnainen)"
                  className={inputCls}
                />
              </div>

              {editError && (
                <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{editError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => void saveEdit()}
                  disabled={editBusy}
                  className="flex-1 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {editBusy ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-green-800 px-4 py-2.5 text-sm text-green-300 hover:bg-white/5"
                >
                  Peruuta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {invoiceBookingId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setInvoiceBookingId(null)} />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-green-700 bg-green-950 p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Lähetä lasku varaajalle</h2>
              <button onClick={() => setInvoiceBookingId(null)} className="text-green-500 hover:text-green-300"><X size={16} /></button>
            </div>
            <div><label className={labelCls}>Varaajan sähköposti *</label><input type="email" value={invoiceEmail} onChange={(e) => setInvoiceEmail(e.target.value)} className={inputCls} placeholder="varaaja@esimerkki.fi" /></div>
            <div><label className={labelCls}>Laskun kuvaus</label><input type="text" value={invoiceDesc} onChange={(e) => setInvoiceDesc(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Summa (€) *</label><input type="text" inputMode="decimal" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} className={inputCls} placeholder="esim. 80" /></div>
            <div><label className={labelCls}>Eräpäivä</label><input type="date" value={invoiceDue} onChange={(e) => setInvoiceDue(e.target.value)} className={inputCls} /></div>
            {invoiceError && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{invoiceError}</p>}
            <div className="flex gap-2">
              <button onClick={() => void sendInvoice()} disabled={invoiceBusy} className="flex-1 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50">
                {invoiceBusy ? 'Lähetetään...' : 'Lähetä lasku'}
              </button>
              <button onClick={() => setInvoiceBookingId(null)} className="rounded-lg border border-green-800 px-4 py-2.5 text-sm text-green-300 hover:bg-white/5">
                Peruuta
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
