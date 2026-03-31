'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Mail, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { formatDate } from '@/lib/format'
import type { AdminMember } from './page'
import type { MemberWithStatus } from '@/app/api/members/route'
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

function LoginBadge({ hasLoggedIn }: { hasLoggedIn: boolean }) {
  if (hasLoggedIn) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-900/60 px-2 py-0.5 text-xs font-medium text-green-300">
        ✅ Kirjautunut
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-700 px-2 py-0.5 text-xs font-medium text-stone-300">
      ⏳ Ei kirjautunut
    </span>
  )
}

export default function TabMembers({ clubId, initialMembers }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [members, setMembers] = useState<MemberWithStatus[]>(() =>
    initialMembers.map((m) => ({ ...m, has_logged_in: false }))
  )
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<string | null>(null)
  const [invitingMember, setInvitingMember] = useState<string | null>(null)
  const [invitedMember, setInvitedMember] = useState<string | null>(null)
  const [invitingAll, setInvitingAll] = useState(false)
  const [inviteAllResult, setInviteAllResult] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importLogs, setImportLogs] = useState<ImportLog[]>([])

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    const res = await fetch('/api/members')
    if (res.ok) {
      const json = (await res.json()) as { members: MemberWithStatus[] }
      setMembers(json.members)
    }
    setLoadingMembers(false)
  }, [])

  const loadImportLogs = useCallback(async () => {
    const { data } = await supabase
      .from('member_imports')
      .select('id, total_rows, success_count, skip_count, error_count, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(3)
    if (data) setImportLogs(data as unknown as ImportLog[])
  }, [supabase, clubId])

  useEffect(() => {
    void fetchMembers()
    void loadImportLogs()
  }, [fetchMembers, loadImportLogs])

  const inviteAll = async () => {
    setInvitingAll(true)
    setInviteAllResult(null)
    const res = await fetch('/api/members/invite-all', { method: 'POST' })
    if (res.ok) {
      const json = (await res.json()) as { sent: number }
      setInviteAllResult(
        json.sent > 0
          ? `Lähetetty ${json.sent} kutsua`
          : 'Kaikki jäsenet ovat jo kirjautuneet'
      )
    } else {
      setInviteAllResult('Virhe kutsuja lähetettäessä')
    }
    setInvitingAll(false)
  }

  const inviteMember = async (id: string) => {
    setInvitingMember(id)
    const res = await fetch(`/api/members/${id}/invite`, { method: 'POST' })
    setInvitingMember(null)
    if (res.ok) {
      setInvitedMember(id)
      setTimeout(() => setInvitedMember(null), 3000)
    }
  }

  const removeMember = async (id: string, name: string) => {
    if (!confirm(`Haluatko varmasti poistaa jäsenen ${name} seurasta?`)) return
    setDeletingMember(id)
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    setDeletingMember(null)
    if (res.ok) {
      void fetchMembers()
    }
  }

  const save = async (id: string, patch: Partial<Pick<AdminMember, 'role' | 'member_status'>>) => {
    setBusy(id)
    await supabase.from('profiles').update(patch).eq('id', id)
    setBusy(null)
    void fetchMembers()
  }

  const pending = members.filter((m) => m.member_status === 'pending')
  const rest = members.filter((m) => m.member_status !== 'pending')
  const notLoggedIn = rest.filter((m) => !m.has_logged_in)

  return (
    <div className="space-y-6">
      {/* Import section */}
      <section className="rounded-2xl border border-green-800 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
              Tuo jäseniä
            </h2>
            <p className="text-xs text-green-600">CSV tai Excel (.xlsx)</p>
          </div>
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
                void fetchMembers()
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
            Jäsenet ({loadingMembers ? '…' : rest.length})
          </h2>
          {notLoggedIn.length > 0 && (
            <button
              onClick={() => void inviteAll()}
              disabled={invitingAll}
              className="flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Mail size={12} />
              {invitingAll
                ? `Lähetetään ${notLoggedIn.length} kutsua...`
                : `Kutsu kaikki ei-kirjautuneet (${notLoggedIn.length})`}
            </button>
          )}
        </div>

        {inviteAllResult && (
          <p className="mb-3 rounded-lg bg-green-900/40 px-3 py-2 text-sm text-green-300">
            {inviteAllResult}
          </p>
        )}

        <div className="space-y-2">
          {rest.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-green-800 bg-white/5 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jasenet/${m.id}`}
                      className="font-medium text-white hover:text-green-300 transition-colors"
                    >
                      {m.full_name ?? '—'}
                    </Link>
                    <LoginBadge hasLoggedIn={m.has_logged_in} />
                    {invitedMember === m.id && (
                      <span className="text-xs text-green-400">Kutsu lähetetty ✓</span>
                    )}
                  </div>
                  {m.email && <p className="mt-0.5 text-xs text-green-500">{m.email}</p>}
                  <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-green-600">
                    {m.phone && <span>{m.phone}</span>}
                    {m.member_type && <span>{m.member_type}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <div className="flex flex-col gap-1.5">
                    <select
                      value={m.role}
                      disabled={busy === m.id || deletingMember === m.id}
                      onChange={(e) => save(m.id, { role: e.target.value })}
                      className="rounded-lg border border-green-800 bg-green-950 px-2 py-1 text-xs text-white outline-none focus:border-green-500 disabled:opacity-50"
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <select
                      value={m.member_status}
                      disabled={busy === m.id || deletingMember === m.id}
                      onChange={(e) => save(m.id, { member_status: e.target.value })}
                      className="rounded-lg border border-green-800 bg-green-950 px-2 py-1 text-xs text-white outline-none focus:border-green-500 disabled:opacity-50"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <Link
                      href={`/jasenet/${m.id}`}
                      title="Avaa jäsensivu"
                      className="rounded-md p-1.5 text-green-600 hover:bg-green-900/40 hover:text-green-300 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    {!m.has_logged_in && m.email && (
                      <button
                        onClick={() => void inviteMember(m.id)}
                        disabled={invitingMember === m.id || invitedMember === m.id}
                        title="Lähetä kutsu"
                        className="rounded-md p-1.5 text-green-500 hover:bg-green-900/40 hover:text-green-300 disabled:opacity-40 transition-colors"
                      >
                        {invitingMember === m.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Mail size={14} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => void removeMember(m.id, m.full_name ?? '—')}
                      disabled={deletingMember === m.id || busy === m.id}
                      title="Poista seurasta"
                      className="rounded-md p-1.5 text-stone-500 hover:bg-red-900/40 hover:text-red-400 disabled:opacity-40 transition-colors"
                    >
                      {deletingMember === m.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loadingMembers && rest.length === 0 && (
            <p className="text-sm text-green-600">Ladataan jäseniä...</p>
          )}
        </div>
      </section>
    </div>
  )
}
