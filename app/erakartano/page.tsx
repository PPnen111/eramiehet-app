import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import ErakartanoTabs, { type BookingRow } from './erakartano-tabs'
import RentalLocationBooking from './rental-location-booking'

type CabinInfoRow = {
  pricing_text: string | null
  instructions_text: string | null
}

type RentalLocation = {
  id: string
  name: string
  location_type: string
  description: string | null
  pricing_text: string | null
  instructions_text: string | null
  max_capacity: number | null
  booking_unit: string
  min_booking_hours: number | null
}

export default async function ErakartanoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, member_status, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
            ← Takaisin
          </Link>
          <p className="text-green-300">Profiilia ei löydy.</p>
        </div>
      </main>
    )
  }

  const isAdmin = isBoardOrAbove(profile.role)
  const admin = createAdminClient()

  // Check for new rental locations system
  const { data: locationsRaw } = await admin
    .from('rental_locations')
    .select('id, name, location_type, description, pricing_text, instructions_text, max_capacity, booking_unit, min_booking_hours')
    .eq('club_id', profile.club_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const locations = (locationsRaw ?? []) as RentalLocation[]

  // MODE A: New rental locations system
  if (locations.length > 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
            ← Takaisin
          </Link>
          <h1 className="text-2xl font-bold text-white">Varaukset</h1>
          <RentalLocationBooking
            locations={locations}
            clubId={profile.club_id}
            userId={user.id}
            userName={(profile as unknown as { full_name: string | null }).full_name}
          />
        </div>
      </main>
    )
  }

  // MODE B: Legacy cabin_info system (unchanged)
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>
        <h1 className="text-2xl font-bold text-white">Eräkartano – varaukset</h1>

        <ErakartanoTabs
          bookings={bookings}
          userId={user.id}
          isAdmin={isAdmin}
        />

        <section className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-white">Hinnasto</h2>
            {isAdmin && (
              <Link href="/erakartano/muokkaa-info" className="text-xs text-green-400 hover:text-green-300">Muokkaa</Link>
            )}
          </div>
          {cabinInfo?.pricing_text ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-300">{cabinInfo.pricing_text}</p>
          ) : (
            <p className="text-sm text-green-600">Hinnastoa ei ole asetettu.</p>
          )}
        </section>

        <section className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-white">Ohjeet</h2>
            {isAdmin && (
              <Link href="/erakartano/muokkaa-info" className="text-xs text-green-400 hover:text-green-300">Muokkaa</Link>
            )}
          </div>
          {cabinInfo?.instructions_text ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-300">{cabinInfo.instructions_text}</p>
          ) : (
            <p className="text-sm text-green-600">Ohjeita ei ole asetettu.</p>
          )}
        </section>
      </div>
    </main>
  )
}
