import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function VaihdaSeeuraPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.club_id) redirect('/login')

  // Set active_club_id so middleware stops redirecting here
  await supabase
    .from('profiles')
    .update({ active_club_id: profile.club_id })
    .eq('id', user.id)

  redirect('/dashboard')
}
