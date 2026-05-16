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
  superadmin: 'Superadmin',
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
            className="group flex items-center gap-4 rounded-2xl border border-[#e0d8cc] bg-white p-5 text-left backdrop-blur-sm transition-all duration-150 hover:bg-[#f0ebe3] hover:border-[#e0d8cc] hover:shadow-lg hover:shadow-green-950/50 disabled:opacity-60"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1e3d1e]/40 text-[#1e3d1e]">
              <Users size={22} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1a1a1a] truncate">{club.club_name}</p>
              <p className="mt-0.5 text-sm text-[#2d6a2d]">
                {roleLabel[club.role] ?? club.role}
              </p>
            </div>
            <ChevronRight
              size={18}
              className={`shrink-0 text-[#888888] transition-colors group-hover:text-[#2d6a2d] ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        )
      })}
    </div>
  )
}
