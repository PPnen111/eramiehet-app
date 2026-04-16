import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type GuestPermitRow = {
  id: string
  club_id: string
  guest_name: string
  guest_email: string | null
  host_profile_id: string | null
  host_registry_id: string | null
  area: string | null
  valid_from: string | null
  valid_until: string | null
  price_cents: number | null
  status: 'active' | 'expired' | 'cancelled'
  payment_id: string | null
  notes: string | null
  created_at: string
}

type PaymentRow = { id: string; status: string; paid_at: string | null }
type ProfileRow = { id: string; full_name: string | null; email: string | null }
type RegistryRow = { id: string; full_name: string | null; email: string | null }

export type GuestPermit = GuestPermitRow & {
  host_name: string | null
  host_email: string | null
  payment_status: 'paid' | 'pending' | 'none'
}

async function getCaller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('club_id, active_club_id, role, full_name').eq('id', user.id).single()
  const p = data as { club_id: string; active_club_id: string | null; role: string; full_name: string | null } | null
  if (!p) return null
  return { userId: user.id, clubId: p.active_club_id ?? p.club_id, role: p.role, fullName: p.full_name }
}

async function hydratePermits(admin: ReturnType<typeof createAdminClient>, rows: GuestPermitRow[]): Promise<GuestPermit[]> {
  if (rows.length === 0) return []

  const profileIds = [...new Set(rows.map((r) => r.host_profile_id).filter((x): x is string => !!x))]
  const registryIds = [...new Set(rows.map((r) => r.host_registry_id).filter((x): x is string => !!x))]
  const paymentIds = [...new Set(rows.map((r) => r.payment_id).filter((x): x is string => !!x))]

  const [profilesRes, registryRes, paymentsRes] = await Promise.all([
    profileIds.length > 0
      ? admin.from('profiles').select('id, full_name, email').in('id', profileIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    registryIds.length > 0
      ? admin.from('member_registry').select('id, full_name, email').in('id', registryIds)
      : Promise.resolve({ data: [] as RegistryRow[] }),
    paymentIds.length > 0
      ? admin.from('payments').select('id, status, paid_at').in('id', paymentIds)
      : Promise.resolve({ data: [] as PaymentRow[] }),
  ])

  const profiles = (profilesRes.data ?? []) as ProfileRow[]
  const registry = (registryRes.data ?? []) as RegistryRow[]
  const payments = (paymentsRes.data ?? []) as PaymentRow[]

  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const registryMap = new Map(registry.map((r) => [r.id, r]))
  const paymentMap = new Map(payments.map((p) => [p.id, p]))

  return rows.map((r) => {
    let host_name: string | null = null
    let host_email: string | null = null
    if (r.host_profile_id) {
      const p = profileMap.get(r.host_profile_id)
      host_name = p?.full_name ?? null
      host_email = p?.email ?? null
    } else if (r.host_registry_id) {
      const m = registryMap.get(r.host_registry_id)
      host_name = m?.full_name ?? null
      host_email = m?.email ?? null
    }

    let payment_status: 'paid' | 'pending' | 'none' = 'none'
    if (r.payment_id) {
      const p = paymentMap.get(r.payment_id)
      payment_status = p?.status === 'paid' ? 'paid' : 'pending'
    }

    return { ...r, host_name, host_email, payment_status }
  })
}

export async function GET() {
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: rowsRaw, error } = await admin
    .from('guest_permits')
    .select('*')
    .eq('club_id', caller.clubId)
    .order('valid_until', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (rowsRaw ?? []) as GuestPermitRow[]
  const hydrated = await hydratePermits(admin, rows)

  return NextResponse.json({ permits: hydrated })
}

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isBoardOrAbove(caller.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as {
    guest_name: string
    guest_email?: string
    host_profile_id?: string
    host_registry_id?: string
    area?: string
    valid_from?: string
    valid_until?: string
    price_cents?: number
    notes?: string
  }

  if (!body.guest_name?.trim()) {
    return NextResponse.json({ error: 'Vieraan nimi puuttuu' }, { status: 400 })
  }
  if (!body.host_profile_id && !body.host_registry_id) {
    return NextResponse.json({ error: 'Isäntä puuttuu' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: insertRaw, error } = await admin
    .from('guest_permits')
    .insert({
      club_id: caller.clubId,
      guest_name: body.guest_name.trim(),
      guest_email: body.guest_email?.trim() || null,
      host_profile_id: body.host_profile_id ?? null,
      host_registry_id: body.host_registry_id ?? null,
      area: body.area?.trim() || null,
      valid_from: body.valid_from ?? null,
      valid_until: body.valid_until ?? null,
      price_cents: typeof body.price_cents === 'number' ? body.price_cents : null,
      status: 'active',
      notes: body.notes?.trim() || null,
      created_by: caller.userId,
    })
    .select('*')
    .single()

  if (error || !insertRaw) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  const inserted = insertRaw as GuestPermitRow

  // Notify host via email (fire-and-forget, but we await so errors surface in logs)
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      let hostEmail: string | null = null
      let hostName: string | null = null
      if (inserted.host_profile_id) {
        const { data } = await admin.from('profiles').select('email, full_name').eq('id', inserted.host_profile_id).single()
        const r = data as { email: string | null; full_name: string | null } | null
        hostEmail = r?.email ?? null
        hostName = r?.full_name ?? null
      } else if (inserted.host_registry_id) {
        const { data } = await admin.from('member_registry').select('email, full_name').eq('id', inserted.host_registry_id).single()
        const r = data as { email: string | null; full_name: string | null } | null
        hostEmail = r?.email ?? null
        hostName = r?.full_name ?? null
      }

      if (hostEmail) {
        const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', caller.clubId).single()
        const clubName = (clubRaw as { name: string } | null)?.name ?? 'Metsästysseura'
        const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fi-FI') : '—'
        const validity = `${fmt(inserted.valid_from)} – ${fmt(inserted.valid_until)}`

        const resend = new Resend(apiKey)
        await resend.emails.send({
          from: 'JahtiPro <info@jahtipro.fi>',
          to: hostEmail,
          subject: `Isännyysvastuu vierasluvasta — ${inserted.guest_name}`,
          html: `<p>Hei ${hostName ?? ''},</p>
<p>Sinulle on myönnetty isännyysvastuu vierasluvasta seurassa <strong>${clubName}</strong>.</p>
<p>
<strong>Vieras:</strong> ${inserted.guest_name}<br/>
<strong>Alue:</strong> ${inserted.area ?? '—'}<br/>
<strong>Voimassa:</strong> ${validity}
</p>
${inserted.notes ? `<p><strong>Lisätiedot:</strong> ${inserted.notes}</p>` : ''}
<p>Terveisin,<br/>${clubName}</p>`,
        })
      }
    }
  } catch (e) {
    console.error('Host notification email failed:', e)
  }

  const [hydrated] = await hydratePermits(admin, [inserted])
  return NextResponse.json({ permit: hydrated })
}
