import { createClient } from '@/lib/supabase/server'
import BottomNavClient from './bottom-nav-client'

export default async function BottomNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <BottomNavClient role={null} />

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (data as { role: string } | null)?.role ?? null

  return <BottomNavClient role={role} />
}
