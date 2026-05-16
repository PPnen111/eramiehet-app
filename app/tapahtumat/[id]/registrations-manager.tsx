'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Registration = {
  id: string
  profile_id: string
  created_at: string
  profiles: { full_name: string | null } | null
}

interface Props {
  eventId: string
  registrations: Registration[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function RegistrationsManager({ eventId, registrations }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const removeRegistration = async (regId: string) => {
    if (!confirm('Poistetaanko ilmoittautuminen?')) return
    setDeleting(regId)
    setError('')
    const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      router.refresh()
    } else {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? 'Poisto epäonnistui')
    }
  }

  if (registrations.length === 0) {
    return <p className="text-sm text-[#888888]">Ei ilmoittautumisia.</p>
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]">{error}</p>
      )}
      {registrations.map((reg) => {
        const name =
          (reg.profiles as unknown as { full_name: string | null } | null)?.full_name ?? '—'
        return (
          <div
            key={reg.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#e0d8cc] bg-white/[0.03] px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">{name}</p>
              <p className="text-xs text-[#888888]">{formatDate(reg.created_at)}</p>
            </div>
            <button
              onClick={() => void removeRegistration(reg.id)}
              disabled={deleting === reg.id}
              title="Poista ilmoittautuminen"
              className="rounded-md p-1.5 text-[#888888] hover:bg-[#fee2e2] hover:text-[#991b1b] disabled:opacity-40 transition-colors"
            >
              {deleting === reg.id ? <span className="text-xs">...</span> : <Trash2 size={14} />}
            </button>
          </div>
        )
      })}
    </div>
  )
}
