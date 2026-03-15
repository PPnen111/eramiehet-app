import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MemberSearch from './member-search'

export type MemberRow = {
  id: string
  role: string
  status: string
  profiles: {
    id: string
    full_name: string | null
    phone: string | null
    join_date: string | null
  } | null
}

export default async function JasenetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mem } = await supabase
    .from('club_members')
    .select('club_id, role')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .single()

  if (!mem || (mem.role !== 'admin' && mem.role !== 'board_member')) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
            ← Takaisin
          </Link>
          <p className="text-green-300">
            Ei käyttöoikeutta. Vain johtokunta ja ylläpitäjä voivat nähdä jäsenluettelon.
          </p>
        </div>
      </main>
    )
  }

  const { data: raw } = await supabase
    .from('club_members')
    .select('id, role, status, profiles(id, full_name, phone, join_date)')
    .eq('club_id', mem.club_id)
    .order('created_at', { ascending: true })

  const members = (raw ?? []) as unknown as MemberRow[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>
        <h1 className="text-2xl font-bold text-white">Jäsenet</h1>
        <MemberSearch members={members} />
      </div>
    </main>
  )
}
