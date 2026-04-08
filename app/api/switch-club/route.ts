import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })
  }

  const body = await request.json() as { club_id?: string }
  const { club_id } = body

  if (!club_id) {
    return NextResponse.json({ error: 'club_id puuttuu' }, { status: 400 })
  }

  // Check caller role
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const callerRole = (profileRaw as { role: string } | null)?.role

  if (callerRole === 'superadmin') {
    // Superadmin can switch to any club — just verify it exists
    const admin = createAdminClient()
    const { data: clubExists } = await admin
      .from('clubs')
      .select('id')
      .eq('id', club_id)
      .maybeSingle()

    if (!clubExists) {
      return NextResponse.json({ error: 'Seuraa ei löydy' }, { status: 404 })
    }
  } else {
    // Regular user: verify membership via club_members
    const admin = createAdminClient()
    const { data: membership } = await admin
      .from('club_members')
      .select('club_id')
      .eq('profile_id', user.id)
      .eq('club_id', club_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership) {
      // Fallback: check profiles.club_id
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', user.id)
        .eq('club_id', club_id)
        .maybeSingle()

      if (!profileCheck) {
        return NextResponse.json({ error: 'Et ole tämän seuran jäsen' }, { status: 403 })
      }
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ active_club_id: club_id })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
