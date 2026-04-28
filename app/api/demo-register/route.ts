import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const DEMO_CLUB_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let pw = ''
  for (let i = 0; i < 12; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = (await req.json()) as { email?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Syötä kelvollinen sähköpostiosoite' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check if email already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1 })
  // listUsers doesn't filter by email — use a different approach
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json(
      { error: 'Tällä sähköpostilla on jo tunnus. Kirjaudu osoitteessa jahtipro.fi/login' },
      { status: 409 },
    )
  }

  const password = generatePassword()

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { full_name: email.split('@')[0] },
    })

    if (authError || !authData?.user) {
      if (authError?.message?.includes('already been registered') || authError?.code === 'email_exists') {
        return NextResponse.json(
          { error: 'Tällä sähköpostilla on jo tunnus. Kirjaudu osoitteessa jahtipro.fi/login' },
          { status: 409 },
        )
      }
      throw new Error(authError?.message ?? 'Auth user creation failed')
    }

    const userId = authData.user.id
    const trialEndsAt = new Date(Date.now() + 14 * 86400000)

    // 2. Create profile
    await admin.from('profiles').upsert({
      id: userId,
      full_name: email.split('@')[0],
      email,
      club_id: DEMO_CLUB_ID,
      active_club_id: DEMO_CLUB_ID,
      role: 'member',
      member_status: 'active',
      join_date: new Date().toISOString().slice(0, 10),
    })

    // 3. Add to club_members
    await admin.from('club_members').insert({
      club_id: DEMO_CLUB_ID,
      profile_id: userId,
      role: 'member',
      status: 'active',
    })

    // 4. Create subscription
    await admin.from('subscriptions').insert({
      club_id: DEMO_CLUB_ID,
      status: 'trial',
      plan: 'demo',
      trial_starts_at: new Date().toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
    })

    // 5. Send welcome email
    const expiryDate = trialEndsAt.toLocaleDateString('fi-FI')
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from: 'JahtiPro <info@jahtipro.fi>',
        to: email,
        subject: 'Tervetuloa kokeilemaan JahtiProta!',
        html: `<h2 style="color:#166534">Hei!</h2>
<p>Demo-tunnuksesi JahtiProhon on luotu.</p>
<h3 style="color:#166534">Kirjautumistiedot:</h3>
<table style="margin:8px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Sähköposti:</td><td><strong>${email}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Salasana:</td><td><strong>${password}</strong></td></tr>
</table>
<a href="https://jahtipro.fi/login" style="background-color:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;font-weight:bold;">Kirjaudu JahtiProhon →</a>
<p>Demo-tunnus on voimassa 14 päivää (${expiryDate}).</p>
<p>Demo Erämiehet -seurassa on valmiina esimerkkidataa jonka avulla voit tutustua kaikkiin ominaisuuksiin.</p>
<p style="margin-top:24px;">Jos sinulla on kysyttävää, ota yhteyttä: <a href="mailto:info@jahtipro.fi">info@jahtipro.fi</a></p>
<p style="margin-top:16px;">Terveisin,<br/>Pekka Paunonen / JahtiPro</p>`,
      }).catch((e) => {
        console.error('[DEMO] Email send failed:', e)
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[DEMO] Error:', message)
    return NextResponse.json(
      { error: 'Demo-tunnuksen luonti epäonnistui. Yritä uudelleen tai ota yhteyttä info@jahtipro.fi' },
      { status: 500 },
    )
  }
}
