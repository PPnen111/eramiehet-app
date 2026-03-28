'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Circle, Users, CalendarDays, FileText, PartyPopper, ArrowRight } from 'lucide-react'

const STORAGE_KEY = 'onboarding_completed'

const STEPS = [
  { id: 1, title: 'Tervetuloa!', icon: PartyPopper },
  { id: 2, title: 'Kutsu jäseniä', icon: Users },
  { id: 3, title: 'Tapahtumat', icon: CalendarDays },
  { id: 4, title: 'Dokumentit', icon: FileText },
  { id: 5, title: 'Valmista!', icon: CheckCircle2 },
]

interface Props {
  clubName: string | null
}

export default function OnboardingWizard({ clubName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')
  const [invitedEmails, setInvitedEmails] = useState<string[]>([])

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.includes('@')) return
    setInviteStatus('sending')
    setInviteError('')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setInviteError(d.error ?? 'Kutsu epäonnistui')
        setInviteStatus('error')
      } else {
        setInvitedEmails((prev) => [...prev, inviteEmail])
        setInviteEmail('')
        setInviteStatus('sent')
        setTimeout(() => setInviteStatus('idle'), 3000)
      }
    } catch {
      setInviteError('Verkkovirhe. Yritä uudelleen.')
      setInviteStatus('error')
    }
  }

  function complete() {
    localStorage.setItem(STORAGE_KEY, 'true')
    router.push('/dashboard')
  }

  const labelClass = 'mb-1 block text-sm text-green-300'
  const inputClass =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-lg">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-green-500">
            <span>Käyttöönotto</span>
            <span>Vaihe {step} / {STEPS.length}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-green-900">
            <div
              className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between">
            {STEPS.map((s) => {
              const Icon = s.icon
              const done = step > s.id
              const active = step === s.id
              return (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      done
                        ? 'border-green-500 bg-green-500 text-white'
                        : active
                        ? 'border-green-400 bg-green-900 text-green-400'
                        : 'border-green-800 bg-green-950 text-green-700'
                    }`}
                  >
                    {done ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                  </div>
                  <span
                    className={`hidden text-xs sm:block ${active ? 'text-green-300' : 'text-green-700'}`}
                  >
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6">
            <div className="mb-4 text-4xl">🎉</div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Tervetuloa{clubName ? `, ${clubName}!` : '!'}
            </h1>
            <p className="mb-6 text-sm leading-6 text-green-300">
              Seuranne on nyt rekisteröity JahtiProiin. Käydään yhdessä läpi muutama
              perusvaihe, niin pääsette alkuun nopeasti.
            </p>
            <ul className="mb-6 space-y-2 text-sm text-green-400">
              {STEPS.slice(1).map((s) => {
                const Icon = s.icon
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <Circle size={14} className="shrink-0" />
                    {s.title}
                  </li>
                )
              })}
            </ul>
            <button
              onClick={() => setStep(2)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-semibold text-white hover:bg-green-600"
            >
              Aloitetaan <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Invite members */}
        {step === 2 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6">
            <div className="mb-1 text-2xl">👥</div>
            <h2 className="mb-1 text-xl font-bold text-white">Kutsu jäseniä</h2>
            <p className="mb-5 text-sm text-green-400">
              Lähetä sähköpostikutsuja seuran jäsenille. Voit kutsua lisää myöhemmin Hallinto-osiosta.
            </p>
            <form onSubmit={sendInvite} className="mb-4 space-y-3">
              <div>
                <label className={labelClass}>Sähköpostiosoite</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jäsen@example.com"
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={inviteStatus === 'sending'}
                className="w-full rounded-lg bg-green-700 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-green-600"
              >
                {inviteStatus === 'sending' ? 'Lähetetään...' : 'Lähetä kutsu'}
              </button>
              {inviteStatus === 'sent' && (
                <p className="text-center text-sm text-green-400">✓ Kutsu lähetetty!</p>
              )}
              {inviteStatus === 'error' && (
                <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{inviteError}</p>
              )}
            </form>
            {invitedEmails.length > 0 && (
              <div className="mb-4 rounded-lg border border-green-800 bg-green-950 px-3 py-2">
                <p className="mb-1 text-xs text-green-500">Kutsutut:</p>
                {invitedEmails.map((email) => (
                  <p key={email} className="text-xs text-green-300">✓ {email}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
              >
                Jatka <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-xl border border-green-800 px-4 py-2.5 text-sm text-green-400 hover:bg-white/5"
              >
                Ohita
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Create first event */}
        {step === 3 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6">
            <div className="mb-1 text-2xl">📅</div>
            <h2 className="mb-1 text-xl font-bold text-white">Luo ensimmäinen tapahtuma</h2>
            <p className="mb-5 text-sm text-green-400">
              Talkoot, kokoukset, jahdit – lisää seuran ensimmäinen tapahtuma nyt tai myöhemmin.
            </p>
            <Link
              href="/tapahtumat"
              className="mb-4 flex items-center justify-between rounded-xl border border-green-700 bg-green-900/40 px-4 py-3 text-sm font-semibold text-green-200 hover:bg-green-900/70"
            >
              <span>Avaa tapahtumat</span>
              <ArrowRight size={14} />
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(4)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
              >
                Jatka <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setStep(4)}
                className="rounded-xl border border-green-800 px-4 py-2.5 text-sm text-green-400 hover:bg-white/5"
              >
                Ohita
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Add documents */}
        {step === 4 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6">
            <div className="mb-1 text-2xl">📄</div>
            <h2 className="mb-1 text-xl font-bold text-white">Lisää dokumentteja</h2>
            <p className="mb-5 text-sm text-green-400">
              Lataa seuran säännöt, pöytäkirjat ja muut tärkeät asiakirjat hallintopaneeliin.
            </p>
            <Link
              href="/hallinto"
              className="mb-4 flex items-center justify-between rounded-xl border border-green-700 bg-green-900/40 px-4 py-3 text-sm font-semibold text-green-200 hover:bg-green-900/70"
            >
              <span>Avaa hallinto</span>
              <ArrowRight size={14} />
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(5)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
              >
                Jatka <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setStep(5)}
                className="rounded-xl border border-green-800 px-4 py-2.5 text-sm text-green-400 hover:bg-white/5"
              >
                Ohita
              </button>
            </div>
          </div>
        )}

        {/* Step 5: All done */}
        {step === 5 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6 text-center">
            <div className="mb-3 text-5xl">✅</div>
            <h2 className="mb-2 text-2xl font-bold text-white">Kaikki valmista!</h2>
            <p className="mb-6 text-sm leading-6 text-green-400">
              Seuran perustiedot on nyt kunnossa. Voit aina palata muokkaamaan tietoja hallintopaneelista.
            </p>
            <div className="mb-6 space-y-2 text-left">
              {[
                'Seura rekisteröity',
                'Jäsenet kutsuttu',
                'Tapahtumat-osio käytössä',
                'Dokumentit-osio käytössä',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-green-300">
                  <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
            <button
              onClick={complete}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-semibold text-white hover:bg-green-600"
            >
              Siirry sovellukseen <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mt-4 text-sm text-green-500 hover:text-green-300"
          >
            ← Takaisin
          </button>
        )}
      </div>
    </main>
  )
}
