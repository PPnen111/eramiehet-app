'use client'

import { useState } from 'react'
import { Star, MessageSquare, Clock, TrendingUp, AlertCircle } from 'lucide-react'

export type FeedbackRow = {
  id: string
  profile_id: string | null
  club_id: string | null
  page: string | null
  rating: number | null
  message: string | null
  category: string | null
  status: string
  created_at: string
  full_name: string | null
  club_name: string | null
}

interface Props {
  rows: FeedbackRow[]
}

type FilterKey = 'kaikki' | 'uudet' | 'bugi' | 'parannus' | 'kiitos'

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'kaikki', label: 'Kaikki' },
  { id: 'uudet', label: 'Uudet' },
  { id: 'bugi', label: 'Bugit' },
  { id: 'parannus', label: 'Parannukset' },
  { id: 'kiitos', label: 'Kiitokset' },
]

const CATEGORY_STYLE: Record<string, { label: string; className: string }> = {
  bugi: { label: '🐛 Bugi', className: 'bg-red-100 text-red-700' },
  parannus: { label: '💡 Parannus', className: 'bg-blue-100 text-blue-700' },
  puuttuva_ominaisuus: { label: '✨ Puuttuva ominaisuus', className: 'bg-orange-100 text-orange-700' },
  kiitos: { label: '👍 Kiitos', className: 'bg-green-100 text-green-700' },
  yleinen: { label: '💬 Yleinen', className: 'bg-stone-100 text-stone-600' },
}

const STATUS_OPTIONS = [
  { value: 'uusi', label: 'Uusi' },
  { value: 'luettu', label: 'Luettu' },
  { value: 'hoidettu', label: 'Hoidettu' },
]

const STATUS_STYLE: Record<string, string> = {
  uusi: 'bg-yellow-100 text-yellow-800',
  luettu: 'bg-blue-100 text-blue-700',
  hoidettu: 'bg-green-100 text-green-700',
}

const PAGE_NAMES_FI: Record<string, string> = {
  '/dashboard': 'Etusivu',
  '/erakartano': 'Eräkartano',
  '/jasenet': 'Jäsenet',
  '/maksut': 'Maksut',
  '/metsastajille': 'Metsästäjille',
  '/dokumentit': 'Asiakirjat',
  '/hallinto': 'Hallinto',
  '/tapahtumat': 'Tapahtumat',
  '/saalis': 'Saalis',
  '/superadmin': 'Superadmin',
}

function pageNameFi(path: string | null): string {
  if (!path) return '—'
  const base = '/' + path.split('/')[1]
  return PAGE_NAMES_FI[base] ?? path
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'juuri nyt'
  if (m < 60) return `${m} min sitten`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} t sitten`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} pv sitten`
  return new Date(iso).toLocaleDateString('fi-FI')
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-stone-400">—</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'}
        />
      ))}
    </div>
  )
}

export default function FeedbackTab({ rows: initialRows }: Props) {
  const [rows, setRows] = useState<FeedbackRow[]>(initialRows)
  const [filter, setFilter] = useState<FilterKey>('kaikki')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const uudetCount = rows.filter((r) => r.status === 'uusi').length
  const avgRating = rows.length
    ? (rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length).toFixed(1)
    : '—'
  const todayCount = rows.filter((r) => isToday(r.created_at)).length

  const filtered = rows.filter((r) => {
    if (filter === 'kaikki') return true
    if (filter === 'uudet') return r.status === 'uusi'
    if (filter === 'bugi') return r.category === 'bugi'
    if (filter === 'parannus') return r.category === 'parannus' || r.category === 'puuttuva_ominaisuus'
    if (filter === 'kiitos') return r.category === 'kiitos'
    return true
  })

  async function updateStatus(id: string, status: string) {
    // Optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    )
    setUpdatingId(id)
    try {
      await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
    } catch {
      // Silent failure — optimistic state stays
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-yellow-700/40 bg-yellow-900/20 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-yellow-400">
            <AlertCircle size={12} />
            Uudet palautteet
          </div>
          <p className="text-3xl font-bold text-white">{uudetCount}</p>
        </div>
        <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
            <MessageSquare size={12} />
            Yhteensä
          </div>
          <p className="text-3xl font-bold text-white">{rows.length}</p>
        </div>
        <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
            <Star size={12} />
            Keskiarvo
          </div>
          <p className="text-3xl font-bold text-white">{avgRating}</p>
        </div>
        <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
            <Clock size={12} />
            Tänään
          </div>
          <p className="text-3xl font-bold text-white">{todayCount}</p>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ id, label }) => {
          const count =
            id === 'uudet' ? rows.filter((r) => r.status === 'uusi').length
            : id === 'bugi' ? rows.filter((r) => r.category === 'bugi').length
            : id === 'parannus' ? rows.filter((r) => r.category === 'parannus' || r.category === 'puuttuva_ominaisuus').length
            : id === 'kiitos' ? rows.filter((r) => r.category === 'kiitos').length
            : rows.length

          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === id
                  ? 'bg-green-700 text-white'
                  : 'border border-green-800 text-green-400 hover:border-green-600 hover:text-green-300'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  filter === id ? 'bg-green-600 text-white' : 'bg-green-900 text-green-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-green-600">Ei palautteita.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const cat = CATEGORY_STYLE[row.category ?? 'yleinen'] ?? CATEGORY_STYLE.yleinen
            return (
              <div
                key={row.id}
                className={`rounded-xl border bg-white/5 p-4 ${
                  row.status === 'uusi' ? 'border-yellow-700/50' : 'border-green-800'
                }`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  {/* Left: rating + category + message */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={row.rating} />
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.className}`}>
                        {cat.label}
                      </span>
                      {row.status === 'uusi' && (
                        <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-bold text-yellow-300">
                          UUSI
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-white">
                      {row.message}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-green-600">
                      <span>Sivu: <span className="text-green-400">{pageNameFi(row.page)}</span></span>
                      {row.full_name && (
                        <span>
                          Lähettäjä: <span className="text-green-400">{row.full_name}</span>
                          {row.club_name && <span className="text-green-700"> · {row.club_name}</span>}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {relativeTime(row.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right: status dropdown */}
                  <div className="shrink-0">
                    <select
                      value={row.status}
                      disabled={updatingId === row.id}
                      onChange={(e) => updateStatus(row.id, e.target.value)}
                      className={`cursor-pointer rounded-lg border-0 px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        STATUS_STYLE[row.status] ?? 'bg-stone-100 text-stone-600'
                      } disabled:opacity-60`}
                    >
                      {STATUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
