'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'perus',
    name: 'Perus',
    price: 249,
    monthly: 21,
    description: 'Pienille seuroille',
    features: [
      'Jäsenrekisteri (enintään 30 jäsentä)',
      'Tapahtumakalenteri',
      'Saalisilmoitukset',
      'Eräkartanon varaukset',
      'Sähköpostituki',
    ],
  },
  {
    id: 'standardi',
    name: 'Standardi',
    price: 399,
    monthly: 33,
    description: 'Suosituin valinta',
    highlight: true,
    features: [
      'Jäsenrekisteri (enintään 100 jäsentä)',
      'Tapahtumakalenteri',
      'Saalisilmoitukset',
      'Eräkartanon varaukset',
      'Laskutus ja maksuseuranta',
      'CSV-jäsentuonti',
      'Dokumenttien hallinta',
      'Prioriteettituki',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 599,
    monthly: 50,
    description: 'Suurille seuroille',
    features: [
      'Rajoittamaton jäsenmäärä',
      'Kaikki Standardi-ominaisuudet',
      'Monipaikkainen jaostorakenne',
      'Räätälöity raportointi',
      'Puhelintuki',
      'Käyttöönottoapu',
    ],
  },
]

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function TilausPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [submitted, setSubmitted] = useState(false)

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
          plan: selectedPlan,
          message: contactMessage.trim(),
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
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/dashboard" className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">
          ← Takaisin
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4a4a4a]">
            Tilaus
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#1a1a1a]">Valitse tilausvaihtoehto</h1>
          <p className="mt-2 text-sm text-[#2d6a2d]">
            Laskutus vuosittain. Hinnat sis. alv 0%.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl border p-5 text-left transition-all ${
                selectedPlan === plan.id
                  ? plan.highlight
                    ? 'border-green-400 bg-[#1e3d1e]'
                    : 'border-green-500 bg-[#f0ebe3]'
                  : plan.highlight
                  ? 'border-green-600 bg-[#eaf3de] hover:border-green-500'
                  : 'border-[#e0d8cc] bg-white hover:border-[#e0d8cc]'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-400 px-3 py-0.5 text-xs font-bold text-green-950">
                  Suosituin
                </span>
              )}
              <div className="mb-3">
                <p className="text-lg font-bold text-[#1a1a1a]">{plan.name}</p>
                <p className="text-xs text-[#2d6a2d]">{plan.description}</p>
              </div>
              <div className="mb-1">
                <span className="text-3xl font-extrabold text-[#1a1a1a]">{plan.price} €</span>
                <span className="text-sm text-[#2d6a2d]"> / vuosi</span>
              </div>
              <p className="mb-0.5 text-sm text-[#2d6a2d]">(noin {plan.monthly} €/kk)</p>
              <p className="mb-4 text-xs text-[#888888]">sis. alv 0%</p>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#1a1a1a]">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#2d6a2d]" />
                    {f}
                  </li>
                ))}
              </ul>
              {selectedPlan === plan.id && (
                <div className="mt-4 rounded-lg bg-green-400 py-1.5 text-center text-xs font-bold text-green-950">
                  Valittu ✓
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Contact form */}
        <div className="rounded-2xl border border-[#e0d8cc] bg-white p-6">
          <h2 className="mb-1 text-lg font-bold text-[#1a1a1a]">Ota yhteyttä</h2>
          <p className="mb-5 text-sm text-[#2d6a2d]">
            Lähetä meille viesti niin otamme yhteyttä tilauksen aktivoimiseksi.
          </p>

          {submitted ? (
            <div className="rounded-xl bg-[#1e3d1e]/50 p-5 text-center">
              <p className="text-lg font-bold text-[#1a1a1a]">Viesti lähetetty!</p>
              <p className="mt-1 text-sm text-[#1e3d1e]">
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
                  Valittu paketti
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedPlan === plan.id
                          ? 'border-green-400 bg-[#1e3d1e] text-white'
                          : 'border-[#e0d8cc] text-[#2d6a2d] hover:border-green-600'
                      }`}
                    >
                      {plan.name} — {plan.price} €/v
                    </button>
                  ))}
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
                  placeholder="Seuran nimi, jäsenmäärä, kysymyksiä..."
                  className="w-full rounded-xl border border-[#e0d8cc] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#888888] focus:border-[#2d6a2d] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-green-500 py-3 text-sm font-bold text-green-950 hover:bg-green-400 disabled:opacity-50 transition-colors"
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
            toast.type === 'success' ? 'bg-[#1e3d1e] text-white' : 'bg-red-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  )
}
