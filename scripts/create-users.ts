import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local manually (no dotenv dependency needed)
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

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CLUB_ID = 'd1cb1cdf-80a1-45d0-8c18-c5e5fa4eb5e4'
const PASSWORD = 'Eramiehet2026!'

const EMAILS = [
  'juha.nieminen71@gmail.com',
  'eviirumaki@gmail.com',
  'hsnieminen@hotmail.com',
  'erkkikoivisto58@gmail.com',
  'masa.honkola@omanetti.fi',
]

async function createUser(email: string) {
  // 1. Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      club_id: CLUB_ID,
      full_name: '',
    },
  })

  if (authError) {
    console.error(`❌ ${email} — auth error: ${authError.message}`)
    return
  }

  const userId = authData.user.id

  // 2. Insert into profiles
  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    full_name: email,
    club_id: CLUB_ID,
    active_club_id: CLUB_ID,
    role: 'member',
    member_status: 'active',
  })

  if (profileError) {
    console.error(`❌ ${email} (${userId}) — profile insert error: ${profileError.message}`)
    return
  }

  // 3. Insert into club_members (if table exists)
  const { error: memberError } = await admin.from('club_members').insert({
    club_id: CLUB_ID,
    profile_id: userId,
    role: 'member',
    status: 'active',
  })

  if (memberError) {
    // Non-fatal — profiles table may be the source of truth
    console.warn(`⚠️  ${email} — club_members insert warning: ${memberError.message}`)
  }

  console.log(`✅ ${email} — created (id: ${userId})`)
}

async function main() {
  console.log(`Creating ${EMAILS.length} users for club ${CLUB_ID}\n`)
  for (const email of EMAILS) {
    await createUser(email)
  }
  console.log('\nDone.')
}

main().catch(console.error)
