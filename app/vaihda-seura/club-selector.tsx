'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Users, ChevronRight } from 'lucide-react'

type Club = {
  club_id: string
  club_name: string
  role: string
}

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
}

export default function ClubSelector({ clubs }: { clubs: Club[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSelect(clubId: string) {
    setLoading(clubId)
    try {
      const res = await fetch('/api/switch-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: clubId }),
      })
      if (!res.ok) throw new Error('Vaihto epäonnistui')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {clubs.map((club) => {
        const isLoading = loading === club.club_id
        return (
          <button
            key={club.club_id}
            onClick={() => handleSelect(club.club_id)}
            disabled={loading !== null}
            className="group flex items-center gap-4 rounded-2xl border border-green-800 bg-white/5 p-5 text-left backdrop-blur-sm transition-all duration-150 hover:bg-white/10 hover:border-green-700 hover:shadow-lg hover:shadow-green-950/50 disabled:opacity-60"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-800/40 text-green-300">
              <Users size={22} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{club.club_name}</p>
              <p className="mt-0.5 text-sm text-green-400">
                {roleLabel[club.role] ?? club.role}
              </p>
            </div>
            <ChevronRight
              size={18}
              className={`shrink-0 text-green-600 transition-colors group-hover:text-green-400 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        )
      })}
    </div>
  )
}
