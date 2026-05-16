'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Club {
  id: string
  name: string
}

interface Props {
  clubs: Club[]
}

export default function CreateUserForm({ clubs }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clubId, setClubId] = useState(clubs[0]?.id ?? '')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Salasanan täytyy olla vähintään 8 merkkiä.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/superadmin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, club_id: clubId, role }),
    })
    setLoading(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? 'Käyttäjän luonti epäonnistui')
      return
    }

    setSuccess(`Käyttäjä ${fullName} (${email}) luotu onnistuneesti.`)
    setFullName('')
    setEmail('')
    setPassword('')
    setClubId(clubs[0]?.id ?? '')
    setRole('member')
    setOpen(false)
    setTimeout(() => setSuccess(''), 8000)
    router.refresh()
  }

  const inputClass =
    'w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]'
  const labelClass = 'mb-1 block text-xs text-[#2d6a2d]'

  return (
    <div className="mb-6 space-y-2">
      {!open ? (
        <>
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-[#1e3d1e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d16] transition-colors"
          >
            + Luo uusi käyttäjä
          </button>
          {success && (
            <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#1e3d1e]">{success}</p>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-[#e0d8cc] bg-white p-5">
          <h3 className="mb-4 font-semibold text-[#1a1a1a]">Luo uusi käyttäjä</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nimi *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Etunimi Sukunimi"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Sähköposti *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="käyttäjä@esimerkki.fi"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Salasana * (min. 8 merkkiä)</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Väliaikainen salasana"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Seura *</label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Rooli *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
                >
                  <option value="member">Jäsen</option>
                  <option value="board_member">Hallitus</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-[#1e3d1e] py-2 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Luodaan...' : 'Luo käyttäjä'}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setError('') }}
                className="rounded-lg border border-[#e0d8cc] px-4 py-2 text-sm text-[#1e3d1e] hover:bg-white"
              >
                Peruuta
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
