import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectiveRole } from '@/lib/role-preview'
import AdminPanel from './admin-panel'

export type AdminMember = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  member_status: string
}

export default async function HallintoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, member_status')
    .eq('id', user.id)
    .single()

  const effectiveRole = profile ? await getEffectiveRole(profile.role) : null
  if (!effectiveRole || (effectiveRole !== 'admin' && effectiveRole !== 'board_member')) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
          <p className="text-green-300">Ei käyttöoikeutta.</p>
        </div>
      </main>
    )
  }

  // Fetch all club members server-side via admin client (bypasses RLS)
  const admin = createAdminClient()
  const { data: raw } = await admin
    .from('profiles')
    .select('id, full_name, email, role, member_status')
    .eq('club_id', profile.club_id)
    .order('full_name', { ascending: true })

  const initialMembers = (raw ?? []) as AdminMember[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
        <h1 className="text-2xl font-bold text-white">Hallinto</h1>
        <AdminPanel clubId={profile.club_id} initialMembers={initialMembers} />
      </div>
    </main>
  )
}
