import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import { isBoardOrAbove } from '@/lib/auth'
import BookingForm from './booking-form'
import DeleteBookingButton from './delete-booking-button'
import CabinCalendar from './cabin-calendar'

type BookingRow = {
  id: string
  profile_id: string
  starts_on: string
  ends_on: string
  note: string | null
  profiles: { full_name: string | null } | null
}

type CabinInfoRow = {
  pricing_text: string | null
  instructions_text: string | null
}


function nightCount(starts: string, ends: string): number {
  const diff = new Date(ends).getTime() - new Date(starts).getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' })
}

export default async function ErakartanoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, member_status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
          <p className="text-green-300">Profiilia ei löydy.</p>
        </div>
      </main>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const isAdmin = isBoardOrAbove(profile.role)

  const { data: cabinRaw } = await supabase
    .from('cabin_info')
    .select('pricing_text, instructions_text')
    .eq('club_id', profile.club_id)
    .single()

  const cabinInfo = cabinRaw ? (cabinRaw as unknown as CabinInfoRow) : null

  const { data: raw } = await supabase
    .from('bookings')
    .select('id, profile_id, starts_on, ends_on, note, profiles(full_name)')
    .eq('club_id', profile.club_id)
    .order('starts_on', { ascending: true })

  const bookings = (raw ?? []) as unknown as BookingRow[]

  // For overlap check, pass minimal shape
  const existingBookings = bookings.map((b) => ({
    id: b.id,
    starts_on: b.starts_on,
    ends_on: b.ends_on,
  }))

  // Group by month
  const grouped = bookings.reduce<Record<string, BookingRow[]>>((acc, b) => {
    const key = monthKey(b.starts_on)
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})
  const monthKeys = Object.keys(grouped).sort()

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
        <h1 className="text-2xl font-bold text-white">Eräkartano</h1>

        <CabinCalendar bookings={existingBookings} />

        <BookingForm
          clubId={profile.club_id}
          profileId={user.id}
          isAdmin={isAdmin}
          existingBookings={existingBookings}
        />

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-green-900 bg-white/[0.02] py-10 text-center">
            <CalendarOff size={32} className="text-green-700" strokeWidth={1.5} />
            <p className="text-sm text-green-600">Ei varauksia. Tee ensimmäinen varaus!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {monthKeys.map((key) => (
              <section key={key}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
                  {monthLabel(key)}
                </h2>
                <div className="space-y-3">
                  {grouped[key].map((b) => {
                    const nights = nightCount(b.starts_on, b.ends_on)
                    const isFuture = b.ends_on >= today
                    const canCancel = isFuture && (isAdmin || b.profile_id === user.id)
                    const bookerName = (b.profiles as unknown as { full_name: string | null } | null)?.full_name
                    return (
                      <div
                        key={b.id}
                        className={`rounded-2xl border p-4 ${
                          isFuture ? 'border-green-800 bg-white/5' : 'border-green-900 bg-white/[0.02] opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">
                              {formatDate(b.starts_on)} – {formatDate(b.ends_on)}
                            </p>
                            <p className="mt-0.5 text-xs text-green-500">
                              {nights === 0 ? 'Päiväkäynti' : `${nights} yö${nights !== 1 ? 'tä' : ''}`}
                            </p>
                            {bookerName && (
                              <p className="mt-1 text-sm text-green-300">{bookerName}</p>
                            )}
                            {b.note && (
                              <p className="mt-1 text-sm text-green-500">{b.note}</p>
                            )}
                          </div>
                          {canCancel && <DeleteBookingButton bookingId={b.id} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        {/* Hinnasto */}
        <section className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-white">Hinnasto</h2>
            {isAdmin && (
              <Link
                href="/erakartano/muokkaa-info"
                className="text-xs text-green-400 hover:text-green-300"
              >
                Muokkaa hinnastoa
              </Link>
            )}
          </div>
          {cabinInfo?.pricing_text ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-300">
              {cabinInfo.pricing_text}
            </p>
          ) : (
            <p className="text-sm text-green-600">Hinnastoa ei ole asetettu.</p>
          )}
        </section>

        {/* Ohjeet */}
        <section className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-white">Ohjeet</h2>
            {isAdmin && (
              <Link
                href="/erakartano/muokkaa-info"
                className="text-xs text-green-400 hover:text-green-300"
              >
                Muokkaa ohjeita
              </Link>
            )}
          </div>
          {cabinInfo?.instructions_text ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-300">
              {cabinInfo.instructions_text}
            </p>
          ) : (
            <p className="text-sm text-green-600">Ohjeita ei ole asetettu.</p>
          )}
        </section>
      </div>
    </main>
  )
}
