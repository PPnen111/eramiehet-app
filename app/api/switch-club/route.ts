import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Verify the user is actually a member of the requested club
  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('profile_id', user.id)
    .eq('club_id', club_id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Et ole tämän seuran jäsen' }, { status: 403 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ active_club_id: club_id })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
