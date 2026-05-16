'use client'

import { useState } from 'react'
import { Home, Target, Waves, CircleDot, Warehouse, BedDouble, MapPin, CheckCircle } from 'lucide-react'

type Location = {
  id: string; name: string; location_type: string; description: string | null
  pricing_text: string | null; instructions_text: string | null
  max_capacity: number | null; booking_unit: string; min_booking_hours: number | null
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  erakartano: Home, takkatupa: Home, sauna: Waves,
  ampumarata: Target, nylkyvaja: Warehouse, majoitustilat: BedDouble, muu: MapPin,
}
const TYPE_LABELS: Record<string, string> = {
  erakartano: 'Eräkartano', takkatupa: 'Takkatupa', sauna: 'Sauna',
  ampumarata: 'Ampumarata', nylkyvaja: 'Nylkyvaja', majoitustilat: 'Majoitustilat', muu: 'Muu',
}

interface Props {
  locations: Location[]
  clubId: string
  userId: string
  userName: string | null
}

export default function RentalLocationBooking({ locations, clubId, userId, userName }: Props) {
  const [selected, setSelected] = useState<Location | null>(null)
  const [bookerName, setBookerName] = useState(userName ?? '')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]'

  const submit = async () => {
    setError('')
    if (!selected || !bookerName.trim() || !startsOn || !endsOn) {
      setError('Täytä pakolliset kentät.')
      return
    }
    setBusy(true)
    const res = await fetch('/api/bookings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: selected.location_type,
        starts_on: startsOn,
        ends_on: endsOn,
        booker_name: bookerName,
        note: note || null,
        rental_location_id: selected.id,
      }),
    })
    setBusy(false)
    if (res.ok) {
      setDone(true)
    } else {
      const d = (await res.json()) as { error?: string }
      setError(d.error ?? 'Varauksen lähetys epäonnistui.')
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#e0d8cc] bg-white py-10 text-center">
        <CheckCircle size={48} className="text-[#2d6a2d]" />
        <h2 className="text-lg font-bold text-[#1a1a1a]">Varauspyyntösi on lähetetty!</h2>
        <p className="text-sm text-[#1e3d1e]">Hyväksyjä vahvistaa varauksen pian.</p>
        <button onClick={() => { setDone(false); setSelected(null); setStartsOn(''); setEndsOn(''); setNote('') }} className="rounded-lg bg-[#1e3d1e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d16]">
          Tee uusi varaus
        </button>
      </div>
    )
  }

  // Location selector
  if (!selected) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">Valitse varattava kohde</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {locations.map((loc) => {
            const Icon = TYPE_ICONS[loc.location_type] ?? MapPin
            return (
              <button
                key={loc.id}
                onClick={() => setSelected(loc)}
                className="rounded-2xl border border-[#e0d8cc] bg-white p-5 text-left hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="text-[#2d6a2d]" />
                  <h3 className="font-semibold text-[#1a1a1a]">{loc.name}</h3>
                </div>
                <span className="text-xs text-[#888888]">{TYPE_LABELS[loc.location_type] ?? loc.location_type}</span>
                {loc.description && <p className="mt-1 text-sm text-[#1e3d1e] line-clamp-2">{loc.description}</p>}
                {loc.pricing_text && <p className="mt-1 text-xs italic text-[#4a4a4a]">{loc.pricing_text}</p>}
                {loc.max_capacity && <p className="mt-1 text-xs text-[#888888]">Max {loc.max_capacity} henkilöä</p>}
                <p className="mt-2 text-xs font-semibold text-[#2d6a2d]">Valitse →</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Booking form for selected location
  return (
    <div className="space-y-4">
      <button onClick={() => setSelected(null)} className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">← Vaihda kohde</button>

      <div className="rounded-2xl border border-[#e0d8cc] bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {(() => { const Icon = TYPE_ICONS[selected.location_type] ?? MapPin; return <Icon size={20} className="text-[#2d6a2d]" /> })()}
          <h2 className="text-lg font-bold text-[#1a1a1a]">{selected.name}</h2>
        </div>

        {selected.pricing_text && (
          <div className="rounded-lg border border-[#e0d8cc] bg-white/[0.03] px-3 py-2">
            <p className="text-xs text-[#4a4a4a] mb-1">Hinnasto</p>
            <p className="text-sm text-[#1e3d1e] whitespace-pre-wrap">{selected.pricing_text}</p>
          </div>
        )}

        {selected.instructions_text && (
          <div className="rounded-lg border border-[#e0d8cc] bg-white/[0.03] px-3 py-2">
            <p className="text-xs text-[#4a4a4a] mb-1">Ohjeet</p>
            <p className="text-sm text-[#1e3d1e] whitespace-pre-wrap">{selected.instructions_text}</p>
          </div>
        )}

        <div><label className="mb-1 block text-sm text-[#1e3d1e]">Varaajan nimi *</label><input type="text" value={bookerName} onChange={(e) => setBookerName(e.target.value)} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1 block text-sm text-[#1e3d1e]">Alkupäivä *</label><input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={inputCls} /></div>
          <div><label className="mb-1 block text-sm text-[#1e3d1e]">Loppupäivä *</label><input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={inputCls} /></div>
        </div>

        {selected.booking_unit === 'hour' && selected.min_booking_hours && (
          <p className="text-xs text-[#4a4a4a]">Minimikesto: {selected.min_booking_hours} tuntia</p>
        )}

        <div><label className="mb-1 block text-sm text-[#1e3d1e]">Lisätiedot / erityistoiveet</label><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} placeholder="Valinnainen..." /></div>

        {error && <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]">{error}</p>}

        <button onClick={() => void submit()} disabled={busy} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
          {busy ? 'Lähetetään...' : 'Lähetä varauspyyntö'}
        </button>
      </div>
    </div>
  )
}
