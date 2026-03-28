import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string | null; club_id: string | null } | null
  if (!profile?.club_id) redirect('/dashboard')

  const { data: clubRaw } = await supabase
    .from('clubs')
    .select('name')
    .eq('id', profile.club_id)
    .single()

  const clubName = (clubRaw as { name: string | null } | null)?.name ?? null

  return <OnboardingWizard clubName={clubName} />
}
