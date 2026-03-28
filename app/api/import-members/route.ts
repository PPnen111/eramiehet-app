import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { invitationHtml, invitationSubject, type InvitationEmailData } from '@/lib/emails/invitation'

const FROM = 'JahtiPro <noreply@jahtipro.fi>'
const VALID_ROLES = ['admin', 'board_member', 'member'] as const
type ValidRole = (typeof VALID_ROLES)[number]

type ImportMember = {
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
    .select('role, active_club_id, full_name')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as {
    role: string | null
    active_club_id: string | null
    full_name: string | null
  } | null

  if (!isBoardOrAbove(caller?.role)) {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }
  if (!caller?.active_club_id) {
    return NextResponse.json({ error: 'Ei aktiivista seuraa' }, { status: 400 })
  }

  const clubId = caller.active_club_id
  const callerName = caller.full_name ?? 'Ylläpitäjä'

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('members' in body) ||
    !Array.isArray((body as Record<string, unknown>).members)
  ) {
    return NextResponse.json({ error: 'members-kenttä puuttuu' }, { status: 400 })
  }

  const members = (body as { members: ImportMember[] }).members
  if (members.length === 0) {
    return NextResponse.json({ error: 'Ei jäseniä tuotavaksi' }, { status: 400 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  // Fetch club name for emails
  const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
  const clubName = (clubRaw as { name: string } | null)?.name ?? 'Metsästysseura'

  const apiKey = process.env.RESEND_API_KEY
  const resend = apiKey ? new Resend(apiKey) : null

  const results: ImportResult[] = []

  for (const m of members) {
    const email = m.sahkoposti.trim() || null
    const role: ValidRole = VALID_ROLES.includes(m.rooli as ValidRole)
      ? (m.rooli as ValidRole)
      : 'member'
    const joinDate = m.liittynyt || today

    // Check if already a member of this club (by email)
    if (email) {
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('club_id', clubId)
        .maybeSingle()

      if (existing) {
        results.push({ nimi: m.nimi, status: 'skipped', note: 'jo jäsen' })
        continue
      }
    }

    // Insert profile row
    const profileId = crypto.randomUUID()
    const { error: profileError } = await admin.from('profiles').insert({
      id: profileId,
      club_id: clubId,
      active_club_id: clubId,
      full_name: m.nimi,
      email,
      phone: m.puhelin || null,
      role,
      member_status: 'active',
      join_date: joinDate,
    })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      results.push({ nimi: m.nimi, status: 'error', note: profileError.message })
      continue
    }

    // For members with email: create invitation + send email
    if (email) {
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      await admin.from('invitations').insert({
        club_id: clubId,
        email,
        token,
        invited_by: user.id,
        status: 'pending',
        expires_at: expiresAt,
      })

      if (resend) {
        const emailData: InvitationEmailData = {
          inviterName: callerName,
          clubName,
          token,
        }
        await resend.emails.send({
          from: FROM,
          to: email,
          subject: invitationSubject(emailData),
          html: invitationHtml(emailData),
        })
      }

      results.push({ nimi: m.nimi, status: 'success', note: email })
    } else {
      results.push({ nimi: m.nimi, status: 'success', note: 'ei sähköpostia' })
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length
  const skipCount = results.filter((r) => r.status === 'skipped').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const errorDetails = results.filter((r) => r.status === 'error')

  // Log import to member_imports
  const { data: logRow } = await admin
    .from('member_imports')
    .insert({
      club_id: clubId,
      imported_by: user.id,
      total_rows: members.length,
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
