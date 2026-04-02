import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { welcomeHtml, welcomeSubject } from '@/lib/emails/welcome'

export type MemberWithStatus = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  member_status: string
  member_type: string | null
  has_logged_in: boolean
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role, active_club_id')
    .eq('id', user.id)
    .single()

  const caller = profileRaw as {
    club_id: string
    role: string
    active_club_id: string | null
  } | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const admin = createAdminClient()

  // Fetch all profiles for the club
  const { data: profilesRaw } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, member_status, member_type')
    .eq('club_id', clubId)
    .order('full_name', { ascending: true })

  const profiles = (profilesRaw ?? []) as {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    role: string
    member_status: string
    member_type: string | null
  }[]

  if (profiles.length === 0) {
    return NextResponse.json({ members: [] })
  }

  // Fetch auth users to get login status
  // listUsers returns all users; we match by ID against our profiles
  const profileIds = new Set(profiles.map((p) => p.id))
  const loginMap = new Map<string, boolean>()

  let page = 1
  const perPage = 1000
  while (true) {
    const { data: authData } = await admin.auth.admin.listUsers({ page, perPage })
    if (!authData?.users?.length) break
    for (const u of authData.users) {
      if (profileIds.has(u.id)) {
        loginMap.set(u.id, !!u.last_sign_in_at)
      }
    }
    if (authData.users.length < perPage) break
    page++
  }

  const members: MemberWithStatus[] = profiles.map((p) => ({
    ...p,
    has_logged_in: loginMap.get(p.id) ?? false,
  }))

  return NextResponse.json({ members })
}

type AddMemberBody = {
  full_name: string
  email: string | null
  phone: string | null
  member_number: string | null
  birth_date: string | null
  member_type: string | null
  street_address: string | null
  postal_code: string | null
  city: string | null
  home_municipality: string | null
  billing_method: string | null
  additional_info: string | null
  send_invite: boolean
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('club_id, role, active_club_id')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as {
    club_id: string
    role: string
    active_club_id: string | null
  } | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  let body: AddMemberBody
  try {
    body = (await req.json()) as AddMemberBody
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const fullName = body.full_name?.trim()
  if (!fullName) {
    return NextResponse.json({ error: 'Nimi on pakollinen' }, { status: 400 })
  }

  const email = body.email?.trim() || null
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  // If email provided, check for existing member in this club
  if (email) {
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('club_id', clubId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Jäsen tällä sähköpostilla on jo seurassa' }, { status: 409 })
    }
  }

  let profileId: string | null = null
  let invited = false

  if (email) {
    // Create auth user (or find existing)
    const { data: newAuthUser, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { full_name: fullName },
    })

    if (authError || !newAuthUser?.user) {
      // User may exist in auth but not in this club
      if (authError?.message?.includes('already been registered') || authError?.code === 'email_exists') {
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (existingProfile) {
          profileId = existingProfile.id
        } else {
          return NextResponse.json({ error: authError?.message ?? 'Auth-virhe' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: authError?.message ?? 'Auth-virhe' }, { status: 500 })
      }
    } else {
      profileId = newAuthUser.user.id
    }

    // Upsert profile
    if (profileId) {
      const { error: profileError } = await admin.from('profiles').upsert({
        id: profileId,
        club_id: clubId,
        active_club_id: clubId,
        full_name: fullName,
        email,
        phone: body.phone || null,
        role: 'member',
        member_status: 'active',
        join_date: today,
        member_number: body.member_number || null,
        birth_date: body.birth_date || null,
        member_type: body.member_type || null,
        street_address: body.street_address || null,
        postal_code: body.postal_code || null,
        city: body.city || null,
        home_municipality: body.home_municipality || null,
        billing_method: body.billing_method || null,
        additional_info: body.additional_info || null,
      })

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      // Send invite email if requested
      if (body.send_invite) {
        const apiKey = process.env.RESEND_API_KEY
        if (apiKey) {
          const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
          const clubName = (clubRaw as { name: string | null } | null)?.name ?? 'Metsästysseura'

          const resend = new Resend(apiKey)
          const { error: sendError } = await resend.emails.send({
            from: 'JahtiPro <noreply@jahtipro.fi>',
            to: email,
            subject: welcomeSubject(),
            html: welcomeHtml({ fullName, clubName, email }),
          })

          if (!sendError) invited = true
        }
      }
    }
  } else {
    // No email — create profile without auth user using a generated UUID
    const newId = crypto.randomUUID()
    const { error: profileError } = await admin.from('profiles').insert({
      id: newId,
      club_id: clubId,
      active_club_id: clubId,
      full_name: fullName,
      email: null,
      phone: body.phone || null,
      role: 'member',
      member_status: 'active',
      join_date: today,
      member_number: body.member_number || null,
      birth_date: body.birth_date || null,
      member_type: body.member_type || null,
      street_address: body.street_address || null,
      postal_code: body.postal_code || null,
      city: body.city || null,
      home_municipality: body.home_municipality || null,
      billing_method: body.billing_method || null,
      additional_info: body.additional_info || null,
    })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    profileId = newId
  }

  return NextResponse.json({ ok: true, id: profileId, invited })
}
