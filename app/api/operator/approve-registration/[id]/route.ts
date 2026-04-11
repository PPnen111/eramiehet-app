import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((callerProfile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Fetch request
  const { data: reqRaw } = await admin.from('registration_requests').select('*').eq('id', id).single()
  if (!reqRaw) return NextResponse.json({ error: 'Pyyntöä ei löydy' }, { status: 404 })
  const request = reqRaw as { id: string; club_name: string; contact_name: string; contact_email: string; status: string; has_cabin: boolean }

  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Pyyntö on jo käsitelty' }, { status: 400 })
  }

  // a. Create auth user
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: request.contact_email,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: { full_name: request.contact_name },
  })

  if (authErr || !authUser?.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Auth user creation failed' }, { status: 500 })
  }

  const userId = authUser.user.id

  // b. Create club
  const { data: clubRaw, error: clubErr } = await admin.from('clubs').insert({ name: request.club_name }).select('id').single()
  if (clubErr || !clubRaw) return NextResponse.json({ error: clubErr?.message ?? 'Club creation failed' }, { status: 500 })
  const clubId = (clubRaw as { id: string }).id

  // c. Create profile
  await admin.from('profiles').insert({
    id: userId,
    club_id: clubId,
    active_club_id: clubId,
    full_name: request.contact_name,
    email: request.contact_email,
    role: 'admin',
    member_status: 'active',
    join_date: new Date().toISOString().slice(0, 10),
  })

  // d. Create club_members
  await admin.from('club_members').insert({
    profile_id: userId,
    club_id: clubId,
    role: 'admin',
    status: 'active',
  })

  // e. Create subscription (14-day trial)
  const trialEnds = new Date(Date.now() + 14 * 86400000).toISOString()
  await admin.from('subscriptions').insert({
    club_id: clubId,
    status: 'trial',
    plan: 'start',
    trial_starts_at: new Date().toISOString(),
    trial_ends_at: trialEnds,
  })

  // f. Create onboarding
  await admin.from('onboarding').insert({
    club_id: clubId,
    step: 1,
    has_cabin: request.has_cabin,
  })

  // g. Update registration_request
  await admin.from('registration_requests').update({
    status: 'approved',
    club_id: clubId,
    approved_at: new Date().toISOString(),
    approved_by: user.id,
  }).eq('id', id)

  // h. Send welcome email
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'JahtiPro <info@jahtipro.fi>',
      to: request.contact_email,
      subject: 'JahtiPro — tilisi on aktivoitu! 🎉',
      html: `<h2 style="color:#166534">Tervetuloa JahtiProhon!</h2>
<p>Hei ${request.contact_name},</p>
<p>Seuranne <strong>${request.club_name}</strong> tili on nyt aktivoitu.</p>
<p>Kirjaudu sisään osoitteessa:<br/><a href="https://jahtipro.fi/login" style="color:#166534;font-weight:bold;">https://jahtipro.fi/login</a></p>
<p>Sähköposti: <strong>${request.contact_email}</strong></p>
<p>Koska olet uusi käyttäjä, sinulla ei ole vielä salasanaa. Aseta salasanasi näin:</p>
<ol>
<li>Mene jahtipro.fi/login</li>
<li>Klikkaa "Unohdin salasanan"</li>
<li>Syötä sähköpostiosoitteesi</li>
<li>Saat salasanan asetuslinkin sähköpostiisi</li>
</ol>
<p>Ensimmäinen kirjautuminen ohjaa sinut käyttöönotto-oppaaseen joka auttaa saamaan seurasi valmiiksi muutamassa minuutissa.</p>
<p><strong>14 päivän ilmainen kokeilu on alkanut! 🎉</strong></p>
<p style="margin-top:24px;">Terveisin,<br/>Pekka Paunonen<br/>JahtiPro<br/>info@jahtipro.fi</p>`.trim(),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, club_id: clubId })
}
