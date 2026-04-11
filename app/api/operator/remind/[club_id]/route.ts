import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ club_id: string }> }
) {
  const { club_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  const admin = createAdminClient()

  // Get club name
  const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', club_id).single()
  const clubName = (clubRaw as { name: string } | null)?.name ?? 'Seura'

  // Get trial info
  const { data: subRaw } = await admin.from('subscriptions').select('trial_ends_at').eq('club_id', club_id).single()
  const trialEndsAt = (subRaw as { trial_ends_at: string | null } | null)?.trial_ends_at
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null

  // Get admin email
  const { data: adminProfiles } = await admin
    .from('profiles')
    .select('email')
    .eq('club_id', club_id)
    .in('role', ['admin', 'board_member'])
    .not('email', 'is', null)
    .limit(3)

  const emails = ((adminProfiles ?? []) as { email: string | null }[])
    .map((p) => p.email)
    .filter((e): e is string => Boolean(e))

  if (emails.length === 0) {
    return NextResponse.json({ error: 'Seuralla ei ole admin-sähköpostia' }, { status: 422 })
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'JahtiPro <noreply@jahtipro.fi>',
    to: emails,
    subject: `JahtiPro — muistutus trial-jaksostanne`,
    html: `
      <h2 style="color:#166534">JahtiPro</h2>
      <p>Hei,</p>
      <p>JahtiPro-trialanne on <strong>${daysLeft ?? '?'} päivää</strong> jäljellä.</p>
      <p>Haluatteko jatkaa palvelun käyttöä? Olemme mielellämme yhteydessä ja kerromme lisää.</p>
      <p>Ota yhteyttä: <a href="mailto:info@jahtipro.fi">info@jahtipro.fi</a></p>
      <p style="margin-top:24px;">Terveisin,<br/>Pekka Paunonen<br/>JahtiPro</p>
    `.trim(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, club_name: clubName })
}
