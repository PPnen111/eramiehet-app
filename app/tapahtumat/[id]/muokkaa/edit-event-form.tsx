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

// datetime-local input expects "YYYY-MM-DDTHH:mm"
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props {
  eventId: string
  initialTitle: string
  initialType: string
  initialStartsAt: string
  initialEndsAt: string | null
  initialLocation: string | null
  initialDescription: string | null
}

export default function EditEventForm({
  eventId,
  initialTitle,
  initialType,
  initialStartsAt,
  initialEndsAt,
  initialLocation,
  initialDescription,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [type, setType] = useState(initialType)
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initialStartsAt))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initialEndsAt))
  const [location, setLocation] = useState(initialLocation ?? '')
  const [description, setDescription] = useState(initialDescription ?? '')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase
      .from('events')
      .update({
        title,
        type,
        starts_at: startsAt,
        ends_at: endsAt || null,
        location: location || null,
        description: description || null,
      })
      .eq('id', eventId)

    if (updateError) {
      setError('Tallentaminen epäonnistui: ' + updateError.message)
      setLoading(false)
      return
    }

    router.push(`/tapahtumat/${eventId}`)
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

      {/* Sijainti */}
      <div>
        <label className="mb-1 block text-sm text-[#1e3d1e]">Sijainti</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="esim. Seurantalo, Koiramäki"
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]"
        />
      </div>

      {/* Kuvaus */}
      <div>
        <label className="mb-1 block text-sm text-[#1e3d1e]">Kuvaus</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-[#1e3d1e] py-2.5 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50"
        >
          {loading ? 'Tallennetaan...' : 'Tallenna muutokset'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/tapahtumat/${eventId}`)}
          className="rounded-lg border border-[#e0d8cc] px-4 py-2.5 text-sm text-[#1e3d1e] hover:border-green-600"
        >
          Peruuta
        </button>
      </div>
    </form>
  )
}
