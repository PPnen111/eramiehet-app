'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface Props {
  saalisId: string
}

export default function DeleteSaalisButton({ saalisId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!confirm('Poistetaanko saalisilmoitus?')) return
    setLoading(true)
    setError('')
    const { error: deleteError } = await supabase.from('saalis').delete().eq('id', saalisId)
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
