import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CLUB_ID = 'd1cb1cdf-80a1-45d0-8c18-c5e5fa4eb5e4'

interface Member {
  full_name: string
  email: string | null
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

// Read members from members.json (NOT committed to git)
const membersPath = path.join(__dirname, 'members.json')
if (!fs.existsSync(membersPath)) {
  console.error('❌ scripts/members.json not found!')
  console.error('Create it from members.example.json')
  process.exit(1)
}

const MEMBERS: Member[] = JSON.parse(fs.readFileSync(membersPath, 'utf-8'))

async function main() {
  console.log(`📋 Tuodaan ${MEMBERS.length} jäsentä...`)
  let success = 0, skipped = 0, errors = 0

  for (const member of MEMBERS) {
    if (!member.email) {
      console.log(`⏭️  Ohitetaan (ei sähköpostia): ${member.full_name}`)
      skipped++
      continue
    }

    try {
      // Check if already in this club via profiles.email
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', member.email)
        .maybeSingle()

      if (existing) {
        const { data: cm } = await supabase
          .from('club_members')
          .select('id')
          .eq('profile_id', existing.id)
          .eq('club_id', CLUB_ID)
          .maybeSingle()

        if (cm) {
          console.log(`⏭️  Jo klubissa: ${member.full_name}`)
          skipped++
          continue
        }

        await supabase.from('club_members').insert({
          club_id: CLUB_ID,
          profile_id: existing.id,
          role: 'member',
          status: 'active'
        })
        console.log(`✅ Lisätty klubiin (olemassa): ${member.full_name}`)
        success++
        continue
      }

      // Create new auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: member.email,
          email_confirm: true,
          password: crypto.randomUUID(),
          user_metadata: { full_name: member.full_name }
        })

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  Sähköposti jo käytössä: ${member.full_name}`)
          skipped++
          continue
        }
        throw authError
      }

      const userId = authData.user.id

      // Update profile with all fields
      await supabase.from('profiles').update({
        full_name: member.full_name,
        phone: member.phone ?? null,
        member_number: member.member_number ?? null,
        birth_date: member.birth_date ?? null,
        member_type: member.member_type ?? null,
        street_address: member.street_address ?? null,
        postal_code: member.postal_code ?? null,
        city: member.city ?? null,
        home_municipality: member.home_municipality ?? null,
        billing_method: member.billing_method ?? null,
        additional_info: member.additional_info ?? null,
        club_id: CLUB_ID,
        active_club_id: CLUB_ID,
      }).eq('id', userId)

      // Insert club_members
      await supabase.from('club_members').insert({
        club_id: CLUB_ID,
        profile_id: userId,
        role: 'member',
        status: 'active'
      })

      console.log(`✅ ${member.full_name} (${member.email})`)
      success++

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(`❌ Virhe: ${member.full_name}: ${message}`)
      errors++
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n📊 Valmis!`)
  console.log(`✅ Tuotu: ${success}`)
  console.log(`⏭️  Ohitettu: ${skipped}`)
  console.log(`❌ Virheitä: ${errors}`)
}

main()
