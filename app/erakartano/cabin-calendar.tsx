'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CalendarBooking = {
  id: string
  starts_on: string
  ends_on: string
  status: 'pending' | 'confirmed'
}

interface Props {
  bookings: CalendarBooking[]
}

const WEEKDAYS = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CabinCalendar({ bookings }: Props) {
  const [year, setYear] = useState(0)
  const [month, setMonth] = useState(0)
  const [todayStr, setTodayStr] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setTodayStr(localDateStr(now))
    setMounted(true)
  }, [])

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
        <div className="h-56 animate-pulse rounded-xl bg-white/5" />
      </div>
    )
  }

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7

  const monthName = firstDay.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })

  const cells: (string | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  function getStatus(dateStr: string): 'confirmed' | 'pending' | 'today' | 'past' | 'free' {
    for (const b of bookings) {
      if (b.starts_on <= dateStr && b.ends_on >= dateStr) {
        return b.status === 'confirmed' ? 'confirmed' : 'pending'
      }
    }
    if (dateStr === todayStr) return 'today'
    if (dateStr < todayStr) return 'past'
    return 'free'
  }

  const base = 'flex h-9 items-center justify-center rounded-lg text-sm select-none'
  const styles: Record<string, string> = {
    confirmed: 'bg-red-900/70 font-semibold text-red-200',
    pending: 'bg-orange-500/70 font-semibold text-orange-100',
    today: 'ring-2 ring-green-400 font-semibold text-white',
    past: 'text-green-800',
    free: 'text-green-300',
  }

  return (
    <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
      {/* Navigointi */}
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

      {/* Päiväruudukko */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />
          const status = getStatus(dateStr)
          const day = parseInt(dateStr.slice(8), 10)
          return (
            <div key={dateStr} className={`${base} ${styles[status]}`}>
              {day}
            </div>
          )
        })}
      </div>

      {/* Selite */}
      <div className="mt-4 space-y-1.5 border-t border-green-900 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">Selite</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="inline-block h-3 w-3 rounded bg-orange-500/70" />
            Odottaa vahvistusta
          </span>
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="inline-block h-3 w-3 rounded bg-red-900/70" />
            Vahvistettu varaus
          </span>
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="inline-block h-3 w-3 rounded ring-2 ring-green-400" />
            Tänään
          </span>
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="inline-block h-3 w-3 rounded border border-green-700" />
            Vapaa
          </span>
        </div>
      </div>
    </div>
  )
}
