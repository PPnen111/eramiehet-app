'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props {
  bookingId: string
}

export default function DeleteBookingButton({ bookingId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!confirm('Peruutetaanko varaus?')) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? 'Peruutus epäonnistui.')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        title="Peruuta varaus"
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
      >
        <Trash2 size={12} />
        {loading ? '...' : 'Peruuta'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
