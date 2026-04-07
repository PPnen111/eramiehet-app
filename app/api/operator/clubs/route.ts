import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifySuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as { role: string } | null)?.role !== 'superadmin') return null
  return user
}

export async function GET() {
  if (!(await verifySuperadmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const [{ data: clubs }, { data: subs }, { data: activity }, { data: signups }] = await Promise.all([
    admin.from('clubs').select('id, name, created_at').order('name'),
    admin.from('subscriptions').select('club_id, status, plan, trial_ends_at'),
    admin.from('activity_log').select('club_id, created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from('launch_signups').select('id'),
  ])

  const clubList = (clubs ?? []) as { id: string; name: string; created_at: string }[]
  const subMap = new Map(
    ((subs ?? []) as { club_id: string; status: string; plan: string | null; trial_ends_at: string | null }[]).map(
      (s) => [s.club_id, s]
    )
  )

  // Count members per club
  const { data: memberCounts } = await admin
    .from('profiles')
    .select('club_id')
    .eq('member_status', 'active')

  const memberMap = new Map<string, number>()
  for (const m of (memberCounts ?? []) as { club_id: string }[]) {
    memberMap.set(m.club_id, (memberMap.get(m.club_id) ?? 0) + 1)
  }

  // Activity per club (30d)
  const activityMap = new Map<string, { count: number; last: string }>()
  for (const a of (activity ?? []) as { club_id: string; created_at: string }[]) {
    const curr = activityMap.get(a.club_id)
    if (!curr) {
      activityMap.set(a.club_id, { count: 1, last: a.created_at })
    } else {
      curr.count++
      if (a.created_at > curr.last) curr.last = a.created_at
    }
  }

  // Operator notes
  const { data: notes } = await admin
    .from('operator_notes')
    .select('club_id, note, created_at')
    .order('created_at', { ascending: false })

  const noteMap = new Map<string, { note: string; created_at: string }[]>()
  for (const n of (notes ?? []) as { club_id: string; note: string; created_at: string }[]) {
    const arr = noteMap.get(n.club_id) ?? []
    arr.push({ note: n.note, created_at: n.created_at })
    noteMap.set(n.club_id, arr)
  }

  const result = clubList.map((c) => {
    const sub = subMap.get(c.id)
    const act = activityMap.get(c.id)
    return {
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      member_count: memberMap.get(c.id) ?? 0,
      subscription_status: sub?.status ?? null,
      plan: sub?.plan ?? null,
      trial_ends_at: sub?.trial_ends_at ?? null,
      activity_30d: act?.count ?? 0,
      last_active: act?.last ?? null,
      notes: noteMap.get(c.id) ?? [],
    }
  })

  const totalMembers = Array.from(memberMap.values()).reduce((a, b) => a + b, 0)
  const trialCount = Array.from(subMap.values()).filter((s) => s.status === 'trial').length
  const signupCount = (signups ?? []).length

  return NextResponse.json({
    clubs: result,
    kpi: {
      active_clubs: clubList.length,
      total_members: totalMembers,
      trial_count: trialCount,
      signup_count: signupCount,
    },
  })
}
