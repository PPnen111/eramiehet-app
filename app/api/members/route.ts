import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { getActorContext, getEffectiveClubId, guardTenant } from '@/lib/tenant'
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
  profile_id: string | null
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
  const actor = { id: user.id, role: caller.role, club_id: caller.club_id, active_club_id: caller.active_club_id }
  const clubId = caller.active_club_id ?? caller.club_id
  const violation = await guardTenant(actor, clubId)
  if (violation) return violation

  const admin = createAdminClient()

  // Fetch all members from member_registry (source of truth)
  const { data: registryRaw } = await admin
    .from('member_registry')
    .select('id, full_name, email, phone, member_type, profile_id')
    .eq('club_id', clubId)
    .order('full_name', { ascending: true })

  const registry = (registryRaw ?? []) as {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    member_type: string | null
    profile_id: string | null
  }[]

  // Also fetch profiles for this club (for users with app accounts)
  const { data: profilesRaw } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, member_status, member_type')
    .eq('club_id', clubId)

  const profileMap = new Map(
    ((profilesRaw ?? []) as {
      id: string
      full_name: string | null
      email: string | null
      phone: string | null
      role: string
      member_status: string
      member_type: string | null
    }[]).map((p) => [p.id, p])
  )

  // Fetch auth users to get login status for those with profile_id
  const profileIds = registry
    .map((r) => r.profile_id)
    .filter((id): id is string => id !== null)

  const loginMap = new Map<string, boolean>()
  if (profileIds.length > 0) {
    let page = 1
    const perPage = 1000
    const idSet = new Set(profileIds)
    while (true) {
      const { data: authData } = await admin.auth.admin.listUsers({ page, perPage })
      if (!authData?.users?.length) break
      for (const u of authData.users) {
        if (idSet.has(u.id)) {
          loginMap.set(u.id, !!u.last_sign_in_at)
        }
      }
      if (authData.users.length < perPage) break
      page++
    }
  }

  // Build member list: registry entries + any profile-only entries not in registry
  const registryProfileIds = new Set(registry.map((r) => r.profile_id).filter(Boolean))

  const members: MemberWithStatus[] = registry.map((r) => {
    const profile = r.profile_id ? profileMap.get(r.profile_id) : null
    return {
      id: r.id,
      full_name: r.full_name ?? profile?.full_name ?? null,
      email: r.email ?? profile?.email ?? null,
      phone: r.phone ?? profile?.phone ?? null,
      role: profile?.role ?? 'member',
      member_status: profile?.member_status ?? (r.profile_id ? 'active' : 'no_account'),
      member_type: r.member_type ?? profile?.member_type ?? null,
      has_logged_in: r.profile_id ? (loginMap.get(r.profile_id) ?? false) : false,
      profile_id: r.profile_id,
    }
  })

  // Add profile-only members (have profiles entry but no registry entry)
  for (const p of profileMap.values()) {
    if (!registryProfileIds.has(p.id)) {
      members.push({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        role: p.role,
        member_status: p.member_status,
        member_type: p.member_type,
        has_logged_in: loginMap.get(p.id) ?? false,
        profile_id: p.id,
      })
    }
  }

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
  const postViolation = await guardTenant({ id: user.id, role: caller.role, club_id: caller.club_id, active_club_id: caller.active_club_id }, clubId)
  if (postViolation) return postViolation

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
