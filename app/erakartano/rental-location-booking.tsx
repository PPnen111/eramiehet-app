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

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-4 py-3 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'

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
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-700 bg-green-900/10 py-10 text-center">
        <CheckCircle size={48} className="text-green-400" />
        <h2 className="text-lg font-bold text-white">Varauspyyntösi on lähetetty!</h2>
        <p className="text-sm text-green-300">Hyväksyjä vahvistaa varauksen pian.</p>
        <button onClick={() => { setDone(false); setSelected(null); setStartsOn(''); setEndsOn(''); setNote('') }} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600">
          Tee uusi varaus
        </button>
      </div>
    )
  }

  // Location selector
  if (!selected) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">Valitse varattava kohde</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {locations.map((loc) => {
            const Icon = TYPE_ICONS[loc.location_type] ?? MapPin
            return (
              <button
                key={loc.id}
                onClick={() => setSelected(loc)}
                className="rounded-2xl border border-green-800 bg-white/5 p-5 text-left hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="text-green-400" />
                  <h3 className="font-semibold text-white">{loc.name}</h3>
                </div>
                <span className="text-xs text-green-600">{TYPE_LABELS[loc.location_type] ?? loc.location_type}</span>
                {loc.description && <p className="mt-1 text-sm text-green-300 line-clamp-2">{loc.description}</p>}
                {loc.pricing_text && <p className="mt-1 text-xs italic text-green-500">{loc.pricing_text}</p>}
                {loc.max_capacity && <p className="mt-1 text-xs text-green-600">Max {loc.max_capacity} henkilöä</p>}
                <p className="mt-2 text-xs font-semibold text-green-400">Valitse →</p>
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
      <button onClick={() => setSelected(null)} className="text-sm text-green-400 hover:text-green-300">← Vaihda kohde</button>

      <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {(() => { const Icon = TYPE_ICONS[selected.location_type] ?? MapPin; return <Icon size={20} className="text-green-400" /> })()}
          <h2 className="text-lg font-bold text-white">{selected.name}</h2>
        </div>

        {selected.pricing_text && (
          <div className="rounded-lg border border-green-900 bg-white/[0.03] px-3 py-2">
            <p className="text-xs text-green-500 mb-1">Hinnasto</p>
            <p className="text-sm text-green-300 whitespace-pre-wrap">{selected.pricing_text}</p>
          </div>
        )}

        {selected.instructions_text && (
          <div className="rounded-lg border border-green-900 bg-white/[0.03] px-3 py-2">
            <p className="text-xs text-green-500 mb-1">Ohjeet</p>
            <p className="text-sm text-green-300 whitespace-pre-wrap">{selected.instructions_text}</p>
          </div>
        )}

        <div><label className="mb-1 block text-sm text-green-300">Varaajan nimi *</label><input type="text" value={bookerName} onChange={(e) => setBookerName(e.target.value)} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1 block text-sm text-green-300">Alkupäivä *</label><input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={inputCls} /></div>
          <div><label className="mb-1 block text-sm text-green-300">Loppupäivä *</label><input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={inputCls} /></div>
        </div>

        {selected.booking_unit === 'hour' && selected.min_booking_hours && (
          <p className="text-xs text-green-500">Minimikesto: {selected.min_booking_hours} tuntia</p>
        )}

        <div><label className="mb-1 block text-sm text-green-300">Lisätiedot / erityistoiveet</label><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} placeholder="Valinnainen..." /></div>

        {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button onClick={() => void submit()} disabled={busy} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
          {busy ? 'Lähetetään...' : 'Lähetä varauspyyntö'}
        </button>
      </div>
    </div>
  )
}
