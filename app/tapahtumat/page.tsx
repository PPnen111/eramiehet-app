import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Hammer, Target, Users, Crosshair, MoreHorizontal, CalendarX, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DeleteEventButton from './delete-event-button'

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

const typeIcon: Record<string, React.ComponentType<{ size?: number }>> = {
  talkoot: Hammer,
  ampumaharjoitus: Target,
  kokous: Users,
  metsastyspaiva: Crosshair,
  muu: MoreHorizontal,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function TapahtumatPage() {
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

  const isAdmin = profile.role === 'admin' || profile.role === 'board_member'

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, type, starts_at')
    .eq('club_id', profile.club_id)
    .order('starts_at', { ascending: true })

  const now = new Date()
  const upcoming = (events ?? []).filter((e) => new Date(e.starts_at) >= now)
  const past = (events ?? []).filter((e) => new Date(e.starts_at) < now)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back */}
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Tapahtumat</h1>
          {isAdmin && (
            <Link
              href="/tapahtumat/uusi"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              <Plus size={15} />
              Luo tapahtuma
            </Link>
          )}
        </div>

        {/* Tulevat */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
            Tulevat
          </h2>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-green-900 bg-white/[0.02] py-10 text-center">
              <CalendarX size={32} className="text-green-700" strokeWidth={1.5} />
              <p className="text-sm text-green-600">Ei tulevia tapahtumia.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event) => (
                <div
                  key={event.id}
                  className="relative rounded-2xl border border-green-800 bg-white/5 p-4"
                >
                  <Link
                    href={`/tapahtumat/${event.id}`}
                    className="absolute inset-0 rounded-2xl"
                    aria-label={event.title}
                  />
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <div>
                      {(() => {
                        const TypeIcon = typeIcon[event.type] ?? MoreHorizontal
                        return (
                          <span
                            className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              typeBadge[event.type] ?? typeBadge.muu
                            }`}
                          >
                            <TypeIcon size={10} />
                            {typeLabels[event.type] ?? event.type}
                          </span>
                        )
                      })()}
                      <h3 className="font-semibold text-white">{event.title}</h3>
                      <p className="mt-1 text-sm text-green-300">
                        {formatDate(event.starts_at)}
                      </p>
                      {event.description && (
                        <p className="mt-2 text-sm text-green-400">{event.description}</p>
                      )}
                    </div>
                    {isAdmin && <DeleteEventButton eventId={event.id} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Menneet */}
        {past.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-600">
              Menneet
            </h2>
            <div className="space-y-2">
              {past
                .slice(-5)
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="relative rounded-xl border border-green-900 bg-white/[0.03] p-3 opacity-60"
                  >
                    <Link
                      href={`/tapahtumat/${event.id}`}
                      className="absolute inset-0 rounded-xl"
                      aria-label={event.title}
                    />
                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{event.title}</p>
                        <p className="text-xs text-green-500">{formatDate(event.starts_at)}</p>
                      </div>
                      {isAdmin && <DeleteEventButton eventId={event.id} />}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
