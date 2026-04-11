import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OperatorDashboard from './operator-dashboard'

export default async function OperaattoriPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    redirect('/dashboard')
  }

  return <OperatorDashboard />
}
