'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import type { AdminMember } from './page'

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

interface Props {
  clubId: string
  initialMembers: AdminMember[]
}

export default function TabMembers({ initialMembers }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [busy, setBusy] = useState<string | null>(null)

  const save = async (id: string, patch: Partial<Pick<AdminMember, 'role' | 'member_status'>>) => {
    setBusy(id)
    await supabase.from('profiles').update(patch).eq('id', id)
    setBusy(null)
    // Refresh so the server re-fetches the updated list via admin client
    router.refresh()
  }

  const pending = initialMembers.filter((m) => m.member_status === 'pending')
  const rest = initialMembers.filter((m) => m.member_status !== 'pending')

  return (
    <div className="space-y-5">
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
