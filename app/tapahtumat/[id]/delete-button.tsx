'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface Props {
  eventId: string
}

export default function DeleteEventDetailButton({ eventId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Haluatko varmasti poistaa tämän tapahtuman?')) return
    setLoading(true)
    await supabase.from('events').delete().eq('id', eventId)
    router.push('/tapahtumat')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-xl border border-red-800 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-900/30 disabled:opacity-50"
    >
      {loading ? 'Poistetaan...' : 'Poista tapahtuma'}
    </button>
  )
}
