'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

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

export type InvoicePreviewPayment = {
  id: string
  profile_id: string
  description: string
  amount_cents: number
  due_date: string | null
  reference_number: string | null
  payment_type: string | null
  payment_method: string | null
  additional_info: string | null
}

interface Props {
  payment: InvoicePreviewPayment
  memberName: string | null
  clubName: string
  onClose: () => void
}

export default function InvoicePreviewModal({ payment, memberName, clubName, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const today = new Date().toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const refNum = payment.reference_number ?? payment.id.slice(0, 12).toUpperCase()
  const memberId = payment.profile_id.slice(0, 8).toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header bar */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <span className="text-sm font-semibold text-gray-600">Laskun esikatselu</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Invoice content */}
        <div>
          {/* Invoice header */}
          <div className="bg-green-950 px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-green-400">Lasku</p>
                <h2 className="mt-1 text-2xl font-bold text-white">{clubName}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400">Päivämäärä</p>
                <p className="text-sm font-medium text-white">{today}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Viitenumero */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Viitenumero
              </span>
              <span className="font-mono text-sm font-semibold tracking-wider text-gray-900">
                {refNum}
              </span>
            </div>

            {/* Vastaanottaja */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Vastaanottaja
              </p>
              <p className="text-lg font-semibold text-gray-900">{memberName ?? '—'}</p>
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
                <span className="text-lg font-bold text-gray-900">
                  {formatEuros(payment.amount_cents)}
                </span>
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
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-3">
            <p className="text-center text-xs text-gray-400">Erämiesten App</p>
          </div>
        </div>

        {/* Modal action buttons */}
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <Link
            href={`/laskut/${payment.id}`}
            target="_blank"
            className="flex-1 rounded-lg bg-green-800 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Tulosta
          </Link>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Sulje
          </button>
        </div>
      </div>
    </div>
  )
}
