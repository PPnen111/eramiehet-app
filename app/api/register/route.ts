import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const clubName = (body.club_name as string)?.trim()
  const contactName = (body.contact_name as string)?.trim()
  const contactEmail = (body.contact_email as string)?.trim()
  const contactPhone = (body.contact_phone as string)?.trim() || null
  const estimatedMembers = body.estimated_members ? Number(body.estimated_members) : null
  const hasCabin = body.has_cabin === true
  const promoCode = (body.promo_code as string)?.trim() || null

  if (!clubName || !contactName || !contactEmail) {
    return NextResponse.json({ error: 'Pakolliset kentät puuttuvat' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: contactEmail,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { full_name: contactName },
    })
    if (authError || !authData?.user) {
      console.error('[REGISTER] Auth user creation failed:', authError?.message)
      if (authError?.message?.includes('already been registered') || authError?.code === 'email_exists') {
        return NextResponse.json({ error: 'Tällä sähköpostilla on jo tili. Kirjaudu sisään osoitteessa jahtipro.fi/login' }, { status: 409 })
      }
      throw new Error(authError?.message ?? 'Auth user creation failed')
    }
    const userId = authData.user.id
    console.log('[REGISTER] Auth user created:', userId)

    // 2. Create club
    const { data: clubRaw, error: clubError } = await admin
      .from('clubs')
      .insert({ name: clubName })
      .select('id')
      .single()
    if (clubError || !clubRaw) {
      console.error('[REGISTER] Club creation failed:', clubError?.message)
      throw new Error(clubError?.message ?? 'Club creation failed')
    }
    const clubId = (clubRaw as { id: string }).id
    console.log('[REGISTER] Club created:', clubId)

    // 3. Create profile
    await admin.from('profiles').upsert({
      id: userId,
      full_name: contactName,
      email: contactEmail,
      phone: contactPhone,
      club_id: clubId,
      active_club_id: clubId,
      role: 'admin',
      member_status: 'active',
      join_date: new Date().toISOString().slice(0, 10),
    })

    // 4. Create club_members
    await admin.from('club_members').insert({
      club_id: clubId,
      profile_id: userId,
      role: 'admin',
      status: 'active',
    })

    // 5. Create subscription (14-day trial)
    await admin.from('subscriptions').insert({
      club_id: clubId,
      status: 'trial',
      plan: 'start',
      trial_starts_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    })

    // 6. Create onboarding
    await admin.from('onboarding').insert({
      club_id: clubId,
      step: 1,
      has_cabin: hasCabin,
    })

    // 7. Save registration_request as approved
    await admin.from('registration_requests').insert({
      club_name: clubName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      estimated_members: estimatedMembers,
      has_cabin: hasCabin,
      promo_code: promoCode,
      status: 'approved',
      club_id: clubId,
      approved_at: new Date().toISOString(),
    })

    // 8. Send activation email
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)

      await resend.emails.send({
        from: 'JahtiPro <info@jahtipro.fi>',
        to: contactEmail,
        subject: 'JahtiPro — tilisi on aktivoitu! 🎉',
        html: `<h2 style="color:#166534">Tervetuloa JahtiProhon, ${contactName}!</h2>
<p>Seuranne <strong>${clubName}</strong> tili on nyt aktivoitu.</p>
<p>Aseta salasanasi kirjautumiseen:</p>
<ol>
<li>Mene kirjautumissivulle</li>
<li>Klikkaa "Unohdin salasanan"</li>
<li>Syötä sähköpostiosoitteesi: <strong>${contactEmail}</strong></li>
<li>Saat salasanan asetuslinkin sähköpostiisi</li>
</ol>
<a href="https://jahtipro.fi/login" style="background-color:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;font-weight:bold;">Kirjaudu JahtiProhon →</a>
<p style="font-size:12px;color:#6b7280;">Tai kopioi osoite selaimeen: https://jahtipro.fi/login</p>
<p><strong>14 päivän ilmainen kokeilu on alkanut! 🎉</strong></p>
<p>Ensimmäinen kirjautuminen ohjaa sinut käyttöönotto-oppaaseen.</p>
<p style="margin-top:24px;">Terveisin,<br/>Pekka Paunonen<br/>JahtiPro<br/>info@jahtipro.fi</p>`.trim(),
      }).catch(() => {})

      // 9. Notification to operator
      await resend.emails.send({
        from: 'JahtiPro <info@jahtipro.fi>',
        to: 'info@jahtipro.fi',
        subject: `🔔 Uusi seura rekisteröityi: ${clubName}`,
        html: `<h2 style="color:#166534">Uusi seura rekisteröityi automaattisesti</h2>
<table style="margin:16px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Seura:</td><td><strong>${clubName}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Yhteyshenkilö:</td><td>${contactName}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Sähköposti:</td><td>${contactEmail}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Puhelin:</td><td>${contactPhone ?? '—'}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Jäseniä (arvio):</td><td>${estimatedMembers ?? '—'}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Varattavia tiloja:</td><td>${hasCabin ? 'Kyllä' : 'Ei'}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Kampanjakoodi:</td><td>${promoCode ?? '—'}</td></tr>
</table>
<p><a href="https://jahtipro.fi/operaattori">Katso operaattorissa →</a></p>`.trim(),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[REGISTER] Full error:', message)
    return NextResponse.json(
      { error: 'Rekisteröityminen epäonnistui. Ota yhteyttä info@jahtipro.fi' },
      { status: 500 }
    )
  }
}
