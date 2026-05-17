import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatEuros } from '@/lib/format'

type Payment = {
  id: string
  description: string
  amount_cents: number
  due_date: string | null
  paid_at: string | null
  status: string
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Maksettu', cls: 'bg-[#1e3d1e] text-[#1a1a1a]' },
  pending: { label: 'Odottaa', cls: 'bg-[#fef3c7] text-[#92400e]' },
  overdue: { label: 'Myöhässä', cls: 'bg-[#fef2f2] text-[#991b1b]' },
}


export default async function MaksutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, member_status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">← Takaisin</Link>
          <p className="text-[#1e3d1e]">Profiilia ei löydy.</p>
        </div>
      </main>
    )
  }

  const { data: raw } = await supabase
    .from('payments')
    .select('id, description, amount_cents, due_date, paid_at, status')
    .eq('profile_id', user.id)
    .order('due_date', { ascending: false, nullsFirst: false })

  const payments = (raw ?? []) as Payment[]
  const unpaid = payments.filter((p) => p.status !== 'paid')
  const paid = payments.filter((p) => p.status === 'paid')
  const totalUnpaidCents = unpaid.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0)

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">← Takaisin</Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">Maksut</h1>

        {unpaid.length > 0 && (
          <div className="rounded-2xl border border-[#fcd34d] bg-[#fef3c7] px-4 py-3">
            <p className="text-sm text-[#92400e]">Avoimet maksut yhteensä</p>
            <p className="text-2xl font-bold tracking-tight text-[#1a1a1a]">{formatEuros(totalUnpaidCents)}</p>
          </div>
        )}

        {payments.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#e0d8cc] bg-white/[0.02] py-10 text-center">
            <CreditCard size={32} className="text-[#2d6a2d]" strokeWidth={1.5} />
            <p className="text-sm text-[#888888]">Ei maksuja.</p>
          </div>
        )}

        {unpaid.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
              Avoimet
            </h2>
            <div className="space-y-3">
              {unpaid.map((p) => {
                const cfg = statusConfig[p.status] ?? statusConfig.pending
                return (
                  <div key={p.id} className="rounded-2xl border border-[#e0d8cc] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{p.description}</p>
                        {p.due_date && (
                          <p className="mt-0.5 text-sm text-[#2d6a2d]">
                            Eräpäivä: {formatDate(p.due_date)}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-[#1a1a1a]">{formatEuros(p.amount_cents)}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {paid.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#888888]">
              Maksetut
            </h2>
            <div className="space-y-2">
              {paid.map((p) => (
                <div key={p.id} className="rounded-xl border border-[#e0d8cc] bg-white/[0.03] p-3 opacity-70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#888888]" />
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{p.description}</p>
                        {p.paid_at && (
                          <p className="text-xs text-[#4a4a4a]">Maksettu {formatDate(p.paid_at)}</p>
                        )}
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold text-[#2d6a2d]">
                      {formatEuros(p.amount_cents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
