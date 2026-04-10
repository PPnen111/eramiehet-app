import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifySuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as { role: string } | null)?.role !== 'superadmin') return null
  return user
}

const PLAN_PRICES: Record<string, number> = { start: 22500, plus: 39500, pro: 62500 }

export async function GET() {
  if (!(await verifySuperadmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const yearStart = `${new Date().getFullYear()}-01-01`
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [{ data: subs }, { data: invoices }, { data: expenses }, { data: goals }, { data: clubs }] = await Promise.all([
    admin.from('subscriptions').select('club_id, status, plan, price_per_year'),
    admin.from('jahtipro_invoices').select('*').order('created_at', { ascending: false }),
    admin.from('budget_expenses').select('*').order('month', { ascending: false }),
    admin.from('budget_goals').select('*').order('year, month'),
    admin.from('clubs').select('id'),
  ])

  const subList = (subs ?? []) as { club_id: string; status: string; plan: string | null; price_per_year: number | null }[]
  const invoiceList = (invoices ?? []) as { id: string; club_id: string; plan: string; amount_cents: number; status: string; paid_at: string | null }[]
  const expenseList = (expenses ?? []) as { id: string; category: string; name: string; amount_cents: number; recurring: string; month: string; notes: string | null; created_at: string }[]
  const goalList = (goals ?? []) as { id: string; year: number; month: number; target_clubs: number; target_mrr_cents: number; target_arr_cents: number }[]

  // Revenue
  const activeSubs = subList.filter((s) => s.status === 'active')
  const arrCents = activeSubs.reduce((sum, s) => sum + (s.price_per_year ?? 0), 0)
  const mrrCents = Math.round(arrCents / 12)

  const byPlan: Record<string, { count: number; arr_cents: number }> = { start: { count: 0, arr_cents: 0 }, plus: { count: 0, arr_cents: 0 }, pro: { count: 0, arr_cents: 0 } }
  for (const s of activeSubs) {
    const p = s.plan ?? 'start'
    if (byPlan[p]) {
      byPlan[p].count++
      byPlan[p].arr_cents += s.price_per_year ?? PLAN_PRICES[p] ?? 0
    }
  }

  const paidThisYear = invoiceList.filter((i) => i.status === 'paid' && i.paid_at && i.paid_at >= yearStart).reduce((s, i) => s + i.amount_cents, 0)
  const pendingCents = invoiceList.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount_cents, 0)
  const overdueCents = invoiceList.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount_cents, 0)

  // Expenses
  const thisMonthExpenses = expenseList.filter((e) => e.month?.slice(0, 7) === currentMonth || e.recurring === 'kuukausittain')
  const thisMonthCents = thisMonthExpenses.reduce((s, e) => s + e.amount_cents, 0)
  const thisYearCents = expenseList.filter((e) => {
    if (e.recurring === 'kuukausittain') return true
    if (e.recurring === 'vuosittain') return true
    return e.month >= yearStart
  }).reduce((s, e) => {
    if (e.recurring === 'kuukausittain') return s + e.amount_cents * 12
    return s + e.amount_cents
  }, 0)

  const catMap = new Map<string, number>()
  for (const e of thisMonthExpenses) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount_cents)
  }

  // Profitability
  const burnRate = thisMonthCents
  const grossProfit = mrrCents - burnRate
  const avgPlanPrice = Object.values(PLAN_PRICES).reduce((a, b) => a + b, 0) / 3
  const breakEvenClubs = burnRate > 0 ? Math.ceil(burnRate / (avgPlanPrice / 12)) : 0
  const runwayMonths = burnRate > 0 && mrrCents < burnRate ? 0 : 999

  // Forecast
  const forecast = goalList.map((g) => {
    const actual_clubs = (clubs ?? []).length
    return {
      month: `${g.year}-${String(g.month).padStart(2, '0')}`,
      target_clubs: g.target_clubs,
      target_mrr_cents: g.target_mrr_cents,
      actual_clubs: g.year === new Date().getFullYear() && g.month === new Date().getMonth() + 1 ? actual_clubs : null,
      actual_mrr_cents: g.year === new Date().getFullYear() && g.month === new Date().getMonth() + 1 ? mrrCents : null,
    }
  })

  return NextResponse.json({
    revenue: { mrr_cents: mrrCents, arr_cents: arrCents, paid_this_year_cents: paidThisYear, pending_cents: pendingCents, overdue_cents: overdueCents, by_plan: byPlan },
    expenses: { this_month_cents: thisMonthCents, this_year_cents: thisYearCents, by_category: Array.from(catMap.entries()).map(([category, total_cents]) => ({ category, total_cents })), items: expenseList },
    profitability: { gross_profit_cents: grossProfit, burn_rate_cents: burnRate, runway_months: runwayMonths, break_even_clubs: breakEvenClubs },
    goals: goalList,
    forecast,
  })
}
