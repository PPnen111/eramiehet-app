'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { formatDate } from '@/lib/format'
import type { AdminMember } from './page'
import CsvImport from './csv-import'

const roleOptions = [
  { value: 'member', label: 'Jäsen' },
  { value: 'board_member', label: 'Johtokunta' },
  { value: 'admin', label: 'Ylläpitäjä' },
]

const statusOptions = [
  { value: 'active', label: 'Aktiivinen' },
  { value: 'pending', label: 'Odottaa' },
  { value: 'inactive', label: 'Ei-aktiivinen' },
]

type Invitation = {
  id: string
  email: string
  status: string
  expires_at: string
  created_at: string
}

type ImportLog = {
  id: string
  total_rows: number
  success_count: number
  skip_count: number
  error_count: number
  created_at: string
}

interface Props {
  clubId: string
  initialMembers: AdminMember[]
}


function InviteStatusBadge({ status, expiresAt }: { status: string; expiresAt: string }) {
  const isExpired = status === 'pending' && new Date(expiresAt) < new Date()

  if (isExpired || status === 'expired') {
    return (
      <span className="rounded-full bg-stone-700 px-2 py-0.5 text-xs font-medium text-stone-300">
        Vanhentunut
      </span>
    )
  }
  if (status === 'accepted') {
    return (
      <span className="rounded-full bg-green-900 px-2 py-0.5 text-xs font-medium text-green-300">
        Hyväksytty
      </span>
    )
  }
  return (
    <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-xs font-medium text-yellow-300">
      Odotetaan
    </span>
  )
}

export default function TabMembers({ clubId, initialMembers }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [busy, setBusy] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [deletingInvite, setDeletingInvite] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importLogs, setImportLogs] = useState<ImportLog[]>([])

  const loadImportLogs = useCallback(async () => {
    const { data } = await supabase
      .from('member_imports')
      .select('id, total_rows, success_count, skip_count, error_count, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(3)
    if (data) setImportLogs(data as unknown as ImportLog[])
  }, [supabase, clubId])

  const loadInvitations = useCallback(async () => {
    const { data } = await supabase
      .from('invitations')
      .select('id, email, status, expires_at, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setInvitations(data as unknown as Invitation[])
    }
  }, [supabase, clubId])

  useEffect(() => {
    void loadInvitations()
    void loadImportLogs()
  }, [loadInvitations, loadImportLogs])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviteLoading(true)

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const json = (await res.json()) as { ok?: boolean; error?: string }

      if (!res.ok || !json.ok) {
        setInviteError(json.error ?? 'Kutsun lähettäminen epäonnistui')
      } else {
        setInviteSuccess(`Kutsu lähetetty: ${inviteEmail}`)
        setInviteEmail('')
        void loadInvitations()
      }
    } catch {
      setInviteError('Verkkovirhe. Yritä uudelleen.')
    } finally {
      setInviteLoading(false)
    }
  }

  const deleteInvite = async (id: string) => {
    setDeletingInvite(id)
    await fetch(`/api/invite/${id}`, { method: 'DELETE' })
    setDeletingInvite(null)
    void loadInvitations()
  }

  const save = async (id: string, patch: Partial<Pick<AdminMember, 'role' | 'member_status'>>) => {
    setBusy(id)
    await supabase.from('profiles').update(patch).eq('id', id)
    setBusy(null)
    router.refresh()
  }

  const pending = initialMembers.filter((m) => m.member_status === 'pending')
  const rest = initialMembers.filter((m) => m.member_status !== 'pending')

  return (
    <div className="space-y-6">
      {/* CSV Import section */}
      <section className="rounded-2xl border border-green-800 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
            Tuo jäseniä CSV:stä
          </h2>
          <button
            onClick={() => setImportOpen((v) => !v)}
            className="rounded-lg border border-green-700 px-3 py-1 text-xs font-medium text-green-300 hover:bg-white/5 transition-colors"
          >
            {importOpen ? 'Sulje' : 'Tuo jäseniä'}
          </button>
        </div>

        {importOpen && (
          <div className="mt-4">
            <CsvImport
              onImportDone={() => {
                router.refresh()
                void loadImportLogs()
                setImportOpen(false)
              }}
            />
          </div>
        )}

        {/* Import history */}
        {importLogs.length > 0 && !importOpen && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
              Viimeisimmät tuonnit
            </p>
            {importLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-green-900 bg-white/[0.03] px-3 py-2 text-xs"
              >
                <span className="text-green-400">{formatDate(log.created_at)}</span>
                <span className="text-green-300">
                  {log.total_rows} riviä ·{' '}
                  <span className="text-green-200">{log.success_count} tuotu</span>
                  {log.skip_count > 0 && (
                    <span className="text-yellow-400"> · {log.skip_count} ohitettu</span>
                  )}
                  {log.error_count > 0 && (
                    <span className="text-red-400"> · {log.error_count} virheitä</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invitation section */}
      <section className="rounded-2xl border border-green-800 bg-white/5 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
          Lähetä kutsu
        </h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            placeholder="sahkoposti@esimerkki.fi"
            className="min-w-0 flex-1 rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
          />
          <button
            type="submit"
            disabled={inviteLoading}
            className="shrink-0 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
          >
            {inviteLoading ? '...' : 'Lähetä kutsu'}
          </button>
        </form>
        {inviteSuccess && (
          <p className="mt-2 rounded-lg bg-green-900/40 px-3 py-2 text-sm text-green-300">
            {inviteSuccess}
          </p>
        )}
        {inviteError && (
          <p className="mt-2 rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">
            {inviteError}
          </p>
        )}

        {/* Pending invitations list */}
        {invitations.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
              Lähetetyt kutsut
            </p>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-green-900 bg-white/[0.03] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{inv.email}</p>
                  <p className="text-xs text-green-600">
                    Lähetetty {formatDate(inv.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <InviteStatusBadge status={inv.status} expiresAt={inv.expires_at} />
                  <button
                    onClick={() => deleteInvite(inv.id)}
                    disabled={deletingInvite === inv.id}
                    title="Poista kutsu"
                    className="rounded-md p-1 text-stone-500 hover:bg-red-900/40 hover:text-red-400 disabled:opacity-40 transition-colors"
                  >
                    {deletingInvite === inv.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending member approvals */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-yellow-400">
            Odottaa hyväksyntää ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-yellow-900 bg-yellow-900/10 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{m.full_name ?? '—'}</p>
                  {m.email && <p className="text-xs text-green-500">{m.email}</p>}
                </div>
                <button
                  onClick={() => save(m.id, { member_status: 'active' })}
                  disabled={busy === m.id}
                  className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {busy === m.id ? '...' : 'Hyväksy'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Members list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
          Jäsenet ({rest.length})
        </h2>
        <div className="space-y-2">
          {rest.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-green-800 bg-white/5 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{m.full_name ?? '—'}</p>
                  {m.email && <p className="text-xs text-green-500">{m.email}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <select
                    value={m.role}
                    disabled={busy === m.id}
                    onChange={(e) => save(m.id, { role: e.target.value })}
                    className="rounded-lg border border-green-800 bg-green-950 px-2 py-1 text-xs text-white outline-none focus:border-green-500 disabled:opacity-50"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <select
                    value={m.member_status}
                    disabled={busy === m.id}
                    onChange={(e) => save(m.id, { member_status: e.target.value })}
                    className="rounded-lg border border-green-800 bg-green-950 px-2 py-1 text-xs text-white outline-none focus:border-green-500 disabled:opacity-50"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
