import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import RegistryMemberDetail from './registry-member-detail'

export default async function RegistryMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()
  const caller = callerRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!caller || !isBoardOrAbove(caller.role)) redirect('/dashboard')

  const clubId = caller.active_club_id ?? caller.club_id
  const admin = createAdminClient()

  const { data: raw } = await admin
    .from('member_registry')
    .select('id, full_name, email, phone, member_number, birth_date, member_type, street_address, postal_code, city, home_municipality, billing_method, additional_info, profile_id')
    .eq('id', id)
    .eq('club_id', clubId)
    .maybeSingle()

  if (!raw) notFound()

  return <RegistryMemberDetail member={raw as RegistryMember} />
}

export type RegistryMember = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  member_number: string | null
  birth_date: string | null
  member_type: string | null
  street_address: string | null
  postal_code: string | null
  city: string | null
  home_municipality: string | null
  billing_method: string | null
  additional_info: string | null
  profile_id: string | null
}
