'use client'

import { useState } from 'react'
import type { MemberRow } from './page'

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
}

const roleBadge: Record<string, string> = {
  admin: 'bg-[#1e3d1e] text-green-100',
  board_member: 'bg-blue-800 text-[#185fa5]',
  member: 'bg-stone-600 text-[#1a1a1a]',
}

const statusLabel: Record<string, string> = {
  active: 'Aktiivinen',
  inactive: 'Ei-aktiivinen',
  pending: 'Odottaa',
}

const statusBadge: Record<string, string> = {
  active: 'bg-[#1e3d1e] text-[#1a1a1a]',
  pending: 'bg-[#fef3c7] text-[#92400e]',
  inactive: 'bg-[#fef2f2] text-[#991b1b]',
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
        className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]"
      />

      {pending.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#b45309]">
            Odottaa hyväksyntää ({pending.length})
          </h2>
          <MemberList items={pending} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
          Aktiiviset ({active.length})
        </h2>
        {active.length === 0
          ? <p className="text-sm text-[#888888]">Ei tuloksia.</p>
          : <MemberList items={active} />
        }
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
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
        <div key={m.id} className="rounded-xl border border-[#e0d8cc] bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-[#1a1a1a]">{m.full_name ?? '—'}</p>
              {m.email && <p className="mt-0.5 text-xs text-[#2d6a2d]">{m.email}</p>}
              {m.phone && <p className="text-xs text-[#4a4a4a]">{m.phone}</p>}
              {m.join_date && (
                <p className="text-xs text-[#888888]">Liittynyt {formatDate(m.join_date)}</p>
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
