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
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isBoardOrAbove(profile.role)) redirect('/tapahtumat')

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/tapahtumat" className="text-sm text-green-400 hover:text-green-300">
          ← Tapahtumat
        </Link>
        <h1 className="text-2xl font-bold text-white">Luo tapahtuma</h1>
        <CreateEventForm clubId={profile.club_id} userId={user.id} />
      </div>
    </main>
  )
}
