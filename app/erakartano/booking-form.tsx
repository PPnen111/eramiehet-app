'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/format'

type ExistingBooking = {
  id: string
  starts_on: string
  ends_on: string
  location: string
}

interface Props {
  selectedLocation: string
  existingBookings: ExistingBooking[]
}

function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && aEnd >= bStart
}

export default function BookingForm({ selectedLocation, existingBookings }: Props) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookerName, setBookerName] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (endsOn < startsOn) {
      setError('Loppupäivä ei voi olla ennen alkupäivää.')
      return
    }

    // Only check overlaps for the same location
    const locationBookings = existingBookings.filter((b) => b.location === selectedLocation)
    const conflict = locationBookings.find((b) =>
      datesOverlap(startsOn, endsOn, b.starts_on, b.ends_on)
    )
    if (conflict) {
      setError(
        `Päällekkäinen varaus tässä kohteessa: ${formatDate(conflict.starts_on)} – ${formatDate(conflict.ends_on)}`
      )
      return
    }

    setLoading(true)
    const res = await fetch('/api/bookings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: selectedLocation,
        starts_on: startsOn,
        ends_on: endsOn,
        booker_name: bookerName || null,
        note: note || null,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? 'Varaus epäonnistui')
      setLoading(false)
      return
    }

    setBookerName('')
    setStartsOn('')
    setEndsOn('')
    setNote('')
    setLoading(false)
    setOpen(false)
    setSuccess('Varauspyyntö lähetetty! Odota vahvistusta.')
    setTimeout(() => setSuccess(''), 6000)
    router.refresh()
  }

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500 [color-scheme:dark]'
  const labelClass = 'mb-1 block text-sm text-green-300'

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
        >
          + Lähetä varauspyyntö
        </button>
        {success && (
          <p className="rounded-lg bg-green-900/40 px-3 py-2 text-sm text-green-300">{success}</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
      <h2 className="mb-4 font-semibold text-white">Uusi varauspyyntö</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Saapumispäivä *</label>
            <input
              type="date"
              value={startsOn}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStartsOn(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Lähtöpäivä *</label>
            <input
              type="date"
              value={endsOn}
              min={startsOn || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setEndsOn(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Varaajan nimi</label>
          <input
            type="text"
            value={bookerName}
            onChange={(e) => setBookerName(e.target.value)}
            placeholder="Jätetään tyhjäksi → profiilisi nimi"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Lisätiedot</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Lähetetään...' : 'Lähetä varauspyyntö'}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError('') }}
            className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-300 hover:bg-white/5"
          >
            Peruuta
          </button>
        </div>
      </form>
    </div>
  )
}
