'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle } from 'lucide-react'

export default function CreateClubForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 3) {
      setError('Seuran nimi on liian lyhyt (vähintään 3 merkkiä)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Seuran luonti epäonnistui')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Seuran luonti epäonnistui')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#e0d8cc] bg-transparent p-5 text-left text-[#2d6a2d] transition-all hover:border-green-500 hover:bg-white hover:text-[#1e3d1e]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#e0d8cc] text-[#2d6a2d]">
          <PlusCircle size={22} strokeWidth={1.5} />
        </div>
        <span className="font-medium">Luo uusi seura</span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-[#e0d8cc] bg-white p-5">
      <h2 className="mb-4 font-semibold text-[#1a1a1a]">Luo uusi seura</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-[#1e3d1e]" htmlFor="club-name">
            Seuran nimi
          </label>
          <input
            id="club-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="esim. Metsäkylän Erämiehet"
            minLength={3}
            required
            className="w-full rounded-xl border border-[#e0d8cc] bg-[#f5f0e8]/60 px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#888888] focus:border-[#2d6a2d] focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-[#991b1b]">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); setName('') }}
            disabled={loading}
            className="flex-1 rounded-xl border border-[#e0d8cc] py-3 text-sm text-[#2d6a2d] transition-colors hover:bg-white disabled:opacity-50"
          >
            Peruuta
          </button>
          <button
            type="submit"
            disabled={loading || name.trim().length < 3}
            className="flex-1 rounded-xl bg-green-500 py-3 text-sm font-bold text-green-950 transition-colors hover:bg-green-400 disabled:opacity-50"
          >
            {loading ? 'Luodaan…' : 'Luo seura'}
          </button>
        </div>
      </form>
    </div>
  )
}
