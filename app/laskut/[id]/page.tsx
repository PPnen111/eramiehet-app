import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isBoardOrAbove } from '@/lib/auth'
import PrintButton from './print-button'

type PaymentRow = {
  id: string
  club_id: string
  profile_id: string
  description: string
  amount_cents: number
  due_date: string | null
  reference_number: string | null
  payment_type: string | null
  payment_method: string | null
  additional_info: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  club_id: string | null
  role: string | null
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const paymentMethodLabel: Record<string, string> = {
  tilisiirto: 'Tilisiirto',
  käteinen: 'Käteinen',
  muu: 'Muu',
}

const paymentTypeLabel: Record<string, string> = {
  jäsenmaksu: 'Jäsenmaksu',
  liittymismaksu: 'Liittymismaksu',
  jahtimaksu: 'Jahtimaksu',
  vieraslupa: 'Vieraslupa',
  eräkartano: 'Eräkartano',
  muu: 'Muu',
}

export default async function LaskuPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('id, full_name, club_id, role')
    .eq('id', user.id)
    .single()
  const caller = callerRaw as unknown as ProfileRow | null

  const { data: paymentRaw } = await supabase
    .from('payments')
    .select(
      'id, club_id, profile_id, description, amount_cents, due_date, reference_number, payment_type, payment_method, additional_info'
    )
    .eq('id', id)
    .single()
  const payment = paymentRaw as unknown as PaymentRow | null

  if (!payment) redirect('/dashboard')

  // Access: owner or board/admin of the same club
  const isOwner = user.id === payment.profile_id
  const isClubAdmin =
    caller?.club_id === payment.club_id && isBoardOrAbove(caller?.role)
  if (!isOwner && !isClubAdmin) redirect('/dashboard')

  // Fetch member profile
  const { data: memberRaw } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', payment.profile_id)
    .single()
  const member = memberRaw as unknown as { id: string; full_name: string | null } | null

  // Fetch club name
  const { data: clubRaw } = await supabase
    .from('clubs')
    .select('name')
    .eq('id', payment.club_id)
    .single()
  const clubName = (clubRaw as { name: string } | null)?.name ?? 'Metsästysseura'

  const today = new Date().toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const refNum = payment.reference_number ?? payment.id.slice(0, 12).toUpperCase()
  const memberId = member?.id.slice(0, 8).toUpperCase() ?? '—'

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print-hide { display: none !important; }
          .invoice-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">
        {/* Back link – hidden when printing */}
        <div className="print-hide mb-4 mx-auto max-w-2xl">
          <Link href="/hallinto" className="text-sm text-green-700 hover:text-green-900">
            ← Hallinto
          </Link>
        </div>

        {/* Invoice card */}
        <div className="invoice-card mx-auto max-w-2xl rounded-2xl bg-white shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-950 px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-green-400">Lasku</p>
                <h1 className="mt-1 text-2xl font-bold text-white">{clubName}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400">Päivämäärä</p>
                <p className="text-sm font-medium text-white">{today}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Viitenumero */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Viitenumero</span>
              <span className="font-mono text-sm font-semibold text-gray-900 tracking-wider">{refNum}</span>
            </div>

            {/* Vastaanottaja */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Vastaanottaja</p>
              <p className="text-lg font-semibold text-gray-900">{member?.full_name ?? '—'}</p>
              <p className="text-sm text-gray-500">Jäsen ID: {memberId}</p>
            </div>

            {/* Invoice table */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left font-medium text-gray-500">Kuvaus</th>
                    <th className="pb-2 text-center font-medium text-gray-500">Määrä</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Summa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">
                      <span>{payment.description}</span>
                      {payment.payment_type && (
                        <span className="ml-2 text-xs text-gray-400">
                          ({paymentTypeLabel[payment.payment_type] ?? payment.payment_type})
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center text-gray-700">1</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatEuros(payment.amount_cents)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 flex justify-between border-t-2 border-gray-900 pt-3">
                <span className="font-semibold text-gray-900">Yhteensä</span>
                <span className="text-lg font-bold text-gray-900">{formatEuros(payment.amount_cents)}</span>
              </div>
            </div>

            {/* Payment details */}
            <div className="rounded-lg bg-gray-50 px-4 py-4 space-y-2">
              {payment.due_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Eräpäivä</span>
                  <span className="font-medium text-gray-900">{formatDate(payment.due_date)}</span>
                </div>
              )}
              {payment.payment_method && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Maksutapa</span>
                  <span className="font-medium text-gray-900">
                    {paymentMethodLabel[payment.payment_method] ?? payment.payment_method}
                  </span>
                </div>
              )}
              {payment.additional_info && (
                <div className="border-t border-gray-200 pt-2 text-sm">
                  <span className="text-gray-500">Lisätiedot: </span>
                  <span className="text-gray-800">{payment.additional_info}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4">
            <p className="text-center text-xs text-gray-400">Erämiesten App</p>
          </div>
        </div>

        {/* Print button */}
        <div className="print-hide mx-auto mt-6 max-w-2xl flex justify-center">
          <PrintButton />
        </div>
      </main>
    </>
  )
}
