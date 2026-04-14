import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { parseCSV } from '@/lib/utils/csv-parser'
import { parseXlsxToMemberRows } from '@/lib/utils/xlsx-parser'

type ImportResult = {
  nimi: string
  status: 'success' | 'skipped' | 'error'
  note: string
}

/** Convert Finnish date dd.mm.yyyy → yyyy-mm-dd, or return null */
function parseFinnishDate(s: string): string | null {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

/** Parse any recognisable date string → yyyy-mm-dd, or null */
function parseDate(s: string): string | null {
  if (!s) return null
  const finnish = parseFinnishDate(s)
  if (finnish) return finnish
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
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

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Tiedosto puuttuu' }, { status: 400 })
  }

  const fileName = file.name.toLowerCase()
  let parsedRows: ReturnType<typeof parseCSV>

  let debugHeaders: string[] = []
  let debugHeaderRow = 0

  if (fileName.endsWith('.xlsx')) {
    const buffer = await file.arrayBuffer()
    const result = parseXlsxToMemberRows(buffer, true)
    parsedRows = result.rows
    debugHeaders = result.headers
    debugHeaderRow = result.headerRowIndex
  } else if (fileName.endsWith('.csv')) {
    const text = await file.text()
    parsedRows = parseCSV(text)
  } else {
    return NextResponse.json({ error: 'Tuetut tiedostomuodot: .csv, .xlsx' }, { status: 400 })
  }

  // Only skip rows where name is completely missing
  const rows = parsedRows.filter((r) => r.nimi.trim())
  const nameSkipped = parsedRows.length - rows.length
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Ei jäseniä tuotavaksi — nimi puuttuu kaikilta riveiltä' }, { status: 400 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const results: ImportResult[] = []

  for (const r of rows) {
    const full_name = r.nimi.trim()
    const email = r.sahkoposti.trim() || null
    const memberNumber = r.jasennumero?.trim() || null

    // Duplicate check — priority: email → member_number → name (case-insensitive)
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

    if (!duplicate && memberNumber) {
      const { data } = await admin
        .from('member_registry')
        .select('id')
        .eq('club_id', clubId)
        .eq('member_number', memberNumber)
        .maybeSingle()
      if (data) { duplicate = true; duplicateReason = 'jäsennumero' }
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
      member_number: r.jasennumero || null,
      birth_date: parseDate(r.syntymaaika),
      member_type: r.jasenlaji || null,
      street_address: r.katuosoite || null,
      postal_code: r.postinumero || null,
      city: r.postitoimipaikka || null,
      home_municipality: r.kotikunta || null,
      billing_method: r.laskutustapa || null,
      additional_info: r.lisatiedot || null,
    }).select('id').single()

    if (regError || !regRow) {
      console.error('Member registry insert error:', regError)
      results.push({ nimi: full_name, status: 'error', note: regError?.message ?? 'unknown' })
      continue
    }
    const registryId = (regRow as { id: string }).id

    // If email provided, also create auth user + profile (so they can log in)
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
            role: 'member',
            member_status: 'active',
            join_date: parseDate(r.liittynyt) ?? today,
            member_number: r.jasennumero || null,
            birth_date: parseDate(r.syntymaaika),
            member_type: r.jasenlaji || null,
            street_address: r.katuosoite || null,
            postal_code: r.postinumero || null,
            city: r.postitoimipaikka || null,
            home_municipality: r.kotikunta || null,
            billing_method: r.laskutustapa || null,
            additional_info: r.lisatiedot || null,
          })
        }
      }

      // Back-link registry to profile to prevent duplicates in member list
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

  // Build import_rows with { name, status, reason? } for each processed row
  const importRows = results.map((r) => {
    // Parse reason from note (e.g. "jo rekisterissä (nimi)" → "nimi")
    const m = r.note.match(/jo rekisterissä \((.+)\)/)
    return {
      name: r.nimi,
      status: r.status,
      ...(r.status === 'skipped' && m ? { reason: m[1] } : {}),
      ...(r.status === 'error' ? { reason: r.note } : {}),
    }
  })

  // Log import
  const { data: logRow } = await admin
    .from('member_imports')
    .insert({
      club_id: clubId,
      imported_by: user.id,
      total_rows: parsedRows.length,
      success_count: successCount,
      skip_count: skipCount + nameSkipped,
      error_count: errorCount,
      errors: errorDetails.length > 0 ? errorDetails : null,
      import_rows: importRows,
    })
    .select('id')
    .single()

  const importId = (logRow as { id: string } | null)?.id ?? null

  return NextResponse.json({
    success: successCount,
    skipped: skipCount,
    name_skipped: nameSkipped,
    errors: errorCount,
    import_id: importId,
    error_details: errorDetails.map((e) => `${e.nimi}: ${e.note}`),
    debug: { header_row: debugHeaderRow, headers: debugHeaders },
  })
}
