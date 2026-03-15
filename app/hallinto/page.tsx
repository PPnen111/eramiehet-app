import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminPanel from './admin-panel'

export default async function HallintoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, member_status')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'board_member')) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
          <p className="text-green-300">Ei käyttöoikeutta.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
        <h1 className="text-2xl font-bold text-white">Hallinto</h1>
        <AdminPanel clubId={profile.club_id} />
      </div>
    </main>
  )
}
