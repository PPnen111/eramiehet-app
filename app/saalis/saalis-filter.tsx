'use client'

import { useState, useMemo } from 'react'
import { Target } from 'lucide-react'
import DeleteSaalisButton from './delete-saalis-button'
import { formatDate } from '@/lib/format'

type SaalisRow = {
  id: string
  elain: string
  maara: number
  sukupuoli: string
  ika_luokka: string
  paikka: string | null
  kuvaus: string | null
  pvm: string
  profile_id: string
  reporter_name: string | null
}

interface Props {
  saaliset: SaalisRow[]
  userId: string
  isAdmin: boolean
  elainLabels: Record<string, string>
  elainBadge: Record<string, string>
}

const sukupuoliLabel: Record<string, string> = {
  uros: 'Uros',
  naaras: 'Naaras',
  tuntematon: '',
}

const ikaLabel: Record<string, string> = {
  vasa: 'Vasa',
  nuori: 'Nuori',
  aikuinen: 'Aikuinen',
  tuntematon: '',
}

export default function SaalisFilter({ saaliset, userId, isAdmin, elainLabels, elainBadge }: Props) {
  const [elainFilter, setElainFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [paikkaFilter, setPaikkaFilter] = useState('')

  const years = useMemo(() => {
    const set = new Set(saaliset.map((s) => String(new Date(s.pvm).getFullYear())))
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [saaliset])

  const elainOptions = useMemo(() => {
    const set = new Set(saaliset.map((s) => s.elain))
    return Array.from(set).sort((a, b) => (elainLabels[a] ?? a).localeCompare(elainLabels[b] ?? b, 'fi'))
  }, [saaliset, elainLabels])

  const filtered = useMemo(() => {
    return saaliset.filter((s) => {
      if (elainFilter && s.elain !== elainFilter) return false
      if (yearFilter && String(new Date(s.pvm).getFullYear()) !== yearFilter) return false
      if (paikkaFilter && !(s.paikka ?? '').toLowerCase().includes(paikkaFilter.toLowerCase())) return false
      return true
    })
  }, [saaliset, elainFilter, yearFilter, paikkaFilter])

  const hasFilters = elainFilter || yearFilter || paikkaFilter

  const thisYear = new Date().getFullYear()
  const thisYearSaalis = filtered.filter((s) => new Date(s.pvm).getFullYear() === thisYear)
  const olderSaalis = filtered.filter((s) => new Date(s.pvm).getFullYear() < thisYear)

  const renderRow = (s: SaalisRow, compact = false) => (
    <div
      key={s.id}
      className={compact
        ? 'rounded-xl border border-green-900 bg-white/[0.03] p-3 opacity-60'
        : 'rounded-2xl border border-green-800 bg-white/5 p-4'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          {compact ? (
            <>
              <p className="font-medium text-white">
                {elainLabels[s.elain] ?? s.elain}
                {s.maara > 1 && ` (${s.maara} kpl)`}
              </p>
              <p className="text-xs text-green-500">
                {formatDate(s.pvm)}
                {s.reporter_name && ` — ${s.reporter_name}`}
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${elainBadge[s.elain] ?? 'bg-stone-700 text-stone-200'}`}>
                  {elainLabels[s.elain] ?? s.elain}
                </span>
                {s.maara > 1 && <span className="text-xs text-green-400">{s.maara} kpl</span>}
                {sukupuoliLabel[s.sukupuoli] && (
                  <span className="text-xs text-green-500">{sukupuoliLabel[s.sukupuoli]}</span>
                )}
                {ikaLabel[s.ika_luokka] && (
                  <span className="text-xs text-green-500">{ikaLabel[s.ika_luokka]}</span>
                )}
              </div>
              <p className="text-sm text-green-300">
                {formatDate(s.pvm)}
                {s.reporter_name && <span className="ml-2 text-green-500">— {s.reporter_name}</span>}
              </p>
              {s.paikka && <p className="text-xs text-green-500">📍 {s.paikka}</p>}
              {s.kuvaus && <p className="mt-1 text-sm text-green-400">{s.kuvaus}</p>}
            </>
          )}
        </div>
        {(isAdmin || s.profile_id === userId) && (
          <DeleteSaalisButton saalisId={s.id} />
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={elainFilter}
          onChange={(e) => setElainFilter(e.target.value)}
          className="rounded-lg border border-green-800 bg-green-950 px-2 py-1.5 text-xs text-white outline-none focus:border-green-500"
        >
          <option value="">Kaikki eläimet</option>
          {elainOptions.map((e) => (
            <option key={e} value={e}>{elainLabels[e] ?? e}</option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-lg border border-green-800 bg-green-950 px-2 py-1.5 text-xs text-white outline-none focus:border-green-500"
        >
          <option value="">Kaikki vuodet</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <input
          type="text"
          value={paikkaFilter}
          onChange={(e) => setPaikkaFilter(e.target.value)}
          placeholder="Hae paikkaa..."
          className="rounded-lg border border-green-800 bg-green-950 px-2 py-1.5 text-xs text-white placeholder-green-700 outline-none focus:border-green-500"
        />

        {hasFilters && (
          <button
            onClick={() => { setElainFilter(''); setYearFilter(''); setPaikkaFilter('') }}
            className="rounded-lg border border-green-800 px-2 py-1.5 text-xs text-green-500 hover:text-green-300 transition-colors"
          >
            Tyhjennä
          </button>
        )}
      </div>

      {hasFilters ? (
        // Filtered view — flat list
        filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-green-900 bg-white/[0.02] py-10 text-center">
            <Target size={32} className="text-green-700" strokeWidth={1.5} />
            <p className="text-sm text-green-600">Ei tuloksia.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => renderRow(s, false))}
          </div>
        )
      ) : (
        // Default view — split by year
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
              {thisYear}
            </h2>
            {thisYearSaalis.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-green-900 bg-white/[0.02] py-10 text-center">
                <Target size={32} className="text-green-700" strokeWidth={1.5} />
                <p className="text-sm text-green-600">Ei saalisilmoituksia tänä vuonna.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {thisYearSaalis.map((s) => renderRow(s, false))}
              </div>
            )}
          </section>

          {olderSaalis.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-600">
                Aiemmat
              </h2>
              <div className="space-y-2">
                {olderSaalis.slice(0, 10).map((s) => renderRow(s, true))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
