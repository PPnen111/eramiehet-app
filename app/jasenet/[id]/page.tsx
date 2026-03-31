import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import MemberDetail from './member-detail'
import type { MemberDetail as MemberDetailType } from '@/app/api/members/[id]/route'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as {
    club_id: string
    active_club_id: string | null
    role: string
  } | null

  if (!caller || !isBoardOrAbove(caller.role)) redirect('/dashboard')

  const clubId = caller.active_club_id ?? caller.club_id
  const admin = createAdminClient()

  const { data: profileRaw } = await admin
    .from('profiles')
    .select(`
      id, full_name, email, phone, role, member_status, join_date,
      member_number, birth_date, member_type, street_address, postal_code,
      city, home_municipality, billing_method, additional_info
    `)
    .eq('id', id)
    .eq('club_id', clubId)
    .single()

  if (!profileRaw) notFound()

  const profile = profileRaw as Omit<MemberDetailType, 'has_logged_in' | 'payments'>

  const { data: authUser } = await admin.auth.admin.getUserById(id)
  const has_logged_in = !!authUser?.user?.last_sign_in_at

  const { data: paymentsRaw } = await admin
    .from('payments')
    .select('id, description, amount_cents, status, due_date, paid_at')
    .eq('profile_id', id)
    .eq('club_id', clubId)
    .order('due_date', { ascending: false })

  const member: MemberDetailType = {
    ...profile,
    has_logged_in,
    payments: (paymentsRaw ?? []) as MemberDetailType['payments'],
  }

  return (
    <MemberDetail
      member={member}
      currentUserId={user.id}
      callerRole={caller.role}
    />
  )
}
