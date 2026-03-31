'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import type { MemberDetail } from '@/app/api/members/[id]/route'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Jäsen' },
  { value: 'board_member', label: 'Johtokunta' },
  { value: 'admin', label: 'Ylläpitäjä' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktiivinen' },
  { value: 'pending', label: 'Odottaa' },
  { value: 'inactive', label: 'Ei-aktiivinen' },
]

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-yellow-900/60 text-yellow-300',
  board_member: 'bg-blue-900/60 text-blue-300',
  member: 'bg-green-900/60 text-green-300',
  superadmin: 'bg-purple-900/60 text-purple-300',
}

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  paid: 'text-green-400',
  pending: 'text-yellow-400',
  overdue: 'text-red-400',
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Maksettu',
  pending: 'Odottaa',
  overdue: 'Erääntynyt',
}

interface Props {
  member: MemberDetail
  currentUserId: string
  callerRole: string
}

type FormState = Omit<MemberDetail, 'has_logged_in' | 'payments'>

export default function MemberDetailClient({ member, currentUserId, callerRole }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    id: member.id,
    full_name: member.full_name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    member_status: member.member_status,
    join_date: member.join_date,
    member_number: member.member_number,
    birth_date: member.birth_date,
    member_type: member.member_type,
    street_address: member.street_address,
    postal_code: member.postal_code,
    city: member.city,
    home_municipality: member.home_municipality,
    billing_method: member.billing_method,
    additional_info: member.additional_info,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [invited, setInvited] = useState(false)

  const isSelf = member.id === currentUserId

  const set = (key: keyof FormState, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value || null }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setSaveError(null)

    const patch: Partial<FormState> = {}
    const keys = Object.keys(form) as (keyof FormState)[]
    for (const k of keys) {
      if (k === 'id') continue
      if (form[k] !== member[k]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(patch as any)[k] = form[k]
      }
    }

    if (Object.keys(patch).length === 0) {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }

    const res = await fetch(`/api/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } else {
      const json = (await res.json()) as { error?: string }
      setSaveError(json.error ?? 'Tallennus epäonnistui')
    }
  }

  const handleInvite = async () => {
    setInviting(true)
    await fetch(`/api/members/${member.id}/invite`, { method: 'POST' })
    setInviting(false)
    setInvited(true)
    setTimeout(() => setInvited(false), 3000)
  }

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === member.role)?.label ?? member.role

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Back + header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          <ArrowLeft size={15} />
          Jäsenet
        </button>

        {/* Profile header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{member.full_name ?? '—'}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[member.role] ?? 'bg-stone-700 text-stone-300'}`}>
                {roleLabel}
              </span>
              {member.has_logged_in ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-900/60 px-2 py-0.5 text-xs font-medium text-green-300">
                  ✅ Kirjautunut
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-700 px-2 py-0.5 text-xs font-medium text-stone-300">
                  ⏳ Ei kirjautunut
                </span>
              )}
            </div>
          </div>

          {!member.has_logged_in && member.email && (
            <button
              onClick={handleInvite}
              disabled={inviting || invited}
              className="flex items-center gap-2 rounded-xl border border-green-700 px-4 py-2 text-sm font-medium text-green-300 hover:bg-green-900/30 disabled:opacity-50 transition-colors"
            >
              {invited ? <CheckCircle size={15} /> : <Mail size={15} />}
              {invited ? 'Kutsu lähetetty ✓' : inviting ? 'Lähetetään...' : 'Lähetä kutsu'}
            </button>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT: Personal info */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
              Henkilötiedot
            </h2>

            <div className="rounded-2xl border border-green-800 bg-white/5 p-4 space-y-3">
              <Field label="Nimi">
                <input
                  value={form.full_name ?? ''}
                  onChange={(e) => set('full_name', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Sähköposti">
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Puhelinnumero">
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => set('phone', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Jäsennumero">
                <input
                  value={form.member_number ?? ''}
                  onChange={(e) => set('member_number', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Syntymäaika">
                <input
                  type="date"
                  value={form.birth_date ?? ''}
                  onChange={(e) => set('birth_date', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Jäsenlaji">
                <input
                  value={form.member_type ?? ''}
                  onChange={(e) => set('member_type', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
              Osoitetiedot
            </h2>
            <div className="rounded-2xl border border-green-800 bg-white/5 p-4 space-y-3">
              <Field label="Postitusosoite">
                <input
                  value={form.street_address ?? ''}
                  onChange={(e) => set('street_address', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Postinumero">
                  <input
                    value={form.postal_code ?? ''}
                    onChange={(e) => set('postal_code', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Postitoimipaikka">
                  <input
                    value={form.city ?? ''}
                    onChange={(e) => set('city', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Kotikunta">
                <input
                  value={form.home_municipality ?? ''}
                  onChange={(e) => set('home_municipality', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-green-800 bg-white/5 p-4 space-y-3">
              <Field label="Laskutustapa">
                <input
                  value={form.billing_method ?? ''}
                  onChange={(e) => set('billing_method', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Lisätiedot">
                <textarea
                  value={form.additional_info ?? ''}
                  onChange={(e) => set('additional_info', e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          </div>

          {/* RIGHT: Membership + payments */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
              Jäsenyys
            </h2>
            <div className="rounded-2xl border border-green-800 bg-white/5 p-4 space-y-3">
              <Field label="Rooli seurassa">
                <select
                  value={form.role}
                  disabled={isSelf}
                  onChange={(e) => set('role', e.target.value)}
                  className={`${inputCls} ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {isSelf && (
                  <p className="mt-1 text-xs text-green-700">Et voi muuttaa omaa rooliasi</p>
                )}
              </Field>
              <Field label="Jäsenyyden tila">
                <select
                  value={form.member_status}
                  onChange={(e) => set('member_status', e.target.value)}
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Liittymispäivä">
                <input
                  type="date"
                  value={form.join_date ?? ''}
                  onChange={(e) => set('join_date', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Payments */}
            <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
              Maksut ({member.payments.length})
            </h2>
            <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
              {member.payments.length === 0 ? (
                <p className="text-sm text-green-700">Ei maksuja.</p>
              ) : (
                <div className="space-y-2">
                  {member.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-green-900 bg-white/[0.03] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{p.description ?? '—'}</p>
                        {p.due_date && (
                          <p className="text-xs text-green-600">
                            Eräpäivä {new Date(p.due_date).toLocaleDateString('fi-FI')}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-white">
                          {(p.amount_cents / 100).toFixed(2)} €
                        </p>
                        <p className={`text-xs ${PAYMENT_STATUS_STYLE[p.status] ?? 'text-stone-400'}`}>
                          {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Tallennetaan...' : 'Tallenna muutokset'}
          </button>
          {saved && (
            <span className="text-sm text-green-400">Tallennettu ✓</span>
          )}
          {saveError && (
            <span className="text-sm text-red-400">{saveError}</span>
          )}
        </div>
      </div>
    </main>
  )
}

const inputCls =
  'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500 focus:bg-white/15 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-green-500">{label}</label>
      {children}
    </div>
  )
}
