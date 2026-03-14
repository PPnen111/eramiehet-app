import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BookingForm from './booking-form'
import DeleteBookingButton from './delete-booking-button'

type Booking = {
  id: string
  booker_name: string | null
  starts_on: string
  ends_on: string
  note: string | null
  profile_id: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

function nightCount(starts: string, ends: string): number {
  const diff =
    new Date(ends).getTime() - new Date(starts).getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export default async function ErakartanoPage() {
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

  if (!mem) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
            ← Takaisin
          </Link>
          <p className="text-green-300">Et kuulu mihinkään seuraan.</p>
        </div>
      </main>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const isAdmin = mem.role === 'admin' || mem.role === 'board_member'

  const { data: raw } = await supabase
    .from('bookings')
    .select('id, booker_name, starts_on, ends_on, note, profile_id')
    .eq('club_id', mem.club_id)
    .gte('ends_on', today)
    .order('starts_on', { ascending: true })

  const bookings = (raw ?? []) as Booking[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Eräkartano</h1>
        </div>

        <BookingForm
          clubId={mem.club_id}
          profileId={user.id}
          isAdmin={isAdmin}
          existingBookings={bookings}
        />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
            Tulevat varaukset
          </h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-green-600">Ei varauksia.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const nights = nightCount(b.starts_on, b.ends_on)
                return (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-green-800 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">
                          {formatDate(b.starts_on)} – {formatDate(b.ends_on)}
                        </p>
                        <p className="mt-0.5 text-xs text-green-500">
                          {nights === 0 ? 'Päiväkäynti' : `${nights} yö${nights !== 1 ? 'tä' : ''}`}
                        </p>
                        {b.booker_name && (
                          <p className="mt-1 text-sm text-green-300">{b.booker_name}</p>
                        )}
                        {b.note && (
                          <p className="mt-1 text-sm text-green-500">{b.note}</p>
                        )}
                      </div>
                      {(isAdmin || b.profile_id === user.id) && (
                        <DeleteBookingButton bookingId={b.id} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
