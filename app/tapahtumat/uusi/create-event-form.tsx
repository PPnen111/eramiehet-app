'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

const EVENT_TYPES = [
  { value: 'talkoot', label: 'Talkoot' },
  { value: 'ampumaharjoitus', label: 'Ampumaharjoitus' },
  { value: 'kokous', label: 'Kokous' },
  { value: 'metsastyspaiva', label: 'Metsästyspäivä' },
  { value: 'kilpailu', label: '🏆 Kilpailu' },
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
      className="space-y-5 rounded-2xl border border-[#e0d8cc] bg-white p-5"
    >
      {/* Otsikko */}
      <div>
        <label className="mb-1 block text-sm text-[#1e3d1e]">Otsikko *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Tapahtuman nimi"
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]"
        />
      </div>

      {/* Tyyppi */}
      <div>
        <label className="mb-1 block text-sm text-[#1e3d1e]">Tyyppi</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
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
        <label className="mb-1 block text-sm text-[#1e3d1e]">Alkaa *</label>
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d] [color-scheme:dark]"
        />
      </div>

      {/* Päättyy */}
      <div>
        <label className="mb-1 block text-sm text-[#1e3d1e]">Päättyy</label>
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d] [color-scheme:dark]"
        />
      </div>

      {/* Kuvaus */}
      <div>
        <label className="mb-1 block text-sm text-[#1e3d1e]">Kuvaus</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Lisätietoja tapahtumasta..."
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-[#1e3d1e] py-2.5 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50"
        >
          {loading ? 'Tallennetaan...' : 'Luo tapahtuma'}
        </button>
        <button
          type="button"
          onClick={() => void (window.location.href = '/tapahtumat')}
          className="rounded-lg border border-[#e0d8cc] px-4 py-2.5 text-sm text-[#1e3d1e] hover:border-green-600"
        >
          Peruuta
        </button>
      </div>
    </form>
  )
}
