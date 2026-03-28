'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

const EVENT_TYPES = [
  { value: 'talkoot', label: 'Talkoot' },
  { value: 'ampumaharjoitus', label: 'Ampumaharjoitus' },
  { value: 'kokous', label: 'Kokous' },
  { value: 'metsastyspaiva', label: 'Metsästyspäivä' },
  { value: 'muu', label: 'Muu' },
]

interface Props {
  clubId: string
  userId?: string
}

export default function CreateEventForm({ clubId, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('muu')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('events').insert({
      club_id: clubId,
      title,
      type,
      starts_at: startsAt,
      ends_at: endsAt || null,
      description: description || null,
    })

    if (insertError) {
      console.error('Event insert error:', insertError)
      setError('Tapahtuman luominen epäonnistui: ' + insertError.message)
      setLoading(false)
      return
    }

    router.push('/tapahtumat')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-green-800 bg-white/5 p-5"
    >
      {/* Otsikko */}
      <div>
        <label className="mb-1 block text-sm text-green-300">Otsikko *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Tapahtuman nimi"
          className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
        />
      </div>

      {/* Tyyppi */}
      <div>
        <label className="mb-1 block text-sm text-green-300">Tyyppi</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Alkaa */}
      <div>
        <label className="mb-1 block text-sm text-green-300">Alkaa *</label>
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
          className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500 [color-scheme:dark]"
        />
      </div>

      {/* Päättyy */}
      <div>
        <label className="mb-1 block text-sm text-green-300">Päättyy</label>
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500 [color-scheme:dark]"
        />
      </div>

      {/* Kuvaus */}
      <div>
        <label className="mb-1 block text-sm text-green-300">Kuvaus</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Lisätietoja tapahtumasta..."
          className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Tallennetaan...' : 'Luo tapahtuma'}
        </button>
        <button
          type="button"
          onClick={() => void (window.location.href = '/tapahtumat')}
          className="rounded-lg border border-green-800 px-4 py-2.5 text-sm text-green-300 hover:border-green-600"
        >
          Peruuta
        </button>
      </div>
    </form>
  )
}
