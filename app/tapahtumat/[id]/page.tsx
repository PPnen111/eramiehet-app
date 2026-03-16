import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeleteEventDetailButton from './delete-button'

const typeLabels: Record<string, string> = {
  talkoot: 'Talkoot',
  ampumaharjoitus: 'Ampumaharjoitus',
  kokous: 'Kokous',
  metsastyspaiva: 'Metsästyspäivä',
  muu: 'Muu',
}

const typeBadge: Record<string, string> = {
  talkoot: 'bg-yellow-800 text-yellow-200',
  ampumaharjoitus: 'bg-blue-900 text-blue-200',
  kokous: 'bg-purple-900 text-purple-200',
  metsastyspaiva: 'bg-green-900 text-green-200',
  muu: 'bg-stone-700 text-stone-300',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type EventRow = {
  id: string
  club_id: string
  title: string
  description: string | null
  type: string
  starts_at: string
  ends_at: string | null
  location: string | null
  created_by: string | null
}

type ProfileRow = {
  full_name: string | null
}

export default async function TapahtumaDetailPage({
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
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: raw } = await supabase
    .from('events')
    .select('id, club_id, title, description, type, starts_at, ends_at, location, created_by')
    .eq('id', id)
    .single()

  if (!raw) notFound()

  const event = raw as unknown as EventRow

  // Verify event belongs to user's club
  if (event.club_id !== profile.club_id) notFound()

  const isAdmin = profile.role === 'admin' || profile.role === 'board_member'

  // Fetch creator name if available
  let creatorName: string | null = null
  if (event.created_by) {
    const { data: creatorRaw } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', event.created_by)
      .single()
    if (creatorRaw) {
      const creator = creatorRaw as unknown as ProfileRow
      creatorName = creator.full_name
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/tapahtumat" className="text-sm text-green-400 hover:text-green-300">
          ← Tapahtumat
        </Link>

        <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-5">
          {/* Badge + otsikko */}
          <div>
            <span
              className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                typeBadge[event.type] ?? typeBadge.muu
              }`}
            >
              {typeLabels[event.type] ?? event.type}
            </span>
            <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          </div>

          {/* Päivämäärät */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-green-300">
              <span className="text-green-500">Alkaa</span>
              <span>{formatDate(event.starts_at)}</span>
            </div>
            {event.ends_at && (
              <div className="flex items-center gap-2 text-sm text-green-300">
                <span className="text-green-500">Päättyy</span>
                <span>{formatDate(event.ends_at)}</span>
              </div>
            )}
          </div>

          {/* Sijainti */}
          {event.location && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-500">Sijainti</span>
              <span className="text-green-200">{event.location}</span>
            </div>
          )}

          {/* Kuvaus */}
          {event.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-500">
                Kuvaus
              </p>
              <p className="text-sm leading-relaxed text-green-200">{event.description}</p>
            </div>
          )}

          {/* Luonut */}
          {creatorName && (
            <p className="text-xs text-green-600">Luonut: {creatorName}</p>
          )}
        </div>

        {/* Admin-toiminnot */}
        {isAdmin && (
          <div className="flex gap-3">
            <Link
              href={`/tapahtumat/${event.id}/muokkaa`}
              className="flex-1 rounded-xl bg-green-800 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700"
            >
              Muokkaa
            </Link>
            <DeleteEventDetailButton eventId={event.id} />
          </div>
        )}
      </div>
    </main>
  )
}
