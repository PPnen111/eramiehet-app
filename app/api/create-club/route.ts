import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })
  }

  const body = await request.json() as unknown
  const clubName = (body as { club_name?: string })?.club_name

  if (!clubName || typeof clubName !== 'string' || clubName.trim().length < 3) {
    return NextResponse.json(
      { error: 'Seuran nimi on liian lyhyt (vähintään 3 merkkiä)' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.rpc('create_club_for_user', {
    p_user_id: user.id,
    p_club_name: clubName.trim(),
  })

  if (error) {
    console.error('create_club_for_user RPC error:', error)
    return NextResponse.json({ error: 'Seuran luonti epäonnistui: ' + error.message }, { status: 500 })
  }

  // Insert trial subscription for the new club
  const clubId = (data as { club_id?: string } | null)?.club_id ?? (typeof data === 'string' ? data : null)
  if (clubId) {
    const admin = createAdminClient()
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)
    const { error: subError } = await admin.from('subscriptions').insert({
      club_id: clubId,
      status: 'trial',
      trial_starts_at: new Date().toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
    })
    if (subError) {
      console.error('subscription insert error:', subError)
    }
  }

  return NextResponse.json(data)
}
