import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { club_id: string; role: string } | null
  if (!profile || !isBoardOrAbove(profile.role)) {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const {
    name, business_id, street_address, postal_address, email, phone, mobile,
  } = body as Record<string, unknown>

  const update: Record<string, string | null> = {}
  if (typeof name === 'string') update.name = name.trim() || null
  if (typeof business_id === 'string') update.business_id = business_id.trim() || null
  if (typeof street_address === 'string') update.street_address = street_address.trim() || null
  if (typeof postal_address === 'string') update.postal_address = postal_address.trim() || null
  if (typeof email === 'string') update.email = email.trim() || null
  if (typeof phone === 'string') update.phone = phone.trim() || null
  if (typeof mobile === 'string') update.mobile = mobile.trim() || null

  const admin = createAdminClient()
  const { error } = await admin
    .from('clubs')
    .update(update)
    .eq('id', profile.club_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
