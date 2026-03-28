import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen JSON' }, { status: 400 })
  }

  const { email, club_name } = body as { email?: string; club_name?: string }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Virheellinen sähköpostiosoite' }, { status: 400 })
  }

  const admin = createAdminClient()
  const normalizedEmail = email.toLowerCase().trim()

  const { data: existing } = await admin
    .from('launch_signups')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    return NextResponse.json({ success: true, message: 'already_registered' })
  }

  const { error } = await admin
    .from('launch_signups')
    .insert({ email: normalizedEmail, club_name: club_name?.trim() || null })

  if (error) {
    console.error('[launch-signup]', error)
    return NextResponse.json({ error: 'Tallennus epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'registered' })
}
