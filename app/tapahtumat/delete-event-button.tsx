'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface Props {
  eventId: string
}

export default function DeleteEventButton({ eventId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Poistetaanko tapahtuma?')) return
    setLoading(true)
    await supabase.from('events').delete().eq('id', eventId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
    >
      {loading ? '...' : 'Poista'}
    </button>
  )
}
