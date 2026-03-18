import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectiveRole } from '@/lib/role-preview'
import MemberSearch from './member-search'

export type MemberRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  member_status: string
  join_date: string | null
}

export default async function JasenetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('club_id, role, member_status')
    .eq('id', user.id)
    .single()

  const effectiveRole = myProfile ? await getEffectiveRole(myProfile.role) : null
  if (!effectiveRole || (effectiveRole !== 'admin' && effectiveRole !== 'board_member')) {
    redirect('/dashboard')
  }

  // Use admin client (service role) to bypass RLS — profiles RLS only
  // allows users to read their own row; admins need all rows in the club.
  const admin = createAdminClient()
  const { data: raw } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, member_status, join_date')
    .eq('club_id', myProfile.club_id)
    .order('full_name', { ascending: true })

  const members = (raw ?? []) as MemberRow[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
          <Link
            href="/jasenet/kortti"
            className="rounded-xl border border-green-700 px-3 py-1.5 text-sm font-medium text-green-300 hover:bg-green-900/30"
          >
            Jäsenkortti
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Jäsenet</h1>
        <MemberSearch members={members} />
      </div>
    </main>
  )
}
