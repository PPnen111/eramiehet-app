'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

/* ── Tyylit (sama tumma teema kuin Dashboard.tsx) ─────────────────────── */
const BG = '#0c0f14'
const CARD = '#141922'
const BORDER = '#232a36'
const ACCENT = '#3ddc97' // vihreä korostus
const TARGET = '#ffd54a' // keltainen tavoiteviiva
const MUTED = '#8b97a7'

/* ── Tyypit ───────────────────────────────────────────────────────────── */
type Project = {
  id: string
  name: string
  mrr: number
  customers: number
  mau: number
  monthlyCost: number
}

type FiSettings = {
  netWorth: number
  monthlySavings: number
  annualExpenses: number
  expectedReturnPct: number // % / v (0–12)
  saasGrowthPct: number // % / v (0–50)
}

type ProjectLatestRow = {
  id: string | null
  name: string | null
  mrr: number | null
  customers: number | null
  mau: number | null
  monthly_cost: number | null
}

type FiSettingsRow = {
  net_worth: number | null
  monthly_savings: number | null
  annual_expenses: number | null
  expected_return: number | null
  saas_growth: number | null
}

const SIM_YEARS = 14

/* ── Oletusarvot (käytetään jos Supabase-haku epäonnistuu) ────────────── */
const DEFAULT_PROJECTS: Project[] = [
  { id: 'p1', name: 'AutoArvio', mrr: 0, customers: 0, mau: 0, monthlyCost: 0 },
  { id: 'p2', name: 'JahtiPro', mrr: 0, customers: 0, mau: 0, monthlyCost: 0 },
  { id: 'p3', name: 'Tukitulkki', mrr: 0, customers: 0, mau: 0, monthlyCost: 0 },
]

const DEFAULT_FI: FiSettings = {
  netWorth: 65000,
  monthlySavings: 1400,
  annualExpenses: 36000,
  expectedReturnPct: 6,
  saasGrowthPct: 15,
}

/* ── Apurit ───────────────────────────────────────────────────────────── */
const eurFmt = new Intl.NumberFormat('fi-FI', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const eur = (n: number) => eurFmt.format(Math.round(n))
const num = (v: number | null | undefined) => (typeof v === 'number' && isFinite(v) ? v : 0)

/* ── FI-simulaatio ────────────────────────────────────────────────────── */
type SimResult = {
  monthly: number[] // nettovarallisuus kuukausittain, pituus SIM_YEARS*12 + 1
  fiNumber: number
  forecast: number // ennuste SIM_YEARS vuoden päästä
  yearsToFi: number | null // vuosia FI:hin, tai null jos ei saavuteta
}

function simulate(fi: FiSettings, saasNetPerMonth: number): SimResult {
  const monthlyRate = fi.expectedReturnPct / 100 / 12
  const saasGrowth = fi.saasGrowthPct / 100
  const fiNumber = fi.annualExpenses * 25

  let nw = fi.netWorth
  let saasMonthly = saasNetPerMonth
  const monthly: number[] = [nw]
  let yearsToFi: number | null = nw >= fiNumber ? 0 : null

  const totalMonths = SIM_YEARS * 12
  for (let m = 1; m <= totalMonths; m++) {
    // Joka kuukausi: tuotto nykyiselle varallisuudelle + kk-säästö + SaaSin nettotuotto/kk
    nw = nw + nw * monthlyRate + fi.monthlySavings + saasMonthly
    monthly.push(nw)

    if (yearsToFi === null && nw >= fiNumber) {
      yearsToFi = Math.round((m / 12) * 10) / 10
    }

    // SaaS-nettotuotto kasvaa vuosittain SaaS-kasvuprosentilla
    if (m % 12 === 0) {
      saasMonthly = saasMonthly * (1 + saasGrowth)
    }
  }

  return { monthly, fiNumber, forecast: nw, yearsToFi }
}

/* ── Kasvukäyrä (kevyt inline-SVG) ────────────────────────────────────── */
function GrowthChart({ monthly, fiNumber }: { monthly: number[]; fiNumber: number }) {
  const W = 800
  const H = 300
  const PAD = 8
  const maxY = Math.max(fiNumber, ...monthly, 1) * 1.05
  const n = monthly.length

  const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - (v / maxY) * (H - PAD * 2)

  const line = monthly.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(n - 1).toFixed(1)},${(H - PAD).toFixed(1)} L${x(0).toFixed(1)},${(H - PAD).toFixed(1)} Z`
  const fiY = y(fiNumber)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: 220, display: 'block' }}
      role="img"
      aria-label="Nettovarallisuuden kasvukäyrä ja FI-tavoiteviiva"
    >
      <defs>
        <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.28" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Vuosiruudukko */}
      {Array.from({ length: SIM_YEARS + 1 }, (_, yr) => {
        const gx = x(yr * 12)
        return <line key={yr} x1={gx} y1={PAD} x2={gx} y2={H - PAD} stroke={BORDER} strokeWidth={1} />
      })}

      {/* Täyttö + käyrä */}
      <path d={area} fill="url(#nwFill)" />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />

      {/* FI-tavoiteviiva */}
      <line
        x1={PAD}
        y1={fiY}
        x2={W - PAD}
        y2={fiY}
        stroke={TARGET}
        strokeWidth={2}
        strokeDasharray="6 5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* ── Liukusäädin ──────────────────────────────────────────────────────── */
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm" style={{ color: MUTED }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: ACCENT }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: ACCENT }}
      />
    </div>
  )
}

/* ── Yhteenvetokortti ─────────────────────────────────────────────────── */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
      <p className="text-xs uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: ACCENT }}>
        {value}
      </p>
    </div>
  )
}

/* ── Sivu ─────────────────────────────────────────────────────────────── */
export default function SkenaarioPage() {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS)
  const [fi, setFi] = useState<FiSettings>(DEFAULT_FI)
  const [loading, setLoading] = useState(true)
  const idCounter = useRef(0)

  const nextId = () => {
    idCounter.current += 1
    return `new-${idCounter.current}`
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const supabase = createClient()

        const [projRes, fiRes] = await Promise.all([
          supabase
            .from('salkku_project_latest')
            .select('id, name, mrr, customers, mau, monthly_cost')
            .order('name'),
          supabase
            .from('salkku_fi_settings')
            .select('net_worth, monthly_savings, annual_expenses, expected_return, saas_growth')
            .eq('id', 1)
            .single(),
        ])

        if (!active) return

        if (!projRes.error && projRes.data && projRes.data.length > 0) {
          const rows = projRes.data as unknown as ProjectLatestRow[]
          setProjects(
            rows.map((r, i) => ({
              id: r.id ?? `db-${i}`,
              name: r.name ?? 'Nimetön',
              mrr: num(r.mrr),
              customers: num(r.customers),
              mau: num(r.mau),
              monthlyCost: num(r.monthly_cost),
            })),
          )
        }

        if (!fiRes.error && fiRes.data) {
          const s = fiRes.data as unknown as FiSettingsRow
          setFi({
            netWorth: num(s.net_worth) || DEFAULT_FI.netWorth,
            monthlySavings: num(s.monthly_savings) || DEFAULT_FI.monthlySavings,
            annualExpenses: num(s.annual_expenses) || DEFAULT_FI.annualExpenses,
            expectedReturnPct: s.expected_return != null ? num(s.expected_return) * 100 : DEFAULT_FI.expectedReturnPct,
            saasGrowthPct: s.saas_growth != null ? num(s.saas_growth) * 100 : DEFAULT_FI.saasGrowthPct,
          })
        }
      } catch {
        // Oletusarvot jäävät voimaan — sivu toimii silti.
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  /* ── Projektien muokkaus ──────────────────────────────────────────── */
  function updateProject(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }
  function removeProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }
  function addProject() {
    setProjects((prev) => [
      ...prev,
      { id: nextId(), name: 'Uusi projekti', mrr: 0, customers: 0, mau: 0, monthlyCost: 0 },
    ])
  }

  /* ── Kaikki laskenta selaimessa (päivittyy heti) ──────────────────── */
  const totals = useMemo(() => {
    const mrr = projects.reduce((s, p) => s + p.mrr, 0)
    const cost = projects.reduce((s, p) => s + p.monthlyCost, 0)
    const customers = projects.reduce((s, p) => s + p.customers, 0)
    const netPerMonth = mrr - cost
    return { mrr, cost, customers, netPerMonth, arr: mrr * 12 }
  }, [projects])

  const sim = useMemo(() => simulate(fi, totals.netPerMonth), [fi, totals.netPerMonth])

  const progress = sim.fiNumber > 0 ? Math.min(1, sim.forecast / sim.fiNumber) : 0

  return (
    <main className="min-h-screen px-4 py-8 md:px-8" style={{ background: BG, color: '#e6ebf2' }}>
      <div className="mx-auto max-w-5xl">
        {/* Otsikko + paluulinkki */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Skenaariotyökalu</h1>
            <p className="text-sm" style={{ color: MUTED }}>
              Muokkaa lukuja — kokonaiskuva ja FI-ennuste päivittyvät heti. Mitään ei tallenneta.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors"
            style={{ borderColor: BORDER, color: MUTED }}
          >
            ← Etusivulle
          </Link>
        </div>

        {loading && (
          <p className="mb-4 text-sm" style={{ color: MUTED }}>
            Ladataan aloitusarvoja…
          </p>
        )}

        {/* ── Yhteenvetokortit ────────────────────────────────────────── */}
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="ARR (MRR × 12)" value={eur(totals.arr)} />
          <StatCard label="MRR / kk" value={eur(totals.mrr)} />
          <StatCard label="Nettotuotto / kk" value={eur(totals.netPerMonth)} />
          <StatCard label="Asiakkaat yhteensä" value={String(Math.round(totals.customers))} />
        </section>

        {/* ── Projektitaulukko ────────────────────────────────────────── */}
        <section
          className="mb-8 rounded-2xl border p-4 md:p-5"
          style={{ background: CARD, borderColor: BORDER }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projektit</h2>
            <button
              onClick={addProject}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: ACCENT, color: BG }}
            >
              + Lisää projekti
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ color: MUTED }}>
                  <th className="pb-2 pr-2 text-left font-medium">Nimi</th>
                  <th className="pb-2 px-2 text-right font-medium">MRR (€/kk)</th>
                  <th className="pb-2 px-2 text-right font-medium">Asiakkaat</th>
                  <th className="pb-2 px-2 text-right font-medium">MAU</th>
                  <th className="pb-2 px-2 text-right font-medium">Kulut (€/kk)</th>
                  <th className="pb-2 pl-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateProject(p.id, { name: e.target.value })}
                        className="w-full min-w-[8rem] rounded-md border px-2 py-1.5 outline-none focus:border-[color:var(--accent)]"
                        style={{ background: BG, borderColor: BORDER, color: '#e6ebf2' }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <NumCell value={p.mrr} onChange={(v) => updateProject(p.id, { mrr: v })} />
                    </td>
                    <td className="px-2 py-2">
                      <NumCell value={p.customers} onChange={(v) => updateProject(p.id, { customers: v })} />
                    </td>
                    <td className="px-2 py-2">
                      <NumCell value={p.mau} onChange={(v) => updateProject(p.id, { mau: v })} />
                    </td>
                    <td className="px-2 py-2">
                      <NumCell value={p.monthlyCost} onChange={(v) => updateProject(p.id, { monthlyCost: v })} />
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <button
                        onClick={() => removeProject(p.id)}
                        aria-label={`Poista ${p.name}`}
                        className="rounded-md border px-2 py-1.5 text-xs transition-colors hover:opacity-80"
                        style={{ borderColor: BORDER, color: '#e0736b' }}
                      >
                        Poista
                      </button>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center" style={{ color: MUTED }}>
                      Ei projekteja. Lisää projekti aloittaaksesi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FI-osio ─────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl border p-4 md:p-6"
          style={{ background: CARD, borderColor: BORDER }}
        >
          <h2 className="mb-1 text-lg font-semibold">Taloudellinen itsenäisyys (FI)</h2>
          <p className="mb-5 text-sm" style={{ color: MUTED }}>
            Simulaatio {SIM_YEARS} vuotta kuukausitasolla. SaaSin nettotuotto/kk ({eur(totals.netPerMonth)})
            kasvaa vuosittain SaaS-kasvuprosentilla.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Säätimet */}
            <div className="space-y-4">
              <Slider
                label="Nettovarallisuus"
                value={fi.netWorth}
                min={0}
                max={500000}
                step={5000}
                display={eur(fi.netWorth)}
                onChange={(v) => setFi((f) => ({ ...f, netWorth: v }))}
              />
              <Slider
                label="Kk-säästö"
                value={fi.monthlySavings}
                min={0}
                max={10000}
                step={50}
                display={`${eur(fi.monthlySavings)} / kk`}
                onChange={(v) => setFi((f) => ({ ...f, monthlySavings: v }))}
              />
              <Slider
                label="Vuosikulut"
                value={fi.annualExpenses}
                min={0}
                max={120000}
                step={1000}
                display={`${eur(fi.annualExpenses)} / v`}
                onChange={(v) => setFi((f) => ({ ...f, annualExpenses: v }))}
              />
              <Slider
                label="Vuosituotto-oletus"
                value={fi.expectedReturnPct}
                min={0}
                max={12}
                step={0.1}
                display={`${fi.expectedReturnPct.toFixed(1)} %`}
                onChange={(v) => setFi((f) => ({ ...f, expectedReturnPct: v }))}
              />
              <Slider
                label="SaaS-vuosikasvu"
                value={fi.saasGrowthPct}
                min={0}
                max={50}
                step={1}
                display={`${Math.round(fi.saasGrowthPct)} %`}
                onChange={(v) => setFi((f) => ({ ...f, saasGrowthPct: v }))}
              />
            </div>

            {/* Tulokset */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="FI saavutetaan"
                  value={sim.yearsToFi === null ? `${SIM_YEARS}+ v` : `${sim.yearsToFi} v`}
                />
                <StatCard label="FI-luku (kulut × 25)" value={eur(sim.fiNumber)} />
                <StatCard label={`Ennuste ${SIM_YEARS} v päästä`} value={eur(sim.forecast)} />
                <StatCard label="Edistyminen" value={`${Math.round(progress * 100)} %`} />
              </div>

              {/* Edistymispalkki */}
              <div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full"
                  style={{ background: BORDER }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress * 100}%`, background: ACCENT }}
                  />
                </div>
                <p className="mt-1.5 text-xs" style={{ color: MUTED }}>
                  Ennuste {eur(sim.forecast)} / FI-luku {eur(sim.fiNumber)}
                </p>
              </div>
            </div>
          </div>

          {/* Kasvukäyrä */}
          <div className="mt-6 rounded-xl border p-3" style={{ background: BG, borderColor: BORDER }}>
            <div className="mb-2 flex items-center gap-4 text-xs" style={{ color: MUTED }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-4 rounded" style={{ background: ACCENT }} />
                Nettovarallisuus
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0 w-4"
                  style={{ borderTop: `2px dashed ${TARGET}` }}
                />
                FI-tavoite ({eur(sim.fiNumber)})
              </span>
            </div>
            <GrowthChart monthly={sim.monthly} fiNumber={sim.fiNumber} />
            <div className="mt-1 flex justify-between text-xs" style={{ color: MUTED }}>
              <span>Nyt</span>
              <span>{SIM_YEARS} v</span>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs" style={{ color: MUTED }}>
          Kaikki laskenta tapahtuu selaimessa. Mitään ei tallenneta tietokantaan.
        </p>
      </div>
    </main>
  )
}

/* ── Numeerinen solu ──────────────────────────────────────────────────── */
function NumCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : 0}
      min={0}
      onChange={(e) => {
        const v = Number(e.target.value)
        onChange(Number.isFinite(v) && v >= 0 ? v : 0)
      }}
      className="w-full min-w-[5rem] rounded-md border px-2 py-1.5 text-right outline-none"
      style={{ background: BG, borderColor: BORDER, color: '#e6ebf2' }}
    />
  )
}
