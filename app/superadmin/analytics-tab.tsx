'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react'

export type UserRow = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  role: string | null
  club_name: string | null
}

export type EnhancedClub = {
  id: string
  name: string | null
  created_at: string
  memberCount: number
  adminName: string | null
  adminEmail: string | null
  latestActivity: string | null
}

export type Stats = {
  totalClubs: number
  totalUsers: number
  newThisWeek: number
  activeToday: number
}

interface Props {
  stats: Stats
  userRows: UserRow[]
  enhancedClubs: EnhancedClub[]
  currentUserId: string
}

const roleLabelFi: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
  superadmin: 'Superadmin',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(iso) >= cutoff
}

function ActivityBadge({ lastSignIn }: { lastSignIn: string | null }) {
  if (isToday(lastSignIn)) {
    return (
      <span className="inline-block rounded-full bg-green-700 px-2 py-0.5 text-xs font-medium text-green-100">
        Aktiivinen tänään
      </span>
    )
  }
  if (isWithinDays(lastSignIn, 7)) {
    return (
      <span className="inline-block rounded-full bg-green-900 px-2 py-0.5 text-xs font-medium text-green-300">
        Aktiivinen
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-400">
      Ei aktiivinen
    </span>
  )
}

type ToastState = { message: string; type: 'success' | 'error' } | null

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl ${
        toast.type === 'success'
          ? 'bg-green-700 text-white'
          : 'bg-red-800 text-white'
      }`}
    >
      {toast.message}
    </div>
  )
}

interface ConfirmModalProps {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-800 bg-stone-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <h2 className="font-bold text-white">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-300">{body}</p>
            <p className="mt-2 text-xs font-semibold text-red-400">Tätä ei voi peruuttaa.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-stone-700 py-2.5 text-sm font-semibold text-stone-300 hover:bg-stone-800 disabled:opacity-50"
          >
            Peruuta
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Poistetaan...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsTab({ stats, userRows, enhancedClubs, currentUserId }: Props) {
  const router = useRouter()
  const { totalClubs, totalUsers, newThisWeek, activeToday } = stats

  const [pendingDeleteClub, setPendingDeleteClub] = useState<EnhancedClub | null>(null)
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  // Role editing state: userId → pending role value
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({})
  const [savingRole, setSavingRole] = useState<string | null>(null)

  function setRoleDraft(userId: string, role: string) {
    setPendingRoles((prev) => ({ ...prev, [userId]: role }))
  }

  async function handleSaveRole(userId: string) {
    const role = pendingRoles[userId]
    if (!role) return
    setSavingRole(userId)
    try {
      const res = await fetch('/api/superadmin/update-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        showToast(data.error ?? 'Roolin muutos epäonnistui', 'error')
      } else {
        showToast('Rooli päivitetty', 'success')
        setPendingRoles((prev) => { const next = { ...prev }; delete next[userId]; return next })
        router.refresh()
      }
    } catch {
      showToast('Roolin muutos epäonnistui', 'error')
    } finally {
      setSavingRole(null)
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
  }

  async function handleDeleteClub() {
    if (!pendingDeleteClub) return
    setDeleting(true)
    try {
      const res = await fetch('/api/superadmin/delete-club', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: pendingDeleteClub.id }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        showToast(data.error ?? 'Poistaminen epäonnistui', 'error')
      } else {
        showToast('Seura poistettu', 'success')
        router.refresh()
      }
    } catch {
      showToast('Poistaminen epäonnistui', 'error')
    } finally {
      setDeleting(false)
      setPendingDeleteClub(null)
    }
  }

  async function handleDeleteUser() {
    if (!pendingDeleteUser) return
    setDeleting(true)
    try {
      const res = await fetch('/api/superadmin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: pendingDeleteUser.id }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        showToast(data.error ?? 'Poistaminen epäonnistui', 'error')
      } else {
        showToast('Käyttäjä poistettu', 'success')
        router.refresh()
      }
    } catch {
      showToast('Poistaminen epäonnistui', 'error')
    } finally {
      setDeleting(false)
      setPendingDeleteUser(null)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats — 4 cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
              <Building2 size={12} />
              Seuroja yhteensä
            </div>
            <p className="text-3xl font-bold text-white">{totalClubs}</p>
          </div>
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
              <Users size={12} />
              Käyttäjiä yhteensä
            </div>
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
              <TrendingUp size={12} />
              Uusia tällä viikolla
            </div>
            <p className="text-3xl font-bold text-white">{newThisWeek}</p>
          </div>
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-green-500">
              <UserCheck size={12} />
              Aktiivisia tänään
            </div>
            <p className="text-3xl font-bold text-white">{activeToday}</p>
          </div>
        </div>

        {/* Clubs list */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
            Seurat
          </h2>
          {enhancedClubs.length === 0 ? (
            <p className="text-sm text-green-600">Ei seuroja.</p>
          ) : (
            <div className="space-y-2">
              {enhancedClubs.map((club) => (
                <div
                  key={club.id}
                  className="rounded-xl border border-green-800 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{club.name ?? '—'}</p>
                      {club.adminName && (
                        <p className="mt-0.5 truncate text-xs text-green-400">
                          Admin: {club.adminName}
                          {club.adminEmail && (
                            <span className="text-green-600"> · {club.adminEmail}</span>
                          )}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-green-600">
                        <span>Perustettu {formatDate(club.created_at)}</span>
                        <span>Viimeisin aktiviteetti {formatDate(club.latestActivity)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{club.memberCount}</p>
                        <p className="text-xs text-green-600">jäsentä</p>
                      </div>
                      {club.memberCount > 0 ? (
                        <span
                          title="Poista ensin kaikki jäsenet"
                          className="rounded-lg border border-red-900 px-2.5 py-1.5 text-xs text-red-800 cursor-not-allowed"
                        >
                          Poista seura
                        </span>
                      ) : (
                        <button
                          onClick={() => setPendingDeleteClub(club)}
                          className="rounded-lg border border-red-700 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
                        >
                          Poista seura
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* User analytics table */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
            Käyttäjäanalytiikka
          </h2>
          {userRows.length === 0 ? (
            <p className="text-sm text-green-600">Ei käyttäjiä.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-green-800">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-green-800 bg-white/5">
                    {['Nimi', 'Sähköposti', 'Seura', 'Rooli', 'Rekisteröityi', 'Viimeksi kirjautunut', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-900">
                  {userRows.map((u) => {
                    const isSelf = u.id === currentUserId
                    const isSuperadmin = u.role === 'superadmin'
                    const canEdit = !isSelf && !isSuperadmin
                    const canDelete = canEdit
                    const draftRole = pendingRoles[u.id]
                    const hasChange = draftRole !== undefined && draftRole !== u.role
                    const isSaving = savingRole === u.id
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-medium text-white">
                          {u.full_name ?? <span className="text-green-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-green-300">{u.email ?? '—'}</td>
                        <td className="px-4 py-3 text-green-300">
                          {u.club_name ?? <span className="text-green-700">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {canEdit ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={draftRole ?? u.role ?? 'member'}
                                onChange={(e) => setRoleDraft(u.id, e.target.value)}
                                disabled={isSaving}
                                className="rounded border border-green-800 bg-green-950 px-2 py-1 text-xs text-white outline-none focus:border-green-500 disabled:opacity-50"
                              >
                                <option value="member">Jäsen</option>
                                <option value="board_member">Johtokunta</option>
                                <option value="admin">Ylläpitäjä</option>
                              </select>
                              {hasChange && (
                                <button
                                  onClick={() => handleSaveRole(u.id)}
                                  disabled={isSaving}
                                  className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                                >
                                  {isSaving ? '...' : 'Tallenna'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600">
                              {u.role ? (roleLabelFi[u.role] ?? u.role) : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-green-400">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="px-4 py-3 text-green-400">
                          {formatDate(u.last_sign_in_at)}
                        </td>
                        <td className="px-4 py-3">
                          <ActivityBadge lastSignIn={u.last_sign_in_at} />
                        </td>
                        <td className="px-4 py-3">
                          {canDelete ? (
                            <button
                              onClick={() => setPendingDeleteUser(u)}
                              className="rounded-lg border border-red-700 px-2.5 py-1 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
                            >
                              Poista käyttäjä
                            </button>
                          ) : (
                            <span className="text-xs text-green-800">
                              {isSelf ? 'Oma tili' : 'Superadmin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Delete club confirmation modal */}
      {pendingDeleteClub && (
        <ConfirmModal
          title={`Poistetaanko seura "${pendingDeleteClub.name ?? ''}"?`}
          body={`Haluatko varmasti poistaa seuran ${pendingDeleteClub.name ?? ''}? Tämä poistaa KAIKEN seuran datan pysyvästi.`}
          confirmLabel="Poista pysyvästi"
          onConfirm={handleDeleteClub}
          onCancel={() => setPendingDeleteClub(null)}
          loading={deleting}
        />
      )}

      {/* Delete user confirmation modal */}
      {pendingDeleteUser && (
        <ConfirmModal
          title={`Poistetaanko käyttäjä "${pendingDeleteUser.full_name ?? pendingDeleteUser.email ?? ''}"?`}
          body={`Haluatko varmasti poistaa käyttäjän ${pendingDeleteUser.full_name ?? pendingDeleteUser.email ?? ''}? Käyttäjä menettää pääsyn kaikkiin seuroihin.`}
          confirmLabel="Poista pysyvästi"
          onConfirm={handleDeleteUser}
          onCancel={() => setPendingDeleteUser(null)}
          loading={deleting}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
