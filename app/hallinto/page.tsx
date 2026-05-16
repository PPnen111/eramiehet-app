import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import AdminPanel from './admin-panel'

export type AdminMember = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  member_status: string
  member_type: string | null
}

export default async function HallintoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, member_status, active_club_id')
    .eq('id', user.id)
    .single()

  const effectiveRole = profile?.role ?? null
  if (!isBoardOrAbove(effectiveRole)) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">← Takaisin</Link>
          <p className="text-[#1e3d1e]">Ei käyttöoikeutta.</p>
        </div>
      </main>
    )
  }

  const clubId = profile!.active_club_id ?? profile!.club_id

  // Fetch all club members server-side via admin client (bypasses RLS)
  const admin = createAdminClient()
  const { data: raw } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, member_status, member_type')
    .eq('club_id', clubId)
    .order('full_name', { ascending: true })

  const initialMembers = (raw ?? []) as AdminMember[]

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">← Takaisin</Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Hallinto</h1>
        <AdminPanel clubId={clubId} initialMembers={initialMembers} isAdmin={effectiveRole === 'admin' || effectiveRole === 'superadmin'} />
      </div>
    </main>
  )
}
