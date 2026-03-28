'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface Props {
  bookingId: string
}

export default function DeleteBookingButton({ bookingId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!confirm('Poistetaanko varaus?')) return
    setLoading(true)
    setError('')
    const { error: deleteError } = await supabase.from('bookings').delete().eq('id', bookingId)
    setLoading(false)
    if (deleteError) {
      setError('Poisto epäonnistui.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
      >
        {loading ? '...' : 'Poista'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
