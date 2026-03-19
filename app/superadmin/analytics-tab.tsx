import { Building2, Users, TrendingUp, UserCheck } from 'lucide-react'

export type UserRow = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  role: string | null
  club_name: string | null
}

export type EnhancedClub = {
  id: string
  name: string | null
  created_at: string
  memberCount: number
  adminName: string | null
  adminEmail: string | null
  latestActivity: string | null
}

export type Stats = {
  totalClubs: number
  totalUsers: number
  newThisWeek: number
  activeToday: number
}

interface Props {
  stats: Stats
  userRows: UserRow[]
  enhancedClubs: EnhancedClub[]
}

const roleLabelFi: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
  superadmin: 'Superadmin',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(iso) >= cutoff
}

function ActivityBadge({ lastSignIn }: { lastSignIn: string | null }) {
  if (isToday(lastSignIn)) {
    return (
      <span className="inline-block rounded-full bg-green-700 px-2 py-0.5 text-xs font-medium text-green-100">
        Aktiivinen tänään
      </span>
    )
  }
  if (isWithinDays(lastSignIn, 7)) {
    return (
      <span className="inline-block rounded-full bg-green-900 px-2 py-0.5 text-xs font-medium text-green-300">
        Aktiivinen
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-400">
      Ei aktiivinen
    </span>
  )
}

export default function AnalyticsTab({ stats, userRows, enhancedClubs }: Props) {
  const { totalClubs, totalUsers, newThisWeek, activeToday } = stats

  return (
    <div className="space-y-6">
      {/* Stats — 4 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
            <Building2 size={12} />
            Seuroja yhteensä
          </div>
          <p className="text-3xl font-bold text-white">{totalClubs}</p>
        </div>
        <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
            <Users size={12} />
            Käyttäjiä yhteensä
          </div>
          <p className="text-3xl font-bold text-white">{totalUsers}</p>
        </div>
        <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
            <TrendingUp size={12} />
            Uusia tällä viikolla
          </div>
          <p className="text-3xl font-bold text-white">{newThisWeek}</p>
        </div>
        <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
            <UserCheck size={12} />
            Aktiivisia tänään
          </div>
          <p className="text-3xl font-bold text-white">{activeToday}</p>
        </div>
      </div>

      {/* Clubs list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
          Seurat
        </h2>
        {enhancedClubs.length === 0 ? (
          <p className="text-sm text-green-600">Ei seuroja.</p>
        ) : (
          <div className="space-y-2">
            {enhancedClubs.map((club) => (
              <div
                key={club.id}
                className="rounded-xl border border-green-800 bg-white/5 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{club.name ?? '—'}</p>
                    {club.adminName && (
                      <p className="mt-0.5 truncate text-xs text-green-400">
                        Admin: {club.adminName}
                        {club.adminEmail && (
                          <span className="text-green-600"> · {club.adminEmail}</span>
                        )}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-green-600">
                      <span>Perustettu {formatDate(club.created_at)}</span>
                      <span>Viimeisin aktiviteetti {formatDate(club.latestActivity)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-white">{club.memberCount}</p>
                    <p className="text-xs text-green-600">jäsentä</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* User analytics table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
          Käyttäjäanalytiikka
        </h2>
        {userRows.length === 0 ? (
          <p className="text-sm text-green-600">Ei käyttäjiä.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-green-800">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-green-800 bg-white/5">
                  {['Nimi', 'Sähköposti', 'Seura', 'Rooli', 'Rekisteröityi', 'Viimeksi kirjautunut', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-900">
                {userRows.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-white">
                      {u.full_name ?? <span className="text-green-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-green-300">{u.email ?? '—'}</td>
                    <td className="px-4 py-3 text-green-300">
                      {u.club_name ?? <span className="text-green-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-green-300">
                      {u.role ? (roleLabelFi[u.role] ?? u.role) : <span className="text-green-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-green-400">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-green-400">
                      {formatDate(u.last_sign_in_at)}
                    </td>
                    <td className="px-4 py-3">
                      <ActivityBadge lastSignIn={u.last_sign_in_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
