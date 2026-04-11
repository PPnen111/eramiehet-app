import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('club_id, active_club_id').eq('id', user.id).single()
  const clubId = (profile as { club_id: string; active_club_id: string | null } | null)?.active_club_id ?? (profile as { club_id: string } | null)?.club_id
  if (!clubId) return NextResponse.json({ error: 'No club' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('onboarding').update({ completed_at: new Date().toISOString() }).eq('club_id', clubId)

  return NextResponse.json({ success: true })
}
