'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface Props {
  bookingId: string
}

export default function ConfirmBookingButton({ bookingId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}/confirm`, { method: 'PATCH' })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
  }

  if (done) return null

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="flex items-center gap-1 rounded-lg border border-green-700 px-2.5 py-1 text-xs font-semibold text-green-300 hover:bg-green-900/40 disabled:opacity-50 transition-colors"
    >
      <CheckCircle size={12} />
      {loading ? 'Vahvistetaan...' : 'Vahvista'}
    </button>
  )
}
