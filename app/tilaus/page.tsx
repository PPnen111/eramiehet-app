'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PRICING, calculatePrice } from '@/lib/pricing'

type ToastState = { message: string; type: 'success' | 'error' } | null

const FEATURES = [
  'Jäsenrekisteri (rajaton)',
  'Tapahtumakalenteri',
  'Saalisilmoitukset',
  'Eräkartanon varaukset',
  'Laskutus ja maksuseuranta',
  'CSV- ja Excel-jäsentuonti',
  'Dokumenttien hallinta',
  'Vierasluvat',
  'Karttatunnukset',
  'Sähköpostituki',
]

export default function TilausPage() {
  const [memberCount, setMemberCount] = useState(50)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [submitted, setSubmitted] = useState(false)

  const yearPrice = calculatePrice(memberCount)
  const monthlyPrice = (yearPrice / 12).toFixed(2).replace('.', ',')

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactName.trim() || !contactEmail.trim()) {
      showToast('Täytä nimi ja sähköposti', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          plan: 'jahti',
          message: `${memberCount} jäsentä → ${yearPrice} €/v. ${contactMessage.trim()}`.trim(),
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        showToast(data.error ?? 'Lähetys epäonnistui', 'error')
      } else {
        setSubmitted(true)
      }
    } catch {
      showToast('Lähetys epäonnistui', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link href="/dashboard" className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">
          ← Takaisin
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4a4a4a]">
            Tilaus
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1a1a1a]">JahtiPro</h1>
          <p className="mt-2 text-sm text-[#2d6a2d]">
            {PRICING.base} € + {PRICING.perMember} € / jäsen / vuosi · maksimi {PRICING.max} € / vuosi
          </p>
        </div>

        {/* Pricing calculator card */}
        <div className="card-shadow rounded-2xl bg-white p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#2d6a2d]">
                Seuranne jäsenmäärä
              </label>
              <input
                type="range"
                min={1}
                max={300}
                step={1}
                value={memberCount}
                onChange={(e) => setMemberCount(Number(e.target.value) || 0)}
                className="w-full accent-[#2d6a2d]"
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-20 rounded-xl border border-[#e0d8cc] bg-white px-2 py-1 text-sm text-[#1a1a1a] focus:border-[#2d6a2d] focus:outline-none"
                />
                <span className="text-sm text-[#4a4a4a]">jäsentä</span>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-2xl bg-[#f0ebe3] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-[#888888]">Vuosihinta</p>
              <p className="text-4xl font-extrabold tracking-tight text-[#1a1a1a]">{yearPrice} €</p>
              <p className="mt-0.5 text-sm text-[#2d6a2d]">noin {monthlyPrice} €/kk</p>
              <p className="mt-1 text-[10px] text-[#888888]">sis. alv 0%</p>
            </div>
          </div>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#1a1a1a]">
                <Check size={14} className="mt-0.5 shrink-0 text-[#2d6a2d]" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact form */}
        <div className="card-shadow rounded-2xl bg-white p-6">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-[#1a1a1a]">Ota yhteyttä</h2>
          <p className="mb-5 text-sm text-[#2d6a2d]">
            Lähetä meille viesti niin otamme yhteyttä tilauksen aktivoimiseksi.
          </p>

          {submitted ? (
            <div className="rounded-xl bg-[#eaf3de] p-5 text-center">
              <p className="text-lg font-bold text-[#1a1a1a]">Viesti lähetetty!</p>
              <p className="mt-1 text-sm text-[#3b6d11]">
                Otamme sinuun yhteyttä pian.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#2d6a2d]">
                    Nimi *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Matti Metsänen"
                    className="w-full rounded-xl border border-[#e0d8cc] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#888888] focus:border-[#2d6a2d] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#2d6a2d]">
                    Sähköposti *
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="matti@seura.fi"
                    className="w-full rounded-xl border border-[#e0d8cc] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#888888] focus:border-[#2d6a2d] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#2d6a2d]">
                  Lisätietoja (valinnainen)
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={3}
                  placeholder="Seuran nimi, kysymyksiä..."
                  className="w-full rounded-xl border border-[#e0d8cc] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#888888] focus:border-[#2d6a2d] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#1e3d1e] py-3 text-sm font-bold text-white hover:bg-[#162d16] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Lähetetään...' : 'Lähetä yhteydenotto'}
              </button>
            </form>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl ${
            toast.type === 'success' ? 'bg-[#1e3d1e] text-white' : 'bg-[#dc2626] text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  )
}
