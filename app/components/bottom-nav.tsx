import { createClient } from '@/lib/supabase/server'
import BottomNavClient from './bottom-nav-client'

type MembershipRow = {
  club_id: string
  role: string
}

type ProfileRow = {
  role: string | null
  active_club_id: string | null
}

export default async function BottomNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <BottomNavClient role={null} />

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, active_club_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as unknown as ProfileRow | null

  // Superadmin role lives directly on profiles
  if (profile?.role === 'superadmin') {
    return <BottomNavClient role="superadmin" />
  }

  if (!profile?.active_club_id) {
    return <BottomNavClient role={null} />
  }

  const { data: membershipData } = await supabase
    .from('club_members')
    .select('club_id, role')
    .eq('profile_id', user.id)
    .eq('club_id', profile.active_club_id)
    .single()

  const membership = membershipData as unknown as MembershipRow | null
  const role = membership?.role ?? null

  return <BottomNavClient role={role} />
}
