'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Star } from 'lucide-react'

const HIDDEN_PATHS = ['/login', '/rekisteroidy', '/liity']

const CATEGORIES = [
  { id: 'bugi', label: '🐛 Bugi' },
  { id: 'parannus', label: '💡 Parannus' },
  { id: 'puuttuva_ominaisuus', label: '✨ Puuttuva ominaisuus' },
  { id: 'kiitos', label: '👍 Kiitos' },
  { id: 'yleinen', label: '💬 Yleinen' },
]

const STAR_LABELS = ['', 'Huono', 'Välttävä', 'Ok', 'Hyvä', 'Erinomainen']

const PAGE_NAMES_FI: Record<string, string> = {
  '/dashboard': 'Etusivu',
  '/erakartano': 'Eräkartano',
  '/jasenet': 'Jäsenet',
  '/maksut': 'Maksut',
  '/metsastajille': 'Metsästäjille',
  '/dokumentit': 'Asiakirjat',
  '/hallinto': 'Hallinto',
  '/tapahtumat': 'Tapahtumat',
  '/saalis': 'Saalis',
  '/superadmin': 'Superadmin',
}

function pageNameFi(path: string): string {
  const base = '/' + path.split('/')[1]
  return PAGE_NAMES_FI[base] ?? path
}

export default function FeedbackButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  const pageName = pageNameFi(pathname)

  function reset() {
    setRating(0)
    setHovered(0)
    setCategory('')
    setMessage('')
    setError(null)
    setSuccess(false)
  }

  function handleOpen() {
    reset()
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) {
      setError('Valitse tähtiluokitus')
      return
    }
    if (message.trim().length < 10) {
      setError('Viesti on liian lyhyt (min 10 merkkiä)')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          category: category || 'yleinen',
          message: message.trim(),
          page: pathname,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Lähetys epäonnistui')
        return
      }
      setSuccess(true)
      setTimeout(() => handleClose(), 2000)
    } catch {
      setError('Verkkovirhe. Yritä uudelleen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating button — above bottom nav on mobile, bottom-right on desktop */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-green-500 sm:bottom-6"
        aria-label="Anna palautetta"
      >
        <MessageCircle size={16} />
        Palaute
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            {/* Header */}
            <div className="rounded-t-3xl bg-green-900 px-6 py-4 sm:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">Anna palautetta</h2>
                  <p className="mt-0.5 text-xs text-green-300">
                    Auta meitä parantamaan sovellusta
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full p-1 text-green-300 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {success ? (
                <div className="py-8 text-center">
                  <p className="text-4xl">🎉</p>
                  <p className="mt-3 font-semibold text-green-800">
                    Kiitos palautteesta!
                  </p>
                  <p className="mt-1 text-sm text-stone-500">Suljetaan pian...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Star rating */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Arvosana
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHovered(n)}
                          onMouseLeave={() => setHovered(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={30}
                            className={
                              n <= (hovered || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-stone-300'
                            }
                          />
                        </button>
                      ))}
                      {(hovered || rating) > 0 && (
                        <span className="ml-2 text-xs text-stone-500">
                          {STAR_LABELS[hovered || rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Kategoria
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCategory(id === category ? '' : id)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            category === id
                              ? 'bg-green-700 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Viesti <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Kerro vapaasti..."
                      rows={3}
                      className="w-full rounded-xl border border-stone-200 p-3 text-sm text-stone-800 placeholder-stone-400 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                    <p className="mt-0.5 text-right text-xs text-stone-400">
                      {message.length} merkki{message.length !== 1 ? 'ä' : ''} / min 10
                    </p>
                  </div>

                  {/* Current page */}
                  <p className="text-xs text-stone-400">
                    Sivu:{' '}
                    <span className="font-medium text-stone-600">{pageName}</span>
                  </p>

                  {/* Error */}
                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                  >
                    {submitting ? 'Lähetetään...' : 'Lähetä palaute'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
