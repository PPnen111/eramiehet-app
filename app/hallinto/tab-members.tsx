'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trash2, Mail, ChevronRight, ChevronDown, UserPlus } from 'lucide-react'
import PlanLimitModal from '@/app/components/plan-limit-modal'
import { createClient } from '@/lib/supabase/browser'
import { formatDate } from '@/lib/format'
import type { AdminMember } from './page'
import type { MemberWithStatus } from '@/app/api/members/route'
import CsvImport from './csv-import'
import ExcelImportForm from './excel-import-form'
import AddMemberForm from './add-member-form'

type ImportRowDetail = { name: string; status: 'success' | 'skipped' | 'error'; reason?: string }

type ImportLog = {
  id: string
  total_rows: number
  success_count: number
  skip_count: number
  error_count: number
  created_at: string
  import_rows: ImportRowDetail[] | null
}

interface Props {
  clubId: string
  initialMembers: AdminMember[]
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktiivinen',
  pending: 'Odottaa',
  inactive: 'Ei-aktiivinen',
  no_account: 'Ei sovellustunnusta',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'text-[#2d6a2d]',
  pending: 'text-[#b45309]',
  inactive: 'text-[#888888]',
  no_account: 'text-[#1e40af]',
}

export default function TabMembers({ clubId, initialMembers }: Props) {
  const supabase = createClient()

  const [members, setMembers] = useState<MemberWithStatus[]>(() =>
    initialMembers.map((m) => ({ ...m, has_logged_in: false, profile_id: null }))
  )
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [deletingMember, setDeletingMember] = useState<string | null>(null)
  const [invitingMember, setInvitingMember] = useState<string | null>(null)
  const [invitedMember, setInvitedMember] = useState<string | null>(null)
  const [invitingAll, setInvitingAll] = useState(false)
  const [inviteAllResult, setInviteAllResult] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<'file' | 'form'>('file')
  const [importLogs, setImportLogs] = useState<ImportLog[]>([])
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [approvingMember, setApprovingMember] = useState<string | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [limitModal, setLimitModal] = useState<{ message: string; planLabel: string } | null>(null)

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
      .select('id, total_rows, success_count, skip_count, error_count, created_at, import_rows')
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
        json.sent > 0 ? `Lähetetty ${json.sent} kutsua` : 'Kaikki jäsenet ovat jo kirjautuneet'
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

  const removeMember = async (id: string, name: string, profileId: string | null) => {
    if (!confirm(`Haluatko varmasti poistaa jäsenen ${name} seurasta?`)) return
    setDeletingMember(id)
    const url = profileId ? `/api/members/${profileId}` : `/api/members/registry/${id}`
    const res = await fetch(url, { method: 'DELETE' })
    setDeletingMember(null)
    if (res.ok) void fetchMembers()
  }

  const approveMember = async (id: string) => {
    setApprovingMember(id)
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_status: 'active' }),
    })
    setApprovingMember(null)
    void fetchMembers()
  }

  const pending = members.filter((m) => m.member_status === 'pending')
  const rest = members.filter((m) => m.member_status !== 'pending')
  const notLoggedIn = rest.filter((m) => !m.has_logged_in)

  return (
    <div className="space-y-6">
      {/* Import section */}
      <section className="card-shadow rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">Tuo jäseniä</h2>
            <p className="text-xs text-[#888888]">CSV tai Excel (.xlsx)</p>
            <a
              href="/jahtipro-jasenpohja.xlsx"
              download="jahtipro-jasenpohja.xlsx"
              className="mt-1 inline-block text-xs text-[#2d6a2d] underline hover:text-[#1e3d1e]"
            >
              ⬇ Lataa Excel-pohja
            </a>
          </div>
          <button
            onClick={() => setImportOpen((v) => !v)}
            className="rounded-lg border border-[#e0d8cc] px-3 py-1 text-xs font-medium text-[#1e3d1e] hover:bg-white transition-colors"
          >
            {importOpen ? 'Sulje' : 'Tuo jäseniä'}
          </button>
        </div>
        {importOpen && (
          <div className="mt-4 space-y-3">
            {/* Toggle between file and form import */}
            <div className="flex gap-1 rounded-lg border border-[#e0d8cc] bg-white/[0.03] p-1">
              <button
                onClick={() => setImportMode('file')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  importMode === 'file'
                    ? 'bg-[#1e3d1e] text-white'
                    : 'text-[#2d6a2d] hover:bg-white'
                }`}
              >
                Tuo tiedostosta
              </button>
              <button
                onClick={() => setImportMode('form')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  importMode === 'form'
                    ? 'bg-[#1e3d1e] text-white'
                    : 'text-[#2d6a2d] hover:bg-white'
                }`}
              >
                Täytä lomake
              </button>
            </div>

            {importMode === 'file' ? (
              <CsvImport onImportDone={() => { void fetchMembers(); void loadImportLogs(); setImportOpen(false) }} />
            ) : (
              <ExcelImportForm onImportDone={() => { void fetchMembers(); void loadImportLogs(); setImportOpen(false) }} />
            )}
          </div>
        )}
        {importLogs.length > 0 && !importOpen && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Viimeisimmät tuonnit</p>
            {importLogs.map((log) => {
              const isOpen = expandedLogId === log.id
              const hasDetails = log.import_rows && log.import_rows.length > 0
              return (
                <div key={log.id} className="rounded-lg border border-[#e0d8cc] bg-white/[0.03] overflow-hidden">
                  <button
                    onClick={() => setExpandedLogId(isOpen ? null : log.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-white/[0.02] transition-colors"
                    disabled={!hasDetails}
                  >
                    <span className="text-[#2d6a2d]">{formatDate(log.created_at)}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[#1e3d1e]">
                        {log.total_rows} riviä · <span className="text-[#1a1a1a]">{log.success_count} tuotu</span>
                        {log.skip_count > 0 && <span className="text-[#b45309]"> · {log.skip_count} ohitettu</span>}
                        {log.error_count > 0 && <span className="text-[#991b1b]"> · {log.error_count} virheitä</span>}
                      </span>
                      {hasDetails && <ChevronDown size={12} className={`text-[#888888] transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                    </span>
                  </button>
                  {isOpen && hasDetails && (
                    <div className="border-t border-[#e0d8cc]/50 bg-white px-3 py-2 space-y-1 max-h-64 overflow-y-auto">
                      {log.import_rows!.map((row, i) => {
                        const icon = row.status === 'success' ? '✅' : row.status === 'error' ? '❌' : '⏭'
                        const textCls = row.status === 'success' ? 'text-[#1e3d1e]' : row.status === 'error' ? 'text-[#991b1b]' : 'text-[#888888]'
                        const label = row.status === 'success' ? 'tuotu' : row.status === 'error' ? `virhe${row.reason ? ': ' + row.reason : ''}` : 'jo rekisterissä'
                        return (
                          <div key={i} className={`flex items-center gap-2 text-xs ${textCls}`}>
                            <span className="w-4 shrink-0">{icon}</span>
                            <span className="font-medium text-[#1a1a1a]">{row.name}</span>
                            <span className="text-[#888888]">— {label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#b45309]">
            Odottaa hyväksyntää ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#fcd34d] bg-[#fef3c7]/10 px-4 py-3">
                <Link href={`/jasenet/${m.id}`} className="min-w-0 flex-1">
                  <p className="font-medium text-[#1a1a1a] hover:text-[#1e3d1e] transition-colors">{m.full_name ?? '—'}</p>
                  {m.email && <p className="text-xs text-[#4a4a4a]">{m.email}</p>}
                </Link>
                <button
                  onClick={() => void approveMember(m.id)}
                  disabled={approvingMember === m.id}
                  className="shrink-0 rounded-lg bg-[#1e3d1e] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {approvingMember === m.id ? '...' : 'Hyväksy'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Members list */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
            Jäsenet ({loadingMembers ? '…' : rest.length})
          </h2>
          <div className="flex items-center gap-2">
            {notLoggedIn.length > 0 && (
              <button
                onClick={() => void inviteAll()}
                disabled={invitingAll}
                className="flex items-center gap-1.5 rounded-lg bg-[#1e3d1e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3d1e] disabled:opacity-50 transition-colors"
              >
                <Mail size={12} />
                {invitingAll ? `Lähetetään ${notLoggedIn.length} kutsua...` : `Kutsu kaikki (${notLoggedIn.length})`}
              </button>
            )}
            <button
              onClick={() => setAddMemberOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1e3d1e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d16] transition-colors"
            >
              <UserPlus size={12} />
              Uusi jäsen
            </button>
          </div>
        </div>

        {inviteAllResult && (
          <p className="mb-3 rounded-lg bg-white px-3 py-2 text-sm text-[#1e3d1e]">{inviteAllResult}</p>
        )}

        <div className="card-shadow divide-y divide-green-900/40 rounded-2xl bg-white overflow-hidden">
          {rest.map((m) => {
            const targetHref = m.profile_id ? `/jasenet/${m.profile_id}` : `/jasenet/registry/${m.id}`
            return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <Link href={targetHref} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[#1a1a1a]">{m.full_name ?? '—'}</span>
                  <span className={`text-xs ${STATUS_COLOR[m.member_status] ?? 'text-[#888888]'}`}>
                    {STATUS_LABEL[m.member_status] ?? m.member_status}
                  </span>
                  <span className="text-xs text-[#2d6a2d]">{ROLE_LABEL[m.role] ?? m.role}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-[#888888]">
                  {m.email && <span className="truncate">{m.email}</span>}
                  {m.member_type && <span>{m.member_type}</span>}
                </div>
              </Link>

              <div className="shrink-0 flex items-center gap-1.5">
                {m.member_status === 'no_account' ? (
                  <span className="text-xs text-[#1e40af]" title="Ei sovellustunnusta">📋</span>
                ) : m.has_logged_in ? (
                  <span className="text-xs text-[#4a4a4a]" title="Kirjautunut">✅</span>
                ) : (
                  <span className="text-xs text-[#888888]" title="Ei kirjautunut">⏳</span>
                )}
                {invitedMember === m.id && (
                  <span className="text-xs text-[#2d6a2d]">✓</span>
                )}
                {!m.has_logged_in && m.email && m.member_status !== 'no_account' && (
                  <button
                    onClick={() => void inviteMember(m.id)}
                    disabled={invitingMember === m.id || invitedMember === m.id}
                    title="Lähetä kutsu"
                    className="rounded-md p-1.5 text-[#888888] hover:bg-white hover:text-[#1e3d1e] disabled:opacity-40 transition-colors"
                  >
                    {invitingMember === m.id ? <span className="text-xs">...</span> : <Mail size={13} />}
                  </button>
                )}
                <button
                  onClick={() => void removeMember(m.id, m.full_name ?? '—', m.profile_id)}
                  disabled={deletingMember === m.id}
                  title="Poista seurasta"
                  className="rounded-md p-1.5 text-[#888888] hover:bg-[#fee2e2] hover:text-[#991b1b] disabled:opacity-40 transition-colors"
                >
                  {deletingMember === m.id ? <span className="text-xs">...</span> : <Trash2 size={13} />}
                </button>
                <ChevronRight size={14} className="text-[#1e3d1e]" />
              </div>
            </div>
            )
          })}
          {loadingMembers && rest.length === 0 && (
            <p className="px-4 py-6 text-sm text-[#888888]">Ladataan jäseniä...</p>
          )}
          {!loadingMembers && rest.length === 0 && (
            <p className="px-4 py-6 text-sm text-[#888888]">Ei jäseniä.</p>
          )}
        </div>
      </section>

      {/* Add member slide-in form */}
      {addMemberOpen && (
        <AddMemberForm
          onDone={(message) => {
            setAddMemberOpen(false)
            void fetchMembers()
            setToast(message)
            setTimeout(() => setToast(null), 4000)
          }}
          onCancel={() => setAddMemberOpen(false)}
          onLimitExceeded={(info) => {
            setAddMemberOpen(false)
            setLimitModal(info)
          }}
        />
      )}

      {/* Plan limit modal */}
      {limitModal && (
        <PlanLimitModal
          message={limitModal.message}
          planLabel={limitModal.planLabel}
          onClose={() => setLimitModal(null)}
        />
      )}

      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#1e3d1e] px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
