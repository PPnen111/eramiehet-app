import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local manually
const envPath = resolve(__dirname, '../.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* ignore */ }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CLUB_ID = 'd1cb1cdf-80a1-45d0-8c18-c5e5fa4eb5e4'

type Member = {
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

// ─── PASTE MEMBER DATA HERE ────────────────────────────────────────────────
const MEMBERS: Member[] = [
  // { full_name: 'Matti Meikäläinen', email: 'matti@example.com', phone: '040123456', ... },
]
// ───────────────────────────────────────────────────────────────────────────

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

async function importMember(member: Member, index: number, total: number) {
  const full_name = (member.full_name ?? '').trim()
  const prefix = `[${index + 1}/${total}] ${full_name}`

  if (!full_name) {
    console.log(`⏭  (tyhjä nimi) — ohitetaan`)
    return 'skipped'
  }

  const email = member.email?.trim() || null

  if (!email) {
    console.log(`⏭  ${full_name} — ei sähköpostia, ohitetaan`)
    return 'skipped'
  }

  // Check if already a member of this club
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq('club_id', CLUB_ID)
    .maybeSingle()

  if (existing) {
    console.log(`⏭  ${prefix} — jo jäsen, ohitetaan`)
    return 'skipped'
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
      // User exists in auth (another club?) — find their profile id
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (!existingProfile) {
        console.error(`❌ ${prefix} — auth conflict mutta profiilia ei löydy: ${authError?.message}`)
        return 'error'
      }
      userId = existingProfile.id
      console.log(`♻️  ${prefix} — käyttäjä jo auth:ssa, lisätään klubiin`)
    } else {
      console.error(`❌ ${prefix} — auth error: ${authError?.message}`)
      return 'error'
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
    join_date: new Date().toISOString().slice(0, 10),
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
    console.error(`❌ ${prefix} — profile error: ${profileError.message}`)
    return 'error'
  }

  // 3. club_members row (non-fatal)
  const { error: memberError } = await admin.from('club_members').upsert(
    { club_id: CLUB_ID, profile_id: userId, role: 'member', status: 'active' },
    { onConflict: 'club_id,profile_id', ignoreDuplicates: true }
  )

  if (memberError) {
    console.warn(`⚠️  ${prefix} — club_members warning: ${memberError.message}`)
  }

  console.log(`✅ ${prefix} — tuotu (${email})`)
  return 'success'
}

async function main() {
  if (MEMBERS.length === 0) {
    console.error('❌ MEMBERS-taulukko on tyhjä. Lisää jäsendata skriptiin ennen ajoa.')
    process.exit(1)
  }

  console.log(`\nJahtipro bulk import`)
  console.log(`Club: ${CLUB_ID}`)
  console.log(`Jäseniä: ${MEMBERS.length}\n`)

  let success = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < MEMBERS.length; i++) {
    const result = await importMember(MEMBERS[i], i, MEMBERS.length)
    if (result === 'success') success++
    else if (result === 'skipped') skipped++
    else errors++
  }

  console.log(`\n─── Yhteenveto ───────────────────────────`)
  console.log(`✅ Tuotu:    ${success}`)
  console.log(`⏭  Ohitettu: ${skipped}`)
  console.log(`❌ Virheitä: ${errors}`)
  console.log(`──────────────────────────────────────────\n`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
