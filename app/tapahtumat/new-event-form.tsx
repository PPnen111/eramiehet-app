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
}

export default function NewEventForm({ clubId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('muu')
  const [startsAt, setStartsAt] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('events').insert({
      club_id: clubId,
      title,
      description: description || null,
      type,
      starts_at: startsAt,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setTitle('')
    setDescription('')
    setType('muu')
    setStartsAt('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#1e3d1e] px-4 py-2.5 text-sm font-semibold text-white"
      >
        + Uusi tapahtuma
      </button>
    )
  }

  return (
    <div className="animate-slide-down rounded-2xl border border-[#e0d8cc] bg-white p-5">
      <h2 className="mb-4 font-semibold text-[#1a1a1a]">Uusi tapahtuma</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="mb-1 block text-sm text-[#1e3d1e]">Päivämäärä ja kellonaika *</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#1e3d1e]">Kuvaus</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-[#1e3d1e] py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Tallennetaan...' : 'Tallenna'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-[#e0d8cc] px-4 py-2 text-sm text-[#1e3d1e]"
          >
            Peruuta
          </button>
        </div>
      </form>
    </div>
  )
}
