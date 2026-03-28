import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfiiliForm from './profiili-form'

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  member_status: string | null
  join_date: string | null
  club_id: string | null
}

export default async function ProfiiliPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, member_status, join_date, club_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as unknown as ProfileRow | null

  let clubName: string | null = null
  if (profile?.club_id) {
    const { data: clubData } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', profile.club_id)
      .single()
    clubName = (clubData as { name: string } | null)?.name ?? null
  }

  return (
    <ProfiiliForm
      email={user.email ?? ''}
      profile={profile}
      clubName={clubName}
    />
  )
}
