'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Booking = {
  id: string
  starts_on: string
  ends_on: string
}

interface Props {
  bookings: Booking[]
}

const WEEKDAYS = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']

export default function CabinCalendar({ bookings }: Props) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Finnish week starts on Monday: getDay() 0=Sun → 6, 1=Mon → 0
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7

  const monthName = firstDay.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })

  const cells: (string | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(dateStr)
  }

  function getStatus(dateStr: string): 'booked' | 'today' | 'past' | 'free' {
    const isBooked = bookings.some((b) => b.starts_on <= dateStr && b.ends_on >= dateStr)
    if (isBooked) return 'booked'
    if (dateStr === todayStr) return 'today'
    if (dateStr < todayStr) return 'past'
    return 'free'
  }

  return (
    <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
      {/* Otsikkorivi */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-green-400 hover:bg-white/10 transition-colors"
          aria-label="Edellinen kuukausi"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold capitalize text-white">{monthName}</span>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-green-400 hover:bg-white/10 transition-colors"
          aria-label="Seuraava kuukausi"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Viikonpäivät */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-green-600">
            {d}
          </div>
        ))}
      </div>

      {/* Päivät */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />

          const status = getStatus(dateStr)
          const day = parseInt(dateStr.slice(8), 10)

          const base = 'flex h-9 items-center justify-center rounded-lg text-sm select-none'
          const styles: Record<string, string> = {
            booked: 'bg-red-900/70 font-semibold text-red-200',
            today:  'ring-2 ring-green-400 font-semibold text-white',
            past:   'text-green-800',
            free:   'text-green-300 hover:bg-white/10',
          }

          return (
            <div key={dateStr} className={`${base} ${styles[status]}`}>
              {day}
            </div>
          )
        })}
      </div>

      {/* Selite */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-green-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-900/70" />
          Varattu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-green-600" />
          Vapaa
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded ring-2 ring-green-400" />
          Tänään
        </span>
      </div>
    </div>
  )
}
