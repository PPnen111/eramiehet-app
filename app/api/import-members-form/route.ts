import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type MemberInput = {
  nimi: string
  sahkoposti: string
  puhelin: string
  rooli: string
  liittynyt: string
}

type ImportResult = {
  nimi: string
  status: 'success' | 'skipped' | 'error'
  note: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('role, active_club_id, club_id, full_name')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as {
    role: string | null
    active_club_id: string | null
    club_id: string | null
    full_name: string | null
  } | null

  if (!isBoardOrAbove(caller?.role)) {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }
  const clubId = caller?.active_club_id ?? caller?.club_id
  if (!clubId) {
    return NextResponse.json({ error: 'Ei aktiivista seuraa' }, { status: 400 })
  }

  let body: { members: MemberInput[] }
  try {
    body = (await req.json()) as { members: MemberInput[] }
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const rows = (body.members ?? []).filter((r) => r.nimi?.trim())
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Ei jäseniä tuotavaksi' }, { status: 400 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const results: ImportResult[] = []

  for (const r of rows) {
    const full_name = r.nimi.trim()
    const email = r.sahkoposti?.trim() || null

    if (!email) {
      results.push({ nimi: full_name, status: 'skipped', note: 'ei sähköpostia' })
      continue
    }

    // Skip if already a member of this club
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('club_id', clubId)
      .maybeSingle()

    if (existing) {
      results.push({ nimi: full_name, status: 'skipped', note: 'jo jäsen' })
      continue
    }

    // Create auth user
    const { data: newAuthUser, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { full_name },
    })

    if (authError || !newAuthUser?.user) {
      if (authError?.message?.includes('already been registered') || authError?.code === 'email_exists') {
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (!existingProfile) {
          results.push({ nimi: full_name, status: 'error', note: authError?.message ?? 'Auth-virhe' })
          continue
        }

        const { error: profileError } = await admin.from('profiles').upsert({
          id: existingProfile.id,
          club_id: clubId,
          active_club_id: clubId,
          full_name,
          email,
          phone: r.puhelin || null,
          role: r.rooli || 'member',
          member_status: 'active',
          join_date: r.liittynyt || today,
        })

        if (profileError) {
          results.push({ nimi: full_name, status: 'error', note: profileError.message })
        } else {
          results.push({ nimi: full_name, status: 'success', note: email })
        }
        continue
      }

      results.push({ nimi: full_name, status: 'error', note: authError?.message ?? 'Auth-virhe' })
      continue
    }

    const userId = newAuthUser.user.id

    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      club_id: clubId,
      active_club_id: clubId,
      full_name,
      email,
      phone: r.puhelin || null,
      role: r.rooli || 'member',
      member_status: 'active',
      join_date: r.liittynyt || today,
    })

    if (profileError) {
      results.push({ nimi: full_name, status: 'error', note: profileError.message })
      continue
    }

    results.push({ nimi: full_name, status: 'success', note: email })
  }

  const successCount = results.filter((r) => r.status === 'success').length
  const skipCount = results.filter((r) => r.status === 'skipped').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const errorDetails = results.filter((r) => r.status === 'error')

  // Log import
  const { data: logRow } = await admin
    .from('member_imports')
    .insert({
      club_id: clubId,
      imported_by: user.id,
      total_rows: rows.length,
      success_count: successCount,
      skip_count: skipCount,
      error_count: errorCount,
      errors: errorDetails.length > 0 ? errorDetails : null,
    })
    .select('id')
    .single()

  const importId = (logRow as { id: string } | null)?.id ?? null

  return NextResponse.json({
    success: successCount,
    skipped: skipCount,
    errors: errorCount,
    import_id: importId,
    error_details: errorDetails.map((e) => `${e.nimi}: ${e.note}`),
  })
}
