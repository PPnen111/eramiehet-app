'use client'

import { useState } from 'react'
import type { MemberRow } from './page'

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
}

const roleBadge: Record<string, string> = {
  admin: 'bg-green-700 text-green-100',
  board_member: 'bg-blue-800 text-blue-200',
  member: 'bg-stone-600 text-stone-200',
}

const statusLabel: Record<string, string> = {
  active: 'Aktiivinen',
  inactive: 'Ei-aktiivinen',
  pending: 'Odottaa',
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-800 text-green-200',
  pending: 'bg-yellow-900 text-yellow-200',
  inactive: 'bg-red-900 text-red-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

interface Props {
  members: MemberRow[]
}

export default function MemberSearch({ members }: Props) {
  const [query, setQuery] = useState('')

  const filtered = members.filter((m) =>
    (m.full_name ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const active = filtered.filter((m) => m.member_status === 'active')
  const pending = filtered.filter((m) => m.member_status === 'pending')
  const inactive = filtered.filter((m) => m.member_status === 'inactive')

  return (
    <div className="space-y-5">
      <input
        type="search"
        placeholder="Hae nimellä..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-600 outline-none focus:border-green-500"
      />

      {pending.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-yellow-400">
            Odottaa hyväksyntää ({pending.length})
          </h2>
          <MemberList items={pending} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-400">
          Aktiiviset ({active.length})
        </h2>
        {active.length === 0
          ? <p className="text-sm text-green-600">Ei tuloksia.</p>
          : <MemberList items={active} />
        }
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-700">
            Ei-aktiiviset ({inactive.length})
          </h2>
          <MemberList items={inactive} />
        </section>
      )}
    </div>
  )
}

function MemberList({ items }: { items: MemberRow[] }) {
  return (
    <div className="space-y-2">
      {items.map((m) => (
        <div key={m.id} className="rounded-xl border border-green-800 bg-white/5 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-white">{m.full_name ?? '—'}</p>
              {m.email && <p className="mt-0.5 text-xs text-green-400">{m.email}</p>}
              {m.phone && <p className="text-xs text-green-500">{m.phone}</p>}
              {m.join_date && (
                <p className="text-xs text-green-600">Liittynyt {formatDate(m.join_date)}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[m.role] ?? roleBadge.member}`}>
                {roleLabel[m.role] ?? m.role}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[m.member_status] ?? statusBadge.pending}`}>
                {statusLabel[m.member_status] ?? m.member_status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
