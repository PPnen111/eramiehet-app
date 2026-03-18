import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClubSelector from './club-selector'

type MembershipRow = {
  club_id: string
  role: string
  status: string
  clubs: { id: string; name: string } | null
}

export default async function VaihdasSeuraPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('club_members')
    .select('club_id, role, status, clubs(id, name)')
    .eq('profile_id', user.id)

  const memberships = (data ?? []) as unknown as MembershipRow[]

  // No clubs — go to dashboard and let it handle the empty state
  if (memberships.length === 0) redirect('/dashboard')

  // Only one club — auto-select it and go straight to dashboard
  if (memberships.length === 1) {
    await supabase
      .from('profiles')
      .update({ active_club_id: memberships[0].club_id })
      .eq('id', user.id)
    redirect('/dashboard')
  }

  const clubs = memberships.map((m) => ({
    club_id: m.club_id,
    club_name: m.clubs?.name ?? m.club_id,
    role: m.role,
  }))

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-2xl font-bold text-transparent">
            Valitse seura
          </h1>
          <p className="mt-2 text-sm text-green-400">
            Olet jäsen useammassa seurassa. Valitse, minkä seuran tietoihin haluat kirjautua.
          </p>
        </div>

        <ClubSelector clubs={clubs} />
      </div>
    </main>
  )
}
