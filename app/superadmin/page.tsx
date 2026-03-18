import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Building2, UserCheck, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ProfileData = {
  id: string
  club_id: string | null
  full_name: string | null
  role: string | null
}

type ClubData = {
  id: string
  name: string | null
  created_at: string
}

type UserRow = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  role: string | null
  club_name: string | null
}

type EnhancedClub = {
  id: string
  name: string | null
  created_at: string
  memberCount: number
  adminName: string | null
  adminEmail: string | null
  latestActivity: string | null
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

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Ei koskaan'
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

export default async function SuperadminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profileRaw || (profileRaw as { role: string }).role !== 'superadmin') {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  // Fetch all data in parallel
  const [
    { data: authData },
    { data: profilesRaw },
    { data: clubsRaw },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profiles').select('id, club_id, full_name, role'),
    admin.from('clubs').select('id, name, created_at').order('created_at', { ascending: false }),
  ])

  const authUsers = authData?.users ?? []
  const profiles = (profilesRaw ?? []) as unknown as ProfileData[]
  const clubs = (clubsRaw ?? []) as unknown as ClubData[]

  // Build lookup maps
  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const clubById = new Map(clubs.map((c) => [c.id, c]))

  // Join users with profiles + clubs
  const userRows: UserRow[] = authUsers.map((u) => {
    const profile = profileById.get(u.id)
    const club = profile?.club_id ? clubById.get(profile.club_id) : undefined
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      full_name: profile?.full_name ?? null,
      role: profile?.role ?? null,
      club_name: club?.name ?? null,
    }
  })

  // Stats
  const totalClubs = clubs.length
  const totalUsers = authUsers.length
  const newThisWeek = authUsers.filter((u) => isWithinDays(u.created_at, 7)).length
  const activeToday = authUsers.filter((u) => isToday(u.last_sign_in_at ?? null)).length

  // Build enhanced clubs with admin + latest activity
  const enhancedClubs: EnhancedClub[] = clubs.map((club) => {
    const clubProfiles = profiles.filter((p) => p.club_id === club.id)
    const memberCount = clubProfiles.length

    const adminProfile = clubProfiles.find((p) => p.role === 'admin')
    const adminAuthUser = adminProfile ? authUsers.find((u) => u.id === adminProfile.id) : undefined

    const clubAuthUsers = authUsers.filter((u) => {
      const p = profileById.get(u.id)
      return p?.club_id === club.id
    })
    const latestActivity = clubAuthUsers.reduce<string | null>((latest, u) => {
      if (!u.last_sign_in_at) return latest
      if (!latest) return u.last_sign_in_at
      return u.last_sign_in_at > latest ? u.last_sign_in_at : latest
    }, null)

    return {
      id: club.id,
      name: club.name,
      created_at: club.created_at,
      memberCount,
      adminName: adminProfile?.full_name ?? null,
      adminEmail: adminAuthUser?.email ?? null,
      latestActivity,
    }
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-500">
            Superadmin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Hallintapaneeli</h1>
        </div>

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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      Nimi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      Sähköposti
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      Seura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      Rooli
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      Rekisteröityi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      Viimeksi kirjautunut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                      Status
                    </th>
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
                        {formatDateTime(u.created_at)}
                      </td>
                      <td className="px-4 py-3 text-green-400">
                        {formatDateTime(u.last_sign_in_at)}
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
    </main>
  )
}
