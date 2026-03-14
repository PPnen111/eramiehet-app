'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type ExistingBooking = {
  id: string
  starts_on: string
  ends_on: string
}

interface Props {
  clubId: string
  profileId: string
  isAdmin: boolean
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

export default function BookingForm({
  clubId,
  profileId,
  existingBookings,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookerName, setBookerName] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (endsOn < startsOn) {
      setError('Loppupäivä ei voi olla ennen alkupäivää.')
      return
    }

    const conflict = existingBookings.find((b) =>
      datesOverlap(startsOn, endsOn, b.starts_on, b.ends_on)
    )
    if (conflict) {
      setError(
        `Päällekkäinen varaus: ${formatDate(conflict.starts_on)} – ${formatDate(conflict.ends_on)}`
      )
      return
    }

    setLoading(true)
    const { error: insertError } = await supabase.from('bookings').insert({
      club_id: clubId,
      profile_id: profileId,
      booker_name: bookerName || null,
      starts_on: startsOn,
      ends_on: endsOn,
      note: note || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setBookerName('')
    setStartsOn('')
    setEndsOn('')
    setNote('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelClass = 'mb-1 block text-sm text-green-300'

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white"
      >
        + Tee varaus
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
      <h2 className="mb-4 font-semibold text-white">Uusi varaus</h2>
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
            className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Tallennetaan...' : 'Tallenna varaus'}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError('') }}
            className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-300"
          >
            Peruuta
          </button>
        </div>
      </form>
    </div>
  )
}
