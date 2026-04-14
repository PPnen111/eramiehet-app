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

    // Duplicate check — priority: email → name (case-insensitive)
    let duplicate = false
    let duplicateReason = ''

    if (email) {
      const { data } = await admin
        .from('member_registry')
        .select('id')
        .eq('club_id', clubId)
        .eq('email', email)
        .maybeSingle()
      if (data) { duplicate = true; duplicateReason = 'sähköposti' }
    }

    if (!duplicate && full_name) {
      const { data } = await admin
        .from('member_registry')
        .select('id, full_name')
        .eq('club_id', clubId)
        .ilike('full_name', full_name)
      if (data && data.length > 0) {
        const normalized = full_name.toLowerCase()
        const match = (data as { id: string; full_name: string | null }[]).find(
          (m) => (m.full_name ?? '').trim().toLowerCase() === normalized
        )
        if (match) { duplicate = true; duplicateReason = 'nimi' }
      }
    }

    if (duplicate) {
      results.push({ nimi: full_name, status: 'skipped', note: `jo rekisterissä (${duplicateReason})` })
      continue
    }

    // Insert into member_registry — email NOT required
    const { data: regRow, error: regError } = await admin.from('member_registry').insert({
      club_id: clubId,
      full_name,
      email,
      phone: r.puhelin || null,
    }).select('id').single()

    if (regError || !regRow) {
      results.push({ nimi: full_name, status: 'error', note: regError?.message ?? 'unknown' })
      continue
    }
    const registryId = (regRow as { id: string }).id

    // If email provided, also create auth user + profile
    if (email) {
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('club_id', clubId)
        .maybeSingle()

      let profileId: string | null = (existingProfile as { id: string } | null)?.id ?? null

      if (!profileId) {
        const { data: newAuthUser } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: crypto.randomUUID(),
          user_metadata: { full_name },
        })

        if (newAuthUser?.user) {
          profileId = newAuthUser.user.id
          await admin.from('profiles').upsert({
            id: profileId,
            club_id: clubId,
            active_club_id: clubId,
            full_name,
            email,
            phone: r.puhelin || null,
            role: r.rooli || 'member',
            member_status: 'active',
            join_date: r.liittynyt || today,
          })
        }
      }

      if (profileId) {
        await admin.from('member_registry').update({ profile_id: profileId }).eq('id', registryId)
      }
    }

    results.push({ nimi: full_name, status: 'success', note: email ?? 'ei sähköpostia' })
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
