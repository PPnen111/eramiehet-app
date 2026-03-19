import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import SuperadminTabs from './superadmin-tabs'
import type { EnhancedClub, UserRow } from './analytics-tab'

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

function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(iso) >= cutoff
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

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const clubById = new Map(clubs.map((c) => [c.id, c]))

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

  const totalClubs = clubs.length
  const totalUsers = authUsers.length
  const newThisWeek = authUsers.filter((u) => isWithinDays(u.created_at, 7)).length
  const activeToday = authUsers.filter((u) => isToday(u.last_sign_in_at ?? null)).length

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

        <SuperadminTabs
          stats={{ totalClubs, totalUsers, newThisWeek, activeToday }}
          userRows={userRows}
          enhancedClubs={enhancedClubs}
        />
      </div>
    </main>
  )
}
