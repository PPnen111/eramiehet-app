'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

const QUEUE_KEY = 'pending_saalis_queue'

type PendingItem = {
  id: string
  club_id: string
  profile_id: string
  elain: string
  maara: number
  sukupuoli: string
  ika_luokka: string
  pvm: string
  paikka: string | null
  kuvaus: string | null
  reporter_name: string | null
  queued_at: string
}

function readQueue(): PendingItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as PendingItem[]
  } catch {
    return []
  }
}

function writeQueue(q: PendingItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

export default function OfflineSync() {
  const supabase = createClient()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function syncQueue() {
      const queue = readQueue()
      if (queue.length === 0) return

      const remaining: PendingItem[] = []
      let syncedCount = 0

      for (const item of queue) {
        const { id: _id, queued_at: _qa, ...insertData } = item
        const { error } = await supabase.from('saalis').insert(insertData)
        if (error) {
          remaining.push(item)
        } else {
          syncedCount++
        }
      }

      writeQueue(remaining)

      if (syncedCount > 0) {
        setToast(`${syncedCount} saalisilmoitus${syncedCount > 1 ? 'ta' : ''} synkronoitu!`)
        setTimeout(() => setToast(null), 4000)
      }
    }

    window.addEventListener('online', syncQueue)
    if (navigator.onLine) syncQueue()
    return () => window.removeEventListener('online', syncQueue)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!toast) return null

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
      ✓ {toast}
    </div>
  )
}
