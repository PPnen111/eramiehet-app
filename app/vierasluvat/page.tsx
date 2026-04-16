import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import VierasluvatClient, { type MemberOption, type PermitView } from './vierasluvat-client'

type ProfileRow = { id: string; full_name: string | null; email: string | null }
type RegistryRow = { id: string; full_name: string | null; email: string | null }
type PermitRow = {
  id: string
  club_id: string
  guest_name: string
  guest_email: string | null
  host_profile_id: string | null
  host_registry_id: string | null
  area: string | null
  valid_from: string | null
  valid_until: string | null
  price_cents: number | null
  status: 'active' | 'expired' | 'cancelled'
  payment_id: string | null
  notes: string | null
  created_at: string
}
type PaymentRow = { id: string; status: string; paid_at: string | null }

export default async function VierasluvatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!profile) redirect('/login')

  const clubId = profile.active_club_id ?? profile.club_id
  const canManage = isBoardOrAbove(profile.role)

  const admin = createAdminClient()

  const { data: permitsRaw } = await admin
    .from('guest_permits')
    .select('*')
    .eq('club_id', clubId)
    .order('valid_until', { ascending: false })
    .order('created_at', { ascending: false })

  const permits = (permitsRaw ?? []) as PermitRow[]

  const profileIds = [...new Set(permits.map((p) => p.host_profile_id).filter((x): x is string => !!x))]
  const registryIds = [...new Set(permits.map((p) => p.host_registry_id).filter((x): x is string => !!x))]
  const paymentIds = [...new Set(permits.map((p) => p.payment_id).filter((x): x is string => !!x))]

  const [{ data: pfData }, { data: rgData }, { data: payData }] = await Promise.all([
    profileIds.length > 0
      ? admin.from('profiles').select('id, full_name, email').in('id', profileIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    registryIds.length > 0
      ? admin.from('member_registry').select('id, full_name, email').in('id', registryIds)
      : Promise.resolve({ data: [] as RegistryRow[] }),
    paymentIds.length > 0
      ? admin.from('payments').select('id, status, paid_at').in('id', paymentIds)
      : Promise.resolve({ data: [] as PaymentRow[] }),
  ])

  const pfMap = new Map((pfData ?? []).map((p) => [p.id, p as ProfileRow]))
  const rgMap = new Map((rgData ?? []).map((r) => [r.id, r as RegistryRow]))
  const payMap = new Map((payData ?? []).map((p) => [p.id, p as PaymentRow]))

  // Hosts list for the modal — active club members (profiles + registry entries without profile)
  const [{ data: clubProfiles }, { data: clubRegistry }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email')
      .eq('club_id', clubId)
      .eq('member_status', 'active')
      .order('full_name', { ascending: true }),
    admin
      .from('member_registry')
      .select('id, full_name, email, profile_id')
      .eq('club_id', clubId)
      .order('full_name', { ascending: true }),
  ])

  const hostOptions: MemberOption[] = []
  for (const p of (clubProfiles ?? []) as ProfileRow[]) {
    if (p.full_name) hostOptions.push({ id: p.id, type: 'profile', full_name: p.full_name, email: p.email })
  }
  const registryWithoutProfile = ((clubRegistry ?? []) as (RegistryRow & { profile_id: string | null })[]).filter((r) => !r.profile_id)
  for (const r of registryWithoutProfile) {
    if (r.full_name) hostOptions.push({ id: r.id, type: 'registry', full_name: r.full_name, email: r.email })
  }
  hostOptions.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', 'fi'))

  const today = new Date().toISOString().slice(0, 10)

  const permitViews: PermitView[] = permits.map((p) => {
    let host_name: string | null = null
    if (p.host_profile_id) host_name = pfMap.get(p.host_profile_id)?.full_name ?? null
    else if (p.host_registry_id) host_name = rgMap.get(p.host_registry_id)?.full_name ?? null

    let payment_status: 'paid' | 'pending' | 'none' = 'none'
    if (p.payment_id) {
      const pay = payMap.get(p.payment_id)
      payment_status = pay?.status === 'paid' ? 'paid' : 'pending'
    }

    const isActive = p.status === 'active' && (!p.valid_until || p.valid_until >= today)

    return {
      id: p.id,
      guest_name: p.guest_name,
      guest_email: p.guest_email,
      host_name,
      area: p.area,
      valid_from: p.valid_from,
      valid_until: p.valid_until,
      price_cents: p.price_cents,
      status: p.status,
      payment_id: p.payment_id,
      payment_status,
      notes: p.notes,
      is_active: isActive,
    }
  })

  const active = permitViews.filter((p) => p.is_active)
  const past = permitViews.filter((p) => !p.is_active)

  return <VierasluvatClient active={active} past={past} hostOptions={hostOptions} canManage={canManage} />
}
