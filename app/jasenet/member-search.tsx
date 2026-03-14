'use client'

import { useState } from 'react'
import type { MemberRow } from './page'

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
}

const roleBadge: Record<string, string> = {
  admin: 'bg-amber-800 text-amber-200',
  board_member: 'bg-purple-900 text-purple-200',
  member: 'bg-green-900 text-green-200',
}

const statusLabel: Record<string, string> = {
  active: 'Aktiivinen',
  inactive: 'Ei-aktiivinen',
  pending: 'Odottaa hyväksyntää',
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-800/60 text-green-300',
  inactive: 'bg-stone-700 text-stone-300',
  pending: 'bg-yellow-900 text-yellow-200',
}

interface Props {
  members: MemberRow[]
}

export default function MemberSearch({ members }: Props) {
  const [query, setQuery] = useState('')

  const filtered = members.filter((m) => {
    const name = m.profiles?.full_name?.toLowerCase() ?? ''
    return name.includes(query.toLowerCase())
  })

  const active = filtered.filter((m) => m.status === 'active')
  const pending = filtered.filter((m) => m.status === 'pending')
  const inactive = filtered.filter((m) => m.status === 'inactive')

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
        {active.length === 0 ? (
          <p className="text-sm text-green-600">Ei tuloksia.</p>
        ) : (
          <MemberList items={active} />
        )}
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
        <div
          key={m.id}
          className="flex items-center justify-between rounded-xl border border-green-800 bg-white/5 px-4 py-3"
        >
          <p className="font-medium text-white">{m.profiles?.full_name ?? '—'}</p>
          <div className="flex gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[m.role] ?? roleBadge.member}`}
            >
              {roleLabel[m.role] ?? m.role}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[m.status] ?? statusBadge.pending}`}
            >
              {statusLabel[m.status] ?? m.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
