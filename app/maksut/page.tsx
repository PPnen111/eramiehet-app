import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Payment = {
  id: string
  payment_type: string
  amount: number
  due_at: string | null
  paid_at: string | null
  status: string
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Maksettu', cls: 'bg-green-800 text-green-200' },
  pending: { label: 'Odottaa', cls: 'bg-yellow-900 text-yellow-200' },
  overdue: { label: 'Myöhässä', cls: 'bg-red-900 text-red-200' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

function formatEuros(amount: number) {
  return amount.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
}

export default async function MaksutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mem } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .single()

  if (!mem) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
            ← Takaisin
          </Link>
          <p className="text-green-300">Et kuulu mihinkään seuraan.</p>
        </div>
      </main>
    )
  }

  const { data: raw } = await supabase
    .from('payments')
    .select('id, payment_type, amount, due_at, paid_at, status')
    .eq('profile_id', user.id)
    .order('due_at', { ascending: false })

  const payments = (raw ?? []) as Payment[]
  const unpaid = payments.filter((p) => p.status !== 'paid')
  const paid = payments.filter((p) => p.status === 'paid')
  const totalUnpaid = unpaid.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>
        <h1 className="text-2xl font-bold text-white">Maksut</h1>

        {unpaid.length > 0 && (
          <div className="rounded-2xl border border-yellow-800 bg-yellow-900/20 px-4 py-3">
            <p className="text-sm text-yellow-300">Avoimet maksut yhteensä</p>
            <p className="text-2xl font-bold text-white">{formatEuros(totalUnpaid)}</p>
          </div>
        )}

        {payments.length === 0 && (
          <p className="text-sm text-green-600">Ei maksuja.</p>
        )}

        {unpaid.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
              Avoimet
            </h2>
            <div className="space-y-3">
              {unpaid.map((p) => {
                const cfg = statusConfig[p.status] ?? statusConfig.pending
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-green-800 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{p.payment_type}</p>
                        {p.due_at && (
                          <p className="mt-0.5 text-sm text-green-400">
                            Eräpäivä: {formatDate(p.due_at)}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-white">{formatEuros(p.amount)}</p>
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
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-600">
              Maksetut
            </h2>
            <div className="space-y-2">
              {paid.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-green-900 bg-white/[0.03] p-3 opacity-70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{p.payment_type}</p>
                      {p.paid_at && (
                        <p className="text-xs text-green-500">
                          Maksettu {formatDate(p.paid_at)}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-semibold text-green-400">
                      {formatEuros(p.amount)}
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
