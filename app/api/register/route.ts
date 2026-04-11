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

  if (!clubName || !contactName || !contactEmail) {
    return NextResponse.json({ error: 'Pakolliset kentät puuttuvat' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('registration_requests').insert({
    club_name: clubName,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: (body.contact_phone as string)?.trim() || null,
    estimated_members: body.estimated_members ? Number(body.estimated_members) : null,
    has_cabin: body.has_cabin === true,
    promo_code: (body.promo_code as string)?.trim() || null,
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send emails
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    const resend = new Resend(apiKey)

    // Confirmation to registrant
    await resend.emails.send({
      from: 'JahtiPro <info@jahtipro.fi>',
      to: contactEmail,
      subject: 'Tervetuloa JahtiProhon — vahvistus vastaanotettu',
      html: `<h2 style="color:#166534">JahtiPro</h2>
<p>Hei ${contactName},</p>
<p>Kiitos kiinnostuksestasi JahtiProta kohtaan!</p>
<p>Olemme vastaanottaneet rekisteröitymispyyntönne seuralle <strong>${clubName}</strong>. Aktivoimme tilanne parin minuutin sisällä.</p>
<p>Kun saat aktivointiviestin, pääset kirjautumaan täältä:</p>
<a href="https://jahtipro.fi/login" style="background-color:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;font-weight:bold;">Kirjaudu JahtiProhon →</a>
<p style="font-size:12px;color:#6b7280;">Tai kopioi osoite selaimeen: https://jahtipro.fi/login</p>
<p>Kirjautumissivulla voit asettaa salasanasi:</p>
<ol>
<li>Klikkaa "Unohdin salasanan"</li>
<li>Syötä tämä sähköpostiosoite</li>
<li>Saat salasanan asetuslinkin sähköpostiisi</li>
</ol>
<p style="margin-top:24px;">Terveisin,<br/>Pekka Paunonen<br/>JahtiPro<br/>info@jahtipro.fi</p>`.trim(),
    }).catch(() => {})

    // Notification to admin
    await resend.emails.send({
      from: 'JahtiPro <info@jahtipro.fi>',
      to: 'info@jahtipro.fi',
      subject: `🔔 Uusi rekisteröityminen: ${clubName}`,
      html: `<h2 style="color:#166534">Uusi rekisteröityminen</h2>
<table style="margin:16px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Seura:</td><td><strong>${clubName}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Yhteyshenkilö:</td><td>${contactName}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Sähköposti:</td><td>${contactEmail}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Puhelin:</td><td>${body.contact_phone ?? '—'}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Jäseniä (arvio):</td><td>${body.estimated_members ?? '—'}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Eräkartano:</td><td>${body.has_cabin ? 'Kyllä' : 'Ei'}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Kampanjakoodi:</td><td>${body.promo_code ?? '—'}</td></tr>
</table>
<p><a href="https://jahtipro.fi/operaattori">Avaa operaattori →</a></p>`.trim(),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
