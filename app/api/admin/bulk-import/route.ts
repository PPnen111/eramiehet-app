// TODO: DELETE THIS ENDPOINT AFTER ONE-TIME USE
// Used for bulk importing 182 members for club d1cb1cdf-80a1-45d0-8c18-c5e5fa4eb5e4

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CLUB_ID = 'd1cb1cdf-80a1-45d0-8c18-c5e5fa4eb5e4'

type MemberInput = {
  full_name: string
  email?: string | null
  phone?: string | null
  member_number?: string | null
  birth_date?: string | null
  member_type?: string | null
  street_address?: string | null
  postal_code?: string | null
  city?: string | null
  home_municipality?: string | null
  billing_method?: string | null
  additional_info?: string | null
}

type ImportResult = {
  name: string
  status: 'success' | 'skipped' | 'error'
  note: string
}

/** Convert Finnish date dd.mm.yyyy → yyyy-mm-dd, or return null */
function parseFinnishDate(s: string): string | null {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function parseDate(s: string | null | undefined): string | null {
  if (!s) return null
  const finnish = parseFinnishDate(s)
  if (finnish) return finnish
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

export async function POST(req: NextRequest) {
  // Auth: only superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((callerProfile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Ei oikeuksia — vain superadmin' }, { status: 403 })
  }

  // Parse body
  let members: MemberInput[]
  try {
    const body = await req.json() as unknown
    if (!Array.isArray(body)) throw new Error('Body must be an array')
    members = body as MemberInput[]
  } catch (e) {
    return NextResponse.json(
      { error: `Virheellinen pyyntö: ${e instanceof Error ? e.message : 'JSON parse error'}` },
      { status: 400 }
    )
  }

  if (members.length === 0) {
    return NextResponse.json({ error: 'Tyhjä jäsenlista' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const results: ImportResult[] = []

  for (const member of members) {
    const full_name = (member.full_name ?? '').trim()
    if (!full_name) {
      results.push({ name: '(tyhjä nimi)', status: 'skipped', note: 'nimi puuttuu' })
      continue
    }

    const email = member.email?.trim() || null

    if (!email) {
      console.log(`SKIP (no email): ${full_name}`)
      results.push({ name: full_name, status: 'skipped', note: 'ei sähköpostia' })
      continue
    }

    // Skip if already a member of this club
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('club_id', CLUB_ID)
      .maybeSingle()

    if (existing) {
      results.push({ name: full_name, status: 'skipped', note: 'jo jäsen' })
      continue
    }

    // 1. Create auth user
    const { data: newAuthUser, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { full_name },
    })

    let userId: string

    if (authError || !newAuthUser?.user) {
      const isConflict =
        authError?.message?.includes('already been registered') ||
        authError?.code === 'email_exists'

      if (isConflict) {
        // User exists in auth but not in this club — look up via profiles
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (!existingProfile) {
          results.push({ name: full_name, status: 'error', note: authError?.message ?? 'Auth conflict, profiilit puuttuu' })
          continue
        }
        userId = existingProfile.id
      } else {
        results.push({ name: full_name, status: 'error', note: authError?.message ?? 'Auth-virhe' })
        continue
      }
    } else {
      userId = newAuthUser.user.id
    }

    // 2. Upsert profile with all fields
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      club_id: CLUB_ID,
      active_club_id: CLUB_ID,
      full_name,
      email,
      phone: member.phone ?? null,
      role: 'member',
      member_status: 'active',
      join_date: today,
      member_number: member.member_number ?? null,
      birth_date: parseDate(member.birth_date),
      member_type: member.member_type ?? null,
      street_address: member.street_address ?? null,
      postal_code: member.postal_code ?? null,
      city: member.city ?? null,
      home_municipality: member.home_municipality ?? null,
      billing_method: member.billing_method ?? null,
      additional_info: member.additional_info ?? null,
    })

    if (profileError) {
      results.push({ name: full_name, status: 'error', note: `Profile: ${profileError.message}` })
      continue
    }

    // 3. Insert club_members row (non-fatal if it fails — e.g. already exists)
    await admin.from('club_members').upsert(
      { club_id: CLUB_ID, profile_id: userId, role: 'member', status: 'active' },
      { onConflict: 'club_id,profile_id', ignoreDuplicates: true }
    )

    results.push({ name: full_name, status: 'success', note: email })
  }

  const successCount = results.filter((r) => r.status === 'success').length
  const skippedCount = results.filter((r) => r.status === 'skipped').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const errors = results.filter((r) => r.status === 'error').map((r) => `${r.name}: ${r.note}`)

  console.log(`Bulk import done — success: ${successCount}, skipped: ${skippedCount}, errors: ${errorCount}`)

  return NextResponse.json({ success: successCount, skipped: skippedCount, errors: errorCount, error_details: errors })
}
