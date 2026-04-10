'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { InfoTooltip } from '@/app/components/info-tooltip'

type BudgetData = {
  revenue: { mrr_cents: number; arr_cents: number; paid_this_year_cents: number; pending_cents: number; overdue_cents: number; by_plan: Record<string, { count: number; arr_cents: number }> }
  expenses: { this_month_cents: number; this_year_cents: number; by_category: { category: string; total_cents: number }[]; items: Expense[] }
  profitability: { gross_profit_cents: number; burn_rate_cents: number; runway_months: number; break_even_clubs: number }
  goals: { id: string; year: number; month: number; target_clubs: number; target_mrr_cents: number; target_arr_cents: number }[]
  forecast: { month: string; target_clubs: number; target_mrr_cents: number; actual_clubs: number | null; actual_mrr_cents: number | null }[]
}

type Expense = { id: string; category: string; name: string; amount_cents: number; recurring: string; month: string; notes: string | null; created_at: string }
type Invoice = { id: string; club_id: string; plan: string; plan_label: string; amount_cents: number; status: string; due_date: string; billing_email: string | null; paid_at: string | null; created_at: string; notes: string | null }
type ClubOption = { id: string; name: string }
type SubTab = 'yhteenveto' | 'tulot' | 'kulut' | 'ennuste'

const PLANS = [
  { value: 'start', label: 'Jahti Start', cents: 22500 },
  { value: 'plus', label: 'Jahti Plus', cents: 39500 },
  { value: 'pro', label: 'Jahti Pro', cents: 62500 },
]
const EXPENSE_CATS = ['infrastruktuuri', 'markkinointi', 'henkilöstö', 'myynti', 'hallinto', 'muu']
const RECURRINGS = [{ value: 'kertaluonteinen', label: 'Kertaluonteinen' }, { value: 'kuukausittain', label: 'Kuukausittain' }, { value: 'vuosittain', label: 'Vuosittain' }]
const CAT_COLORS: Record<string, string> = { infrastruktuuri: 'bg-blue-500', markkinointi: 'bg-purple-500', 'henkilöstö': 'bg-amber-500', myynti: 'bg-green-500', hallinto: 'bg-stone-500', muu: 'bg-red-500' }

const eur = (cents: number) => (cents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })

interface Props { clubs: ClubOption[] }

export default function BudgetTab({ clubs }: Props) {
  const [sub, setSub] = useState<SubTab>('yhteenveto')
  const [data, setData] = useState<BudgetData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // Forms
  const [expenseForm, setExpenseForm] = useState(false)
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null)
  const [ef, setEf] = useState<Record<string, string | number | null>>({})
  const [invoiceForm, setInvoiceForm] = useState(false)
  const [ivf, setIvf] = useState<Record<string, string | number | null>>({})
  const [busy, setBusy] = useState(false)

  // Forecast scenario
  const [scenNewPerMonth, setScenNewPerMonth] = useState(5)
  const [scenPlan, setScenPlan] = useState('plus')
  const [scenChurn, setScenChurn] = useState(1)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    const [bRes, iRes] = await Promise.all([
      fetch('/api/operator/budget'),
      fetch('/api/operator/budget/invoices').catch(() => null),
    ])
    if (bRes.ok) setData((await bRes.json()) as BudgetData)
    if (iRes?.ok) {
      const j = (await iRes.json()) as { invoices?: Invoice[] }
      setInvoices(j.invoices ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  // Expense CRUD
  const openNewExpense = () => { setEditExpenseId(null); setEf({ name: '', category: 'muu', amount_cents: 0, recurring: 'kertaluonteinen', month: new Date().toISOString().slice(0, 10), notes: '' }); setExpenseForm(true) }
  const openEditExpense = (e: Expense) => { setEditExpenseId(e.id); setEf({ name: e.name, category: e.category, amount_cents: e.amount_cents, recurring: e.recurring, month: e.month, notes: e.notes ?? '' }); setExpenseForm(true) }

  const saveExpense = async () => {
    setBusy(true)
    const url = editExpenseId ? `/api/operator/budget/expenses/${editExpenseId}` : '/api/operator/budget/expenses'
    await fetch(url, { method: editExpenseId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ef, amount_cents: Math.round(Number(ef.amount_cents)) }) })
    setBusy(false); setExpenseForm(false); showToast(editExpenseId ? 'Kulu päivitetty' : 'Kulu lisätty'); void load()
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Poistetaanko kulu?')) return
    await fetch(`/api/operator/budget/expenses/${id}`, { method: 'DELETE' })
    showToast('Kulu poistettu'); void load()
  }

  // Invoice
  const openNewInvoice = () => {
    const plan = PLANS[1]
    setIvf({ club_id: '', plan: plan.value, amount_cents: plan.cents, due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), billing_email: '', billing_period_start: '', billing_period_end: '', notes: '' })
    setInvoiceForm(true)
  }

  const saveInvoice = async () => {
    setBusy(true)
    await fetch('/api/operator/budget/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ivf) })
    setBusy(false); setInvoiceForm(false); showToast('Lasku luotu ja lähetetty'); void load()
  }

  const markInvoicePaid = async (id: string) => {
    await fetch(`/api/operator/budget/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'paid' }) })
    showToast('Merkitty maksetuksi'); void load()
  }

  // Scenario calc
  const scenario = useMemo(() => {
    const avgPrice = PLANS.find((p) => p.value === scenPlan)?.cents ?? 39500
    const monthlyPrice = Math.round(avgPrice / 12)
    const planValues = data?.revenue.by_plan ? Object.values(data.revenue.by_plan) as { count: number; arr_cents: number }[] : []
    const currentClubs = planValues.reduce((s, p) => s + p.count, 0)
    const results: { months: number; clubs: number; mrr: number }[] = []
    let c = currentClubs
    let breakEvenMonth: string | null = null
    const burnRate = data?.profitability.burn_rate_cents ?? 0
    for (let m = 1; m <= 36; m++) {
      c = Math.round(c * (1 - scenChurn / 100) + scenNewPerMonth)
      const mrr = c * monthlyPrice
      if (!breakEvenMonth && mrr >= burnRate && burnRate > 0) {
        const d = new Date(); d.setMonth(d.getMonth() + m)
        breakEvenMonth = d.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })
      }
      if (m === 12 || m === 24 || m === 36) results.push({ months: m, clubs: c, mrr })
    }
    // 500 club estimate
    let m500 = 0; let cc: number = currentClubs
    while (cc < 500 && m500 < 120) { cc = Math.round(cc * (1 - scenChurn / 100) + scenNewPerMonth); m500++ }
    const d500 = new Date(); d500.setMonth(d500.getMonth() + m500)
    return { results, breakEvenMonth, target500: m500 < 120 ? d500.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' }) : 'Ei saavutettavissa' }
  }, [scenNewPerMonth, scenPlan, scenChurn, data])

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectCls = 'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  if (loading || !data) return <p className="text-sm text-green-500">Ladataan...</p>

  const subBtn = (t: SubTab, label: string) => (
    <button onClick={() => setSub(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${sub === t ? 'bg-green-700 text-white' : 'text-green-400 hover:bg-white/10'}`}>{label}</button>
  )

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-xl bg-green-800/60 px-4 py-3 text-sm font-medium text-green-200">{toast}</div>}

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
        {subBtn('yhteenveto', 'Yhteenveto')}
        {subBtn('tulot', 'Tulot')}
        {subBtn('kulut', 'Kulut')}
        {subBtn('ennuste', 'Ennuste')}
      </div>

      {/* ═══ YHTEENVETO ═══ */}
      {sub === 'yhteenveto' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-green-800 bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{data.revenue.mrr_cents > 0 ? eur(data.revenue.mrr_cents) : 'Ei vielä'}</p>
              <p className="mt-0.5 text-[10px] text-green-500">MRR <InfoTooltip title="MRR" content="Kuukausittainen toistuva liikevaihto. Lasketaan: aktiiviset tilaukset / 12. Tärkein SaaS-mittari kasvun seuraamiseen." /></p>
            </div>
            <div className="rounded-xl border border-green-800 bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{data.revenue.arr_cents > 0 ? eur(data.revenue.arr_cents) : 'Ei vielä'}</p>
              <p className="mt-0.5 text-[10px] text-green-500">ARR <InfoTooltip title="ARR" content="Vuosittainen toistuva liikevaihto. MRR × 12. Kertoo palvelun kokonaiskoosta." /></p>
            </div>
            <div className="rounded-xl border border-green-800 bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{eur(data.expenses.this_month_cents)}</p>
              <p className="mt-0.5 text-[10px] text-green-500">Kulut/kk <InfoTooltip title="Burn rate" content="Kuinka paljon rahaa kuluu kuukaudessa kuluja varten. Tärkeä seurata jotta tiedetään kuinka kauan varat riittävät." /></p>
            </div>
            <div className="rounded-xl border border-green-800 bg-white/5 p-3 text-center">
              <p className={`text-lg font-bold ${data.profitability.gross_profit_cents >= 0 ? 'text-green-300' : 'text-red-400'}`}>{eur(data.profitability.gross_profit_cents)}</p>
              <p className="mt-0.5 text-[10px] text-green-500">Käyttökate <InfoTooltip title="Käyttökate" content="MRR miinus kuukausikulut. Jos positiivinen: palvelu tuottaa. Jos negatiivinen: käytät enemmän kuin tienaat (normaalia alkuvaiheessa)." /></p>
            </div>
            <div className="rounded-xl border border-green-800 bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{data.profitability.break_even_clubs} seuraa</p>
              <p className="mt-0.5 text-[10px] text-green-500">Break-even <InfoTooltip title="Break-even" content="Montako seuraa tarvitaan jotta tulot kattavat kulut. Lasketaan: kuukausikulut / keskimääräinen kuukausituotto per seura." /></p>
            </div>
          </div>
          {/* 500 club progress */}
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <h3 className="mb-2 font-semibold text-white">Matka 500 seuraan — 2028 <InfoTooltip title="Kasvupolku" content="Tavoite: 500 maksavaa seuraa vuoden 2028 loppuun mennessä. Sininen = tavoite, vihreä = toteutunut. Perustuu lineaariseen kasvumalliin." /></h3>
            <div className="h-3 rounded-full bg-green-900/40 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min((clubs.length / 500) * 100, 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-green-400">
              {clubs.length} seuraa — {((clubs.length / 500) * 100).toFixed(1)}% tavoitteesta
            </p>
          </div>
        </div>
      )}

      {/* ═══ TULOT ═══ */}
      {sub === 'tulot' && (
        <div className="space-y-4">
          {/* Plan breakdown */}
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">Aktiiviset tilaukset</h3>
            {(Object.values(data.revenue.by_plan) as { count: number; arr_cents: number }[]).every((p) => p.count === 0) ? (
              <p className="text-sm text-green-600">Trialissa — ei laskutusta vielä</p>
            ) : (
              <div className="space-y-2">
                {PLANS.map((p) => {
                  const d = data.revenue.by_plan[p.value]
                  return d?.count > 0 ? (
                    <div key={p.value} className="flex items-center justify-between rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2 text-sm">
                      <span className="text-white">{p.label}</span>
                      <span className="text-green-300">{d.count} seuraa · {eur(d.arr_cents)}/v</span>
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-green-400">JahtiPron laskut</h3>
              <button onClick={openNewInvoice} className="flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"><Plus size={13} /> Luo lasku</button>
            </div>
            {invoices.length === 0 ? <p className="text-sm text-green-600">Ei laskuja.</p> : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2 text-sm">
                    <div>
                      <p className="text-white">{inv.plan_label}</p>
                      <p className="text-xs text-green-500">{clubs.find((c) => c.id === inv.club_id)?.name ?? '—'} · {inv.due_date ? formatDate(inv.due_date) : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{eur(inv.amount_cents)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === 'paid' ? 'bg-green-800 text-green-200' : inv.status === 'overdue' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>{inv.status === 'paid' ? 'Maksettu' : inv.status === 'overdue' ? 'Myöhässä' : 'Odottaa'}</span>
                      {inv.status !== 'paid' && (
                        <button onClick={() => void markInvoicePaid(inv.id)} className="rounded-md p-1 text-green-600 hover:text-green-300" title="Merkitse maksetuksi"><Check size={14} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ KULUT ═══ */}
      {sub === 'kulut' && (
        <div className="space-y-4">
          {/* Category breakdown bar */}
          {data.expenses.by_category.length > 0 && (
            <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">Kuukausikulut yhteenveto</h3>
              <div className="flex h-4 rounded-full overflow-hidden bg-green-900/40">
                {data.expenses.by_category.map((c) => {
                  const pct = data.expenses.this_month_cents > 0 ? (c.total_cents / data.expenses.this_month_cents) * 100 : 0
                  return <div key={c.category} className={`${CAT_COLORS[c.category] ?? 'bg-stone-500'}`} style={{ width: `${pct}%` }} title={`${c.category}: ${eur(c.total_cents)}`} />
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {data.expenses.by_category.map((c) => (
                  <div key={c.category} className="flex items-center gap-1.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${CAT_COLORS[c.category] ?? 'bg-stone-500'}`} />
                    <span className="text-green-300">{c.category}: {eur(c.total_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense list */}
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-green-400">Kulukirjaukset</h3>
              <button onClick={openNewExpense} className="flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"><Plus size={13} /> Lisää kulu</button>
            </div>
            {data.expenses.items.length === 0 ? <p className="text-sm text-green-600">Ei kuluja.</p> : (
              <div className="space-y-2">
                {data.expenses.items.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2 text-sm">
                    <div>
                      <p className="text-white">{e.name}</p>
                      <p className="text-xs text-green-500">{e.category} · {RECURRINGS.find((r) => r.value === e.recurring)?.label ?? e.recurring}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{eur(e.amount_cents)}</span>
                      <button onClick={() => openEditExpense(e)} className="rounded-md p-1 text-green-600 hover:text-green-300"><Pencil size={13} /></button>
                      <button onClick={() => void deleteExpense(e.id)} className="rounded-md p-1 text-red-500 hover:text-red-300"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ENNUSTE ═══ */}
      {sub === 'ennuste' && (
        <div className="space-y-4">
          {/* Scenario analysis */}
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">Skenaarioanalyysi <InfoTooltip title="Skenaarioanalyysi" content={['Uusia seuroja/kk: kuinka monta uutta maksavaa asiakasta arvioit saavasi kuukaudessa', 'Keskipaketti: minkä paketin asiakkaat valitsevat keskimäärin', 'Churn: montako % asiakkaista lähtee kuukaudessa', 'Tulokset päivittyvät reaaliajassa liukusäätimiä muuttamalla']} /></h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className={labelCls}>Uusia seuroja/kk</label>
                <input type="number" value={scenNewPerMonth} onChange={(e) => setScenNewPerMonth(Number(e.target.value) || 0)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Keskipaketti</label>
                <select value={scenPlan} onChange={(e) => setScenPlan(e.target.value)} className={selectCls}>
                  {PLANS.map((p) => <option key={p.value} value={p.value}>{p.label} ({eur(p.cents)}/v)</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Churn %/kk <InfoTooltip title="Churn %" content="Kuinka moni asiakkaista lopettaa palvelun käytön kuukaudessa. 1% churn = 100 seurasta 1 lähtee/kk. Hyvä SaaS-churn on alle 2%/kk." /></label>
                <input type="number" value={scenChurn} onChange={(e) => setScenChurn(Number(e.target.value) || 0)} min={0} max={50} className={inputCls} />
              </div>
            </div>

            <div className="space-y-2">
              {scenario.results.map((r) => (
                <div key={r.months} className="flex items-center justify-between rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2 text-sm">
                  <span className="text-green-400">{r.months} kk</span>
                  <span className="text-white"><span className="font-semibold">{r.clubs}</span> seuraa · <span className="font-semibold">{eur(r.mrr)}</span>/kk MRR</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-green-700/50 bg-green-900/20 px-3 py-2 text-sm">
                <span className="text-green-300">Break-even</span>
                <span className="text-white font-semibold">{scenario.breakEvenMonth ?? 'Jo kannattava'}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-green-700/50 bg-green-900/20 px-3 py-2 text-sm">
                <span className="text-green-300">500 seuraa</span>
                <span className="text-white font-semibold">{scenario.target500}</span>
              </div>
            </div>
          </div>

          {/* Forecast table */}
          {data.forecast.length > 0 && (
            <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">Kasvupolku</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-green-800">
                      <th className="px-3 py-2 text-left text-xs text-green-400">Kuukausi</th>
                      <th className="px-3 py-2 text-center text-xs text-green-400">Tavoite</th>
                      <th className="px-3 py-2 text-center text-xs text-green-400">Tavoite MRR</th>
                      <th className="px-3 py-2 text-center text-xs text-green-400">Toteutunut</th>
                      <th className="px-3 py-2 text-center text-xs text-green-400">Toteutunut MRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast.map((f, i) => (
                      <tr key={i} className="border-b border-green-900/30">
                        <td className="px-3 py-2 text-white">{f.month}</td>
                        <td className="px-3 py-2 text-center text-green-300">{f.target_clubs}</td>
                        <td className="px-3 py-2 text-center text-green-300">{eur(f.target_mrr_cents)}</td>
                        <td className="px-3 py-2 text-center text-white">{f.actual_clubs ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-white">{f.actual_mrr_cents !== null ? eur(f.actual_mrr_cents) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expense form */}
      {expenseForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setExpenseForm(false)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editExpenseId ? 'Muokkaa kulua' : 'Lisää kulu'}</h2>
              <button onClick={() => setExpenseForm(false)} className="rounded-lg p-1.5 text-green-400 hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className={labelCls}>Nimi *</label><input type="text" value={(ef.name as string) ?? ''} onChange={(e) => setEf((f) => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Kategoria</label><select value={(ef.category as string) ?? 'muu'} onChange={(e) => setEf((f) => ({ ...f, category: e.target.value }))} className={selectCls}>{EXPENSE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className={labelCls}>Summa (senttiä)</label><input type="number" value={ef.amount_cents ?? 0} onChange={(e) => setEf((f) => ({ ...f, amount_cents: Number(e.target.value) }))} className={inputCls} /><p className="mt-0.5 text-[10px] text-green-600">{eur(Number(ef.amount_cents) || 0)}</p></div>
              <div><label className={labelCls}>Toistuvuus</label><select value={(ef.recurring as string) ?? 'kertaluonteinen'} onChange={(e) => setEf((f) => ({ ...f, recurring: e.target.value }))} className={selectCls}>{RECURRINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
              <div><label className={labelCls}>Kuukausi</label><input type="date" value={(ef.month as string) ?? ''} onChange={(e) => setEf((f) => ({ ...f, month: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Muistiinpanot</label><textarea value={(ef.notes as string) ?? ''} onChange={(e) => setEf((f) => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls} /></div>
              <button onClick={() => void saveExpense()} disabled={busy} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Tallennetaan...' : 'Tallenna'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice form */}
      {invoiceForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setInvoiceForm(false)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Luo lasku</h2>
              <button onClick={() => setInvoiceForm(false)} className="rounded-lg p-1.5 text-green-400 hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className={labelCls}>Seura *</label><select value={(ivf.club_id as string) ?? ''} onChange={(e) => setIvf((f) => ({ ...f, club_id: e.target.value }))} className={selectCls}><option value="">Valitse...</option>{clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className={labelCls}>Paketti</label><select value={(ivf.plan as string) ?? 'plus'} onChange={(e) => { const p = PLANS.find((pp) => pp.value === e.target.value); setIvf((f) => ({ ...f, plan: e.target.value, amount_cents: p?.cents ?? 0 })) }} className={selectCls}>{PLANS.map((p) => <option key={p.value} value={p.value}>{p.label} ({eur(p.cents)})</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Kausi alku</label><input type="date" value={(ivf.billing_period_start as string) ?? ''} onChange={(e) => setIvf((f) => ({ ...f, billing_period_start: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Kausi loppu</label><input type="date" value={(ivf.billing_period_end as string) ?? ''} onChange={(e) => setIvf((f) => ({ ...f, billing_period_end: e.target.value }))} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Eräpäivä</label><input type="date" value={(ivf.due_date as string) ?? ''} onChange={(e) => setIvf((f) => ({ ...f, due_date: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Laskutusosoite (sähköposti)</label><input type="email" value={(ivf.billing_email as string) ?? ''} onChange={(e) => setIvf((f) => ({ ...f, billing_email: e.target.value }))} className={inputCls} placeholder="seura@esimerkki.fi" /></div>
              <div><label className={labelCls}>Muistiinpanot</label><textarea value={(ivf.notes as string) ?? ''} onChange={(e) => setIvf((f) => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls} /></div>
              <button onClick={() => void saveInvoice()} disabled={busy || !(ivf.club_id as string)} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Tallennetaan...' : 'Luo ja lähetä'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
