import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isBoardOrAbove } from '@/lib/auth'
import EditEventForm from './edit-event-form'

type EventRow = {
  id: string
  club_id: string
  title: string
  description: string | null
  type: string
  starts_at: string
  ends_at: string | null
  location: string | null
}

export default async function MuokkaaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isBoardOrAbove(profile.role)) redirect('/tapahtumat')

  const clubId = profile.active_club_id ?? profile.club_id

  const { data: raw } = await supabase
    .from('events')
    .select('id, club_id, title, description, type, starts_at, ends_at, location')
    .eq('id', id)
    .single()

  if (!raw) notFound()

  const event = raw as unknown as EventRow

  if (event.club_id !== clubId) notFound()

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={`/tapahtumat/${id}`}
          className="text-sm text-green-400 hover:text-green-300"
        >
          ← Takaisin tapahtumaan
        </Link>
        <h1 className="text-2xl font-bold text-white">Muokkaa tapahtumaa</h1>
        <EditEventForm
          eventId={event.id}
          initialTitle={event.title}
          initialType={event.type}
          initialStartsAt={event.starts_at}
          initialEndsAt={event.ends_at}
          initialLocation={event.location}
          initialDescription={event.description}
        />
      </div>
    </main>
  )
}
