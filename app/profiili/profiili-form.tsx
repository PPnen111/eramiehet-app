'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { ArrowLeft, Pencil, Check, X, Eye, EyeOff } from 'lucide-react'

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  member_status: string | null
  join_date: string | null
  club_id: string | null
}

interface Props {
  email: string
  profile: ProfileRow | null
  clubName: string | null
}

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
  superadmin: 'Superadmin',
}

const statusLabel: Record<string, string> = {
  active: 'Aktiivinen',
  pending: 'Odottaa hyväksyntää',
  inactive: 'Ei-aktiivinen',
}

function formatFinnishDate(dateStr: string | null): string {
  if (!dateStr) return '–'
  try {
    return new Date(dateStr).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const inputClass =
  'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
const labelClass = 'mb-1 block text-xs font-medium text-green-400'

export default function ProfiiliForm({ email, profile, clubName }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Perustiedot edit state
  const [editingPerus, setEditingPerus] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [savingPerus, setSavingPerus] = useState(false)
  const [perusMsg, setPerusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleSavePerus = async () => {
    setSavingPerus(true)
    setPerusMsg(null)
    try {
      const res = await fetch('/api/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setPerusMsg({ type: 'err', text: body.error ?? 'Tallennus epäonnistui' })
      } else {
        setPerusMsg({ type: 'ok', text: 'Tiedot tallennettu!' })
        setEditingPerus(false)
        router.refresh()
      }
    } catch {
      setPerusMsg({ type: 'err', text: 'Verkkovirhe, yritä uudelleen' })
    } finally {
      setSavingPerus(false)
    }
  }

  const handleCancelPerus = () => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
    setEditingPerus(false)
    setPerusMsg(null)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (newPassword.length < 6) {
      setPwMsg({ type: 'err', text: 'Uuden salasanan tulee olla vähintään 6 merkkiä' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'err', text: 'Salasanat eivät täsmää' })
      return
    }

    setSavingPw(true)
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInError) {
        setPwMsg({ type: 'err', text: 'Nykyinen salasana on väärä' })
        setSavingPw(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPwMsg({ type: 'err', text: error.message })
      } else {
        setPwMsg({ type: 'ok', text: 'Salasana vaihdettu onnistuneesti!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPwMsg({ type: 'err', text: 'Verkkovirhe, yritä uudelleen' })
    } finally {
      setSavingPw(false)
    }
  }

  const memberId = profile?.id ? profile.id.slice(0, 8).toUpperCase() : '–'

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300"
        >
          <ArrowLeft size={15} />
          Takaisin
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-white">Profiili</h1>

        {/* ── Section 1: Perustiedot ── */}
        <section className="mb-4 rounded-2xl border border-green-800 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Perustiedot</h2>
            {!editingPerus ? (
              <button
                onClick={() => { setEditingPerus(true); setPerusMsg(null) }}
                className="flex items-center gap-1.5 rounded-lg border border-green-700 px-2.5 py-1 text-xs font-medium text-green-300 hover:bg-green-900/40 transition-colors"
              >
                <Pencil size={12} />
                Muokkaa
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSavePerus}
                  disabled={savingPerus}
                  className="flex items-center gap-1.5 rounded-lg bg-green-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  <Check size={12} />
                  {savingPerus ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button
                  onClick={handleCancelPerus}
                  disabled={savingPerus}
                  className="flex items-center gap-1.5 rounded-lg border border-green-800 px-2.5 py-1 text-xs text-green-400 hover:bg-white/5 transition-colors"
                >
                  <X size={12} />
                  Peruuta
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelClass}>Nimi</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!editingPerus}
                className={inputClass}
                placeholder="Koko nimi"
              />
            </div>
            <div>
              <label className={labelClass}>Sähköposti</label>
              <input
                type="email"
                value={email}
                disabled
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Puhelinnumero</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editingPerus}
                className={inputClass}
                placeholder="+358 40 123 4567"
              />
            </div>
          </div>

          {perusMsg && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                perusMsg.type === 'ok'
                  ? 'bg-green-900/40 text-green-300'
                  : 'bg-red-900/40 text-red-300'
              }`}
            >
              {perusMsg.text}
            </p>
          )}
        </section>

        {/* ── Section 2: Seuratiedot ── */}
        <section className="mb-4 rounded-2xl border border-green-800 bg-white/5 p-5">
          <h2 className="mb-4 font-semibold text-white">Seuratiedot</h2>

          <dl className="space-y-2.5">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-green-400">Seura</dt>
              <dd className="text-right text-sm text-white">{clubName ?? '–'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-green-400">Rooli</dt>
              <dd className="text-right text-sm text-white">
                {profile?.role ? (roleLabel[profile.role] ?? profile.role) : '–'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-green-400">Jäsenstatus</dt>
              <dd className="text-right text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    profile?.member_status === 'active'
                      ? 'bg-green-800/60 text-green-200'
                      : profile?.member_status === 'pending'
                      ? 'bg-yellow-900/60 text-yellow-200'
                      : 'bg-stone-700/60 text-stone-300'
                  }`}
                >
                  {profile?.member_status ? (statusLabel[profile.member_status] ?? profile.member_status) : '–'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-green-400">Liittynyt</dt>
              <dd className="text-right text-sm text-white">{formatFinnishDate(profile?.join_date ?? null)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-green-400">Jäsen ID</dt>
              <dd className="font-mono text-right text-sm text-green-300">{memberId}</dd>
            </div>
          </dl>
        </section>

        {/* ── Section 3: Vaihda salasana ── */}
        <section className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <h2 className="mb-4 font-semibold text-white">Vaihda salasana</h2>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className={labelClass}>Nykyinen salasana</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className={inputClass + ' pr-10'}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-300"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Uusi salasana (min. 6 merkkiä)</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass + ' pr-10'}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-300"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Vahvista uusi salasana</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {pwMsg && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  pwMsg.type === 'ok'
                    ? 'bg-green-900/40 text-green-300'
                    : 'bg-red-900/40 text-red-300'
                }`}
              >
                {pwMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPw}
              className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {savingPw ? 'Vaihdetaan...' : 'Vaihda salasana'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
