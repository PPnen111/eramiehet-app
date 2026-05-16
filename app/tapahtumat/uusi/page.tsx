import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isBoardOrAbove } from '@/lib/auth'
import CreateEventForm from './create-event-form'

export default async function UusiTapahtumaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isBoardOrAbove(profile.role)) redirect('/tapahtumat')
  if (!profile.active_club_id) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/tapahtumat" className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">
          ← Tapahtumat
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Luo tapahtuma</h1>
        <CreateEventForm clubId={profile.active_club_id} userId={user.id} />
      </div>
    </main>
  )
}
