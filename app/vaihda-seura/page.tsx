import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ClubSelector from './club-selector'

type Club = {
  club_id: string
  club_name: string
  role: string
}

export default async function VaihdaSeuraPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { club_id: string | null; role: string | null } | null

  const clubs: Club[] = []
  const admin = createAdminClient()

  if (profile?.role === 'superadmin') {
    // Superadmin sees ALL clubs
    const { data: allClubs } = await admin
      .from('clubs')
      .select('id, name')
      .order('name')

    for (const c of (allClubs ?? []) as { id: string; name: string }[]) {
      clubs.push({ club_id: c.id, club_name: c.name, role: 'superadmin' })
    }
  } else {
    // Regular user: fetch all clubs via club_members
    const { data: memberships } = await admin
      .from('club_members')
      .select('club_id, role')
      .eq('profile_id', user.id)
      .eq('status', 'active')

    const memberEntries = (memberships ?? []) as { club_id: string; role: string }[]

    if (memberEntries.length > 0) {
      const clubIds = memberEntries.map((m) => m.club_id)
      const { data: clubData } = await admin
        .from('clubs')
        .select('id, name')
        .in('id', clubIds)
        .order('name')

      const clubMap = new Map(
        ((clubData ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
      )

      for (const m of memberEntries) {
        const name = clubMap.get(m.club_id)
        if (name) {
          clubs.push({ club_id: m.club_id, club_name: name, role: m.role })
        }
      }
    }

    // Fallback: if no club_members entries, use profiles.club_id
    if (clubs.length === 0 && profile?.club_id) {
      const { data: clubData } = await admin
        .from('clubs')
        .select('id, name')
        .eq('id', profile.club_id)
        .single()

      const club = clubData as { id: string; name: string } | null
      if (club) {
        clubs.push({
          club_id: club.id,
          club_name: club.name,
          role: profile.role ?? 'member',
        })
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-2xl font-bold text-transparent">
            Seurat
          </h1>
          <p className="mt-2 text-sm text-green-400">
            Valitse seura.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {clubs.length > 0 && <ClubSelector clubs={clubs} />}
          {clubs.length === 0 && (
            <p className="text-sm text-green-600">Et kuulu vielä mihinkään seuraan.</p>
          )}
        </div>
      </div>
    </main>
  )
}
