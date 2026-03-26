'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'perus',
    name: 'Perus',
    price: 249,
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
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-500">
            Tilaus
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Valitse tilausvaihtoehto</h1>
          <p className="mt-2 text-sm text-green-400">
            Hinnat sisältävät alv. Laskutus vuosittain.
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
                    ? 'border-green-400 bg-green-700'
                    : 'border-green-500 bg-green-900/60'
                  : plan.highlight
                  ? 'border-green-600 bg-green-800/60 hover:border-green-500'
                  : 'border-green-800 bg-white/5 hover:border-green-700'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-400 px-3 py-0.5 text-xs font-bold text-green-950">
                  Suosituin
                </span>
              )}
              <div className="mb-3">
                <p className="text-lg font-bold text-white">{plan.name}</p>
                <p className="text-xs text-green-400">{plan.description}</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white">{plan.price} €</span>
                <span className="text-sm text-green-400"> / vuosi</span>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-green-200">
                    <Check size={14} className="mt-0.5 shrink-0 text-green-400" />
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
        <div className="rounded-2xl border border-green-800 bg-white/5 p-6">
          <h2 className="mb-1 text-lg font-bold text-white">Ota yhteyttä</h2>
          <p className="mb-5 text-sm text-green-400">
            Lähetä meille viesti niin otamme yhteyttä tilauksen aktivoimiseksi.
          </p>

          {submitted ? (
            <div className="rounded-xl bg-green-800/50 p-5 text-center">
              <p className="text-lg font-bold text-white">Viesti lähetetty!</p>
              <p className="mt-1 text-sm text-green-300">
                Otamme sinuun yhteyttä pian.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-green-400">
                    Nimi *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Matti Metsänen"
                    className="w-full rounded-xl border border-green-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-green-700 focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-green-400">
                    Sähköposti *
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="matti@seura.fi"
                    className="w-full rounded-xl border border-green-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-green-700 focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-green-400">
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
                          ? 'border-green-400 bg-green-700 text-white'
                          : 'border-green-800 text-green-400 hover:border-green-600'
                      }`}
                    >
                      {plan.name} — {plan.price} €/v
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-green-400">
                  Lisätietoja (valinnainen)
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={3}
                  placeholder="Seuran nimi, jäsenmäärä, kysymyksiä..."
                  className="w-full rounded-xl border border-green-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-green-700 focus:border-green-500 focus:outline-none"
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
            toast.type === 'success' ? 'bg-green-700 text-white' : 'bg-red-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  )
}
