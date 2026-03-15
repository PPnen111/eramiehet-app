'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'

type Member = {
  id: string
  role: string
  status: string
  profiles: { id: string; full_name: string | null } | null
}

const roleOptions = [
  { value: 'member', label: 'Jäsen' },
  { value: 'board_member', label: 'Johtokunta' },
  { value: 'admin', label: 'Ylläpitäjä' },
]

const roleBadge: Record<string, string> = {
  admin: 'bg-green-700 text-green-100',
  board_member: 'bg-blue-800 text-blue-200',
  member: 'bg-stone-600 text-stone-200',
}

interface Props {
  clubId: string
}

export default function TabMembers({ clubId }: Props) {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('club_members')
      .select('id, role, status, profiles(id, full_name)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: true })
    setMembers((data ?? []) as unknown as Member[])
    setLoading(false)
  }, [clubId, supabase])

  useEffect(() => { load() }, [load])

  const approve = async (id: string) => {
    setBusy(id)
    await supabase.from('club_members').update({ status: 'active' }).eq('id', id)
    setBusy(null)
    load()
  }

  const reject = async (id: string) => {
    if (!confirm('Hylätäänkö ja poistetaan jäsenyys?')) return
    setBusy(id)
    await supabase.from('club_members').delete().eq('id', id)
    setBusy(null)
    load()
  }

  const changeRole = async (id: string, role: string) => {
    setBusy(id)
    await supabase.from('club_members').update({ role }).eq('id', id)
    setBusy(null)
    load()
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    if (!inviteEmail.trim()) return
    setInviting(true)
    const { error } = await supabase.auth.admin
      ? { error: null }
      : await supabase.functions.invoke('invite-member', {
          body: { email: inviteEmail, club_id: clubId },
        })
    if (error) {
      setInviteError('Kutsun lähetys epäonnistui.')
    } else {
      setInviteSuccess(`Kutsu lähetetty: ${inviteEmail}`)
      setInviteEmail('')
    }
    setInviting(false)
  }

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>

  const pending = members.filter((m) => m.status === 'pending')
  const active = members.filter((m) => m.status !== 'pending')

  return (
    <div className="space-y-5">
      {/* Invite by email */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
        <h2 className="mb-3 text-sm font-semibold text-green-300">Kutsu jäsen sähköpostilla</h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="sahkoposti@esimerkki.fi"
            required
            className="flex-1 rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500"
          />
          <button
            type="submit"
            disabled={inviting}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {inviting ? '...' : 'Kutsu'}
          </button>
        </form>
        {inviteError && (
          <p className="mt-2 text-xs text-red-400">{inviteError}</p>
        )}
        {inviteSuccess && (
          <p className="mt-2 text-xs text-green-400">{inviteSuccess}</p>
        )}
      </div>

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
                <p className="font-medium text-white">
                  {m.profiles?.full_name ?? '—'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(m.id)}
                    disabled={busy === m.id}
                    className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Hyväksy
                  </button>
                  <button
                    onClick={() => reject(m.id)}
                    disabled={busy === m.id}
                    className="rounded-lg border border-red-700 px-3 py-1 text-xs font-semibold text-red-400 disabled:opacity-50"
                  >
                    Hylkää
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
          Jäsenet ({active.length})
        </h2>
        <div className="space-y-2">
          {active.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-green-800 bg-white/5 px-4 py-3"
            >
              <p className="min-w-0 truncate font-medium text-white">
                {m.profiles?.full_name ?? '—'}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${roleBadge[m.role] ?? roleBadge.member}`}>
                  {roleOptions.find((r) => r.value === m.role)?.label ?? m.role}
                </span>
                <select
                  value={m.role}
                  disabled={busy === m.id}
                  onChange={(e) => changeRole(m.id, e.target.value)}
                  className="rounded-lg border border-green-800 bg-green-950 px-2 py-1 text-xs text-white outline-none focus:border-green-500 disabled:opacity-50"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => reject(m.id)}
                  disabled={busy === m.id}
                  className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                >
                  Poista
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
