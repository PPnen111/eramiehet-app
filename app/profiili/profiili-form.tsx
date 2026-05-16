'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { ArrowLeft, Pencil, Check, X, Eye, EyeOff, Download, Trash2 } from 'lucide-react'

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
  'w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d] disabled:opacity-50 disabled:cursor-not-allowed'
const labelClass = 'mb-1 block text-xs font-medium text-[#2d6a2d]'

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

  // GDPR state
  const [exporting, setExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/gdpr/export')
      if (!res.ok) return
      const blob = await res.blob()
      const date = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `omat-tiedot-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'POISTA') return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/gdpr/delete', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setDeleteError(body.error ?? 'Poisto epäonnistui')
        setDeleting(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      setDeleteError('Verkkovirhe. Yritä uudelleen.')
      setDeleting(false)
    }
  }

  const memberId = profile?.id ? profile.id.slice(0, 8).toUpperCase() : '–'

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#2d6a2d] hover:text-[#1e3d1e]"
        >
          <ArrowLeft size={15} />
          Takaisin
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-[#1a1a1a]">Profiili</h1>

        {/* ── Section 1: Perustiedot ── */}
        <section className="mb-4 rounded-2xl border border-[#e0d8cc] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1a1a]">Perustiedot</h2>
            {!editingPerus ? (
              <button
                onClick={() => { setEditingPerus(true); setPerusMsg(null) }}
                className="flex items-center gap-1.5 rounded-lg border border-[#e0d8cc] px-2.5 py-1 text-xs font-medium text-[#1e3d1e] hover:bg-white transition-colors"
              >
                <Pencil size={12} />
                Muokkaa
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSavePerus}
                  disabled={savingPerus}
                  className="flex items-center gap-1.5 rounded-lg bg-[#1e3d1e] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#162d16] disabled:opacity-50 transition-colors"
                >
                  <Check size={12} />
                  {savingPerus ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button
                  onClick={handleCancelPerus}
                  disabled={savingPerus}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e0d8cc] px-2.5 py-1 text-xs text-[#2d6a2d] hover:bg-white transition-colors"
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
                  ? 'bg-white text-[#1e3d1e]'
                  : 'bg-red-900/40 text-red-300'
              }`}
            >
              {perusMsg.text}
            </p>
          )}
        </section>

        {/* ── Section 2: Seuratiedot ── */}
        <section className="mb-4 rounded-2xl border border-[#e0d8cc] bg-white p-5">
          <h2 className="mb-4 font-semibold text-[#1a1a1a]">Seuratiedot</h2>

          <dl className="space-y-2.5">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-[#2d6a2d]">Seura</dt>
              <dd className="text-right text-sm text-[#1a1a1a]">{clubName ?? '–'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-[#2d6a2d]">Rooli</dt>
              <dd className="text-right text-sm text-[#1a1a1a]">
                {profile?.role ? (roleLabel[profile.role] ?? profile.role) : '–'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-[#2d6a2d]">Jäsenstatus</dt>
              <dd className="text-right text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    profile?.member_status === 'active'
                      ? 'bg-[#eaf3de] text-[#1a1a1a]'
                      : profile?.member_status === 'pending'
                      ? 'bg-[#fef3c7]/60 text-[#92400e]'
                      : 'bg-[#1e3d1e]/60 text-[#4a4a4a]'
                  }`}
                >
                  {profile?.member_status ? (statusLabel[profile.member_status] ?? profile.member_status) : '–'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-[#2d6a2d]">Liittynyt</dt>
              <dd className="text-right text-sm text-[#1a1a1a]">{formatFinnishDate(profile?.join_date ?? null)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-[#2d6a2d]">Jäsen ID</dt>
              <dd className="font-mono text-right text-sm text-[#1e3d1e]">{memberId}</dd>
            </div>
          </dl>
        </section>

        {/* ── Section 3: Vaihda salasana ── */}
        <section className="mb-4 rounded-2xl border border-[#e0d8cc] bg-white p-5">
          <h2 className="mb-4 font-semibold text-[#1a1a1a]">Vaihda salasana</h2>

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#1e3d1e]"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#1e3d1e]"
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
                    ? 'bg-white text-[#1e3d1e]'
                    : 'bg-red-900/40 text-red-300'
                }`}
              >
                {pwMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPw}
              className="w-full rounded-lg bg-[#1e3d1e] py-2.5 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50 transition-colors"
            >
              {savingPw ? 'Vaihdetaan...' : 'Vaihda salasana'}
            </button>
          </form>
        </section>
        {/* ── Section 4: Omat tietosi (GDPR) ── */}
        <section className="rounded-2xl border border-[#e0d8cc] bg-white p-5">
          <h2 className="mb-1 font-semibold text-[#1a1a1a]">Omat tietosi</h2>
          <p className="mb-4 text-xs text-[#4a4a4a]">
            GDPR-oikeutesi —{' '}
            <Link href="/tietosuoja" className="underline hover:text-[#1e3d1e]">
              tietosuojaseloste
            </Link>
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-[#e0d8cc] px-4 py-2.5 text-sm font-medium text-[#1e3d1e] hover:bg-white disabled:opacity-50 transition-colors"
            >
              <Download size={15} />
              {exporting ? 'Ladataan...' : 'Lataa omat tietoni'}
            </button>

            <button
              onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError('') }}
              className="flex items-center gap-2 rounded-lg border border-red-800 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={15} />
              Poista tilini
            </button>
          </div>
        </section>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}
          >
            <div className="w-full max-w-sm rounded-2xl border border-red-800 bg-[#f5f0e8] p-5 shadow-2xl">
              <h3 className="mb-2 font-semibold text-[#1a1a1a]">Haluatko varmasti poistaa tilisi?</h3>
              <p className="mb-4 text-sm text-red-300">
                Kaikki tietosi poistetaan pysyvästi. Tätä ei voi peruuttaa.
              </p>
              <label className="mb-1 block text-xs text-[#2d6a2d]">
                Kirjoita <span className="font-bold text-[#1a1a1a]">POISTA</span> vahvistaaksesi
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="mb-3 w-full rounded-lg border border-red-800 bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-red-500"
                placeholder="POISTA"
              />
              {deleteError && (
                <p className="mb-3 rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirm !== 'POISTA' || deleting}
                  className="flex-1 rounded-lg bg-red-700 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
                >
                  {deleting ? 'Poistetaan...' : 'Poista tili'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="rounded-lg border border-[#e0d8cc] px-4 py-2.5 text-sm text-[#1e3d1e] hover:bg-white"
                >
                  Peruuta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
