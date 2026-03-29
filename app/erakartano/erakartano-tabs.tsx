'use client'

import { useState } from 'react'
import { CalendarOff } from 'lucide-react'
import { formatDate } from '@/lib/format'
import CabinCalendar, { type CalendarBooking } from './cabin-calendar'
import BookingForm from './booking-form'
import DeleteBookingButton from './delete-booking-button'
import ConfirmBookingButton from './confirm-booking-button'

export const LOCATIONS = [
  { value: 'erakartano', label: 'Eräkartano' },
  { value: 'takkatupa', label: 'Takkatupa' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'nylkyvaja', label: 'Nylkyvaja' },
  { value: 'majoitustilat', label: 'Majoitustilat' },
] as const

export type BookingRow = {
  id: string
  profile_id: string
  starts_on: string
  ends_on: string
  note: string | null
  profiles: { full_name: string | null } | null
}

// Helpers to parse metadata encoded in note field
// Format: [kohde:erakartano]\n[varaaja:John]\n[tila:pending]\nOriginal note
function parseLocation(note: string | null): string {
  return note?.match(/\[kohde:(\w+)\]/)?.[1] ?? 'erakartano'
}
function parseStatus(note: string | null): 'pending' | 'confirmed' {
  const s = note?.match(/\[tila:(\w+)\]/)?.[1]
  return s === 'confirmed' ? 'confirmed' : 'pending'
}
function parseBookerName(note: string | null): string | null {
  return note?.match(/\[varaaja:([^\]]+)\]/)?.[1] ?? null
}
function parseNote(note: string | null): string | null {
  const clean = note
    ?.replace(/\[kohde:[^\]]+\]\n?/g, '')
    .replace(/\[varaaja:[^\]]+\]\n?/g, '')
    .replace(/\[tila:[^\]]+\]\n?/g, '')
    .trim()
  return clean || null
}

interface Props {
  bookings: BookingRow[]
  userId: string
  isAdmin: boolean
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
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: 'long',
  })
}

export default function ErakartanoTabs({ bookings, userId, isAdmin }: Props) {
  const [activeLocation, setActiveLocation] = useState<string>(LOCATIONS[0].value)
  const today = new Date().toISOString().slice(0, 10)

  const locationBookings = bookings.filter((b) => parseLocation(b.note) === activeLocation)

  const calendarBookings: CalendarBooking[] = locationBookings.map((b) => ({
    id: b.id,
    starts_on: b.starts_on,
    ends_on: b.ends_on,
    status: parseStatus(b.note),
  }))

  const allForOverlap = bookings.map((b) => ({
    id: b.id,
    starts_on: b.starts_on,
    ends_on: b.ends_on,
    location: parseLocation(b.note),
  }))

  // Group by month
  const grouped = locationBookings.reduce<Record<string, BookingRow[]>>((acc, b) => {
    const key = monthKey(b.starts_on)
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})
  const monthKeys = Object.keys(grouped).sort()

  return (
    <div className="space-y-4">
      {/* Location tabs */}
      <div className="flex flex-wrap gap-2">
        {LOCATIONS.map((loc) => {
          const count = bookings.filter(
            (b) => parseLocation(b.note) === loc.value && b.ends_on >= today
          ).length
          return (
            <button
              key={loc.value}
              onClick={() => setActiveLocation(loc.value)}
              className={`relative rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                activeLocation === loc.value
                  ? 'bg-green-700 text-white'
                  : 'border border-green-800 text-green-400 hover:bg-white/5'
              }`}
            >
              {loc.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Calendar for active location */}
      <CabinCalendar bookings={calendarBookings} />

      {/* Booking form */}
      <BookingForm
        selectedLocation={activeLocation}
        existingBookings={allForOverlap}
      />

      {/* Booking list */}
      {locationBookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-green-900 bg-white/[0.02] py-10 text-center">
          <CalendarOff size={32} className="text-green-700" strokeWidth={1.5} />
          <p className="text-sm text-green-600">
            Ei varauksia. Lähetä ensimmäinen varauspyyntö!
          </p>
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
                  const canCancel = isFuture && (isAdmin || b.profile_id === userId)
                  const bookerName =
                    parseBookerName(b.note) ??
                    (b.profiles as unknown as { full_name: string | null } | null)?.full_name
                  const isPending = parseStatus(b.note) === 'pending'
                  const cleanNote = parseNote(b.note)

                  return (
                    <div
                      key={b.id}
                      className={`rounded-2xl border p-4 ${
                        isFuture
                          ? isPending
                            ? 'border-orange-800/60 bg-orange-900/10'
                            : 'border-red-900/50 bg-white/5'
                          : 'border-green-900 bg-white/[0.02] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">
                              {formatDate(b.starts_on)} – {formatDate(b.ends_on)}
                            </p>
                            {/* Status badge */}
                            {isFuture && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  isPending
                                    ? 'bg-orange-500/30 text-orange-300'
                                    : 'bg-red-900/60 text-red-300'
                                }`}
                              >
                                {isPending ? 'Odottaa vahvistusta' : 'Vahvistettu'}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-green-500">
                            {nights === 0 ? 'Päiväkäynti' : `${nights} yö${nights !== 1 ? 'tä' : ''}`}
                          </p>
                          {bookerName && (
                            <p className="mt-1 text-sm text-green-300">{bookerName}</p>
                          )}
                          {cleanNote && (
                            <p className="mt-1 text-sm text-green-500">{cleanNote}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isAdmin && isPending && isFuture && (
                            <ConfirmBookingButton bookingId={b.id} />
                          )}
                          {canCancel && <DeleteBookingButton bookingId={b.id} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
