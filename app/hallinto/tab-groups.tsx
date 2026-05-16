'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import PlanLimitModal from '@/app/components/plan-limit-modal'

type GroupMember = {
  id: string
  profile_id: string
  role: 'leader' | 'member'
  full_name: string | null
  email: string | null
}

type Group = {
  id: string
  name: string
  description: string | null
  members: GroupMember[]
}

type ClubMember = {
  id: string
  full_name: string | null
  email: string | null
}

interface Props {
  clubId: string
  clubMembers: ClubMember[]
  isAdmin: boolean
}

export default function TabGroups({ clubId, clubMembers, isAdmin }: Props) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [limitModal, setLimitModal] = useState<{ message: string; planLabel: string } | null>(null)

  // Create group form
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Invoice form
  const [invoiceGroupId, setInvoiceGroupId] = useState<string | null>(null)
  const [invoiceDesc, setInvoiceDesc] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDue, setInvoiceDue] = useState('')
  const [invoiceType, setInvoiceType] = useState('other')
  const [invoiceResult, setInvoiceResult] = useState('')

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/groups')
    if (res.ok) {
      const data = await res.json() as Group[]
      setGroups(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc || null }),
    })
    setBusy(false)
    if (res.ok) {
      showToast('Ryhmä luotu')
      setNewName('')
      setNewDesc('')
      setCreateOpen(false)
      await loadGroups()
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string; limit_exceeded?: boolean; plan_label?: string }
      if (d.limit_exceeded) {
        setLimitModal({ message: d.error ?? 'Raja täynnä', planLabel: d.plan_label ?? '' })
      } else {
        showToast(d.error ?? 'Ryhmän luonti epäonnistui', 'err')
      }
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Poistetaanko ryhmä?')) return
    setBusy(true)
    const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) {
      showToast('Ryhmä poistettu')
      if (expandedId === groupId) setExpandedId(null)
      await loadGroups()
    } else {
      showToast('Poistaminen epäonnistui', 'err')
    }
  }

  const handleAddMember = async (groupId: string, profileId: string) => {
    setBusy(true)
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId }),
    })
    setBusy(false)
    if (res.ok) {
      showToast('Jäsen lisätty')
      await loadGroups()
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string }
      showToast(d.error ?? 'Lisääminen epäonnistui', 'err')
    }
  }

  const handleRemoveMember = async (groupId: string, membershipId: string) => {
    setBusy(true)
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membership_id: membershipId }),
    })
    setBusy(false)
    if (res.ok) {
      showToast('Jäsen poistettu ryhmästä')
      await loadGroups()
    } else {
      showToast('Poistaminen epäonnistui', 'err')
    }
  }

  const handleToggleRole = async (groupId: string, membershipId: string, currentRole: string) => {
    const newRole = currentRole === 'leader' ? 'member' : 'leader'
    setBusy(true)
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membership_id: membershipId, role: newRole }),
    })
    setBusy(false)
    if (res.ok) {
      showToast(newRole === 'leader' ? 'Asetettu ryhmänjohtajaksi' : 'Johtajuus poistettu')
      await loadGroups()
    } else {
      showToast('Roolin muutos epäonnistui', 'err')
    }
  }

  const handleSendInvoice = async (groupId: string, sendEmail: boolean) => {
    const amountCents = Math.round(parseFloat(invoiceAmount.replace(',', '.')) * 100)
    if (!invoiceDesc || isNaN(amountCents) || amountCents <= 0) {
      showToast('Täytä kuvaus ja summa', 'err')
      return
    }

    setBusy(true)
    const res = await fetch(`/api/groups/${groupId}/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: invoiceDesc,
        amount_cents: amountCents,
        due_date: invoiceDue || null,
        payment_type: invoiceType,
        send_email: sendEmail,
      }),
    })
    setBusy(false)

    const data = await res.json().catch(() => ({})) as { created?: number; sent?: number; error?: string }
    if (res.ok) {
      const msg = `${data.created ?? 0} laskua luotu` + (sendEmail ? `, ${data.sent ?? 0} sähköpostia lähetetty` : '')
      setInvoiceResult(msg)
      showToast(msg)
      setInvoiceDesc('')
      setInvoiceAmount('')
      setInvoiceDue('')
    } else {
      showToast(data.error ?? 'Laskujen luonti epäonnistui', 'err')
    }
  }

  if (loading) return <p className="text-sm text-[#4a4a4a]">Ladataan ryhmiä...</p>

  const inputClass =
    'w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]'

  return (
    <>
      <div className="space-y-5">
        {/* Create group button/form */}
        {isAdmin && (
          <>
            {!createOpen ? (
              <button
                onClick={() => setCreateOpen(true)}
                className="rounded-xl bg-[#1e3d1e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d16] transition-colors"
              >
                + Luo uusi ryhmä
              </button>
            ) : (
              <div className="rounded-2xl border border-[#e0d8cc] bg-white p-5">
                <h3 className="mb-3 font-semibold text-[#1a1a1a]">Luo uusi ryhmä</h3>
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-[#1e3d1e]">Nimi *</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      placeholder="esim. Hirviseurue A"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#1e3d1e]">Kuvaus</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Vapaaehtoinen kuvaus"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex-1 rounded-lg bg-[#1e3d1e] py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Luo ryhmä
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="rounded-lg border border-[#e0d8cc] px-4 py-2 text-sm text-[#1e3d1e]"
                    >
                      Peruuta
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* Groups list */}
        {groups.length === 0 ? (
          <p className="text-sm text-[#888888]">Ei ryhmiä.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const isExpanded = expandedId === group.id
              const leader = group.members.find((m) => m.role === 'leader')
              const memberIds = new Set(group.members.map((m) => m.profile_id))
              const availableMembers = clubMembers.filter((m) => !memberIds.has(m.id))

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-[#e0d8cc] bg-white overflow-hidden"
                >
                  {/* Group card header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1a1a1a]">{group.name}</p>
                      {group.description && (
                        <p className="mt-0.5 truncate text-xs text-[#4a4a4a]">{group.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[#888888]">
                        <span>{group.members.length} jäsentä</span>
                        {leader && <span>Johtaja: {leader.full_name ?? leader.email ?? '—'}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-[#4a4a4a]">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-[#e0d8cc] px-4 py-4 space-y-4">
                      {/* Members list */}
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#2d6a2d]">
                          Jäsenet ({group.members.length})
                        </h4>
                        {group.members.length === 0 ? (
                          <p className="text-xs text-[#888888]">Ei jäseniä.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {group.members.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-[#e0d8cc] bg-white/[0.02] px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <span className="text-sm text-[#1a1a1a]">
                                    {m.full_name ?? m.email ?? '—'}
                                  </span>
                                  {m.role === 'leader' ? (
                                    <span className="ml-2 inline-block rounded-full bg-[#1e3d1e] px-2 py-0.5 text-[10px] font-bold text-green-100">
                                      Ryhmänjohtaja
                                    </span>
                                  ) : (
                                    <span className="ml-2 inline-block rounded-full bg-[#1e3d1e] px-2 py-0.5 text-[10px] font-medium text-[#4a4a4a]">
                                      Jäsen
                                    </span>
                                  )}
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleToggleRole(group.id, m.id, m.role)}
                                      disabled={busy}
                                      className="rounded px-2 py-1 text-[11px] text-[#2d6a2d] hover:bg-white disabled:opacity-50"
                                    >
                                      {m.role === 'leader' ? 'Poista johtajuus' : 'Aseta johtajaksi'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveMember(group.id, m.id)}
                                    disabled={busy}
                                    className="rounded px-2 py-1 text-[11px] text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                                  >
                                    Poista
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add member */}
                      {availableMembers.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#2d6a2d]">
                            Lisää jäsen
                          </h4>
                          <AddMemberSelect
                            members={availableMembers}
                            onAdd={(pid) => handleAddMember(group.id, pid)}
                            disabled={busy}
                          />
                        </div>
                      )}

                      {/* Invoice section — admin only */}
                      {isAdmin && group.members.length > 0 && (
                        <div>
                          {invoiceGroupId !== group.id ? (
                            <button
                              onClick={() => { setInvoiceGroupId(group.id); setInvoiceResult('') }}
                              className="rounded-lg bg-[#b45309] px-3 py-2 text-xs font-semibold text-white hover:bg-[#92400e] transition-colors"
                            >
                              Lähetä lasku ryhmälle
                            </button>
                          ) : (
                            <div className="rounded-xl border border-[#fcd34d] bg-[#fef3c7]/20 p-4 space-y-3">
                              <h4 className="text-sm font-semibold text-[#92400e]">
                                Lähetä lasku ryhmälle &quot;{group.name}&quot;
                              </h4>
                              <div>
                                <label className="mb-1 block text-xs text-[#b45309]">Laskun tyyppi</label>
                                <select
                                  value={invoiceType}
                                  onChange={(e) => setInvoiceType(e.target.value)}
                                  className="w-full rounded-lg border border-[#fcd34d] bg-[#f5f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none"
                                >
                                  <option value="membership_fee">Jäsenmaksu</option>
                                  <option value="hunting_fee">Metsästysmaksu</option>
                                  <option value="cabin_fee">Mökkimaksu</option>
                                  <option value="other">Muu</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-[#b45309]">Kuvaus *</label>
                                <input
                                  type="text"
                                  value={invoiceDesc}
                                  onChange={(e) => setInvoiceDesc(e.target.value)}
                                  placeholder="esim. Hirviseurueen maksu 2026"
                                  className="w-full rounded-lg border border-[#fcd34d] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="mb-1 block text-xs text-[#b45309]">Summa (€) *</label>
                                  <input
                                    type="text"
                                    value={invoiceAmount}
                                    onChange={(e) => setInvoiceAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full rounded-lg border border-[#fcd34d] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-[#b45309]">Eräpäivä</label>
                                  <input
                                    type="date"
                                    value={invoiceDue}
                                    onChange={(e) => setInvoiceDue(e.target.value)}
                                    className="w-full rounded-lg border border-[#fcd34d] bg-[#f5f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none"
                                  />
                                </div>
                              </div>

                              <p className="text-xs text-[#b45309]">
                                Lähetään {group.members.length} jäsenelle, yhteensä{' '}
                                {(() => {
                                  const cents = Math.round(parseFloat(invoiceAmount.replace(',', '.') || '0') * 100)
                                  return ((cents * group.members.length) / 100).toFixed(2).replace('.', ',')
                                })()}{' '}€
                              </p>

                              {invoiceResult && (
                                <p className="rounded-lg bg-white px-3 py-2 text-xs text-[#1e3d1e]">{invoiceResult}</p>
                              )}

                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleSendInvoice(group.id, false)}
                                  disabled={busy}
                                  className="rounded-lg bg-[#b45309] px-3 py-2 text-xs font-semibold text-white hover:bg-[#92400e] disabled:opacity-50"
                                >
                                  Luo laskut
                                </button>
                                <button
                                  onClick={() => handleSendInvoice(group.id, true)}
                                  disabled={busy}
                                  className="rounded-lg bg-[#b45309] px-3 py-2 text-xs font-semibold text-white hover:bg-[#b45309] disabled:opacity-50"
                                >
                                  Luo ja lähetä sähköpostilla
                                </button>
                                <button
                                  onClick={() => setInvoiceGroupId(null)}
                                  className="rounded-lg border border-[#fcd34d] px-3 py-2 text-xs text-[#92400e] hover:bg-white"
                                >
                                  Peruuta
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delete group — admin only */}
                      {isAdmin && (
                        <div className="border-t border-[#e0d8cc] pt-3">
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            disabled={busy}
                            className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                          >
                            Poista ryhmä
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl ${
            toast.type === 'ok' ? 'bg-[#1e3d1e] text-white' : 'bg-red-800 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
      {limitModal && (
        <PlanLimitModal message={limitModal.message} planLabel={limitModal.planLabel} onClose={() => setLimitModal(null)} />
      )}
    </>
  )
}

/* ── Add member dropdown ─────────────────────────────────────────────── */

function AddMemberSelect({
  members,
  onAdd,
  disabled,
}: {
  members: ClubMember[]
  onAdd: (profileId: string) => void
  disabled: boolean
}) {
  const [selected, setSelected] = useState('')

  return (
    <div className="flex gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
      >
        <option value="" className="bg-[#f5f0e8] text-[#1a1a1a]">Valitse jäsen...</option>
        {members.map((m) => (
          <option key={m.id} value={m.id} className="bg-[#f5f0e8] text-[#1a1a1a]">
            {m.full_name ?? m.email ?? m.id}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          if (selected) {
            onAdd(selected)
            setSelected('')
          }
        }}
        disabled={disabled || !selected}
        className="shrink-0 rounded-lg bg-[#1e3d1e] px-3 py-2 text-xs font-semibold text-white hover:bg-[#162d16] disabled:opacity-50 transition-colors"
      >
        Lisää
      </button>
    </div>
  )
}
