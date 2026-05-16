'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface Props {
  clubId: string
}

export default function AddCredentialForm({ clubId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('map_credentials').insert({
      club_id: clubId,
      name,
      url: url || null,
      username: username || null,
      password: password || null,
      description: description || null,
    })

    if (insertError) {
      setError('Tallentaminen epäonnistui: ' + insertError.message)
      setLoading(false)
      return
    }

    setName('')
    setUrl('')
    setUsername('')
    setPassword('')
    setDescription('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
  }

  const inputClass =
    'w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-xl bg-[#1e3d1e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d16]"
      >
        + Lisää karttatunnus
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#e0d8cc] bg-[#f5f0e8] p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 font-semibold text-[#1a1a1a]">Lisää karttatunnus</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[#1e3d1e]">Nimi *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="esim. Maastokartta"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#1e3d1e]">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="esim. www.tunnus.fi tai https://tunnus.fi"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-[#1e3d1e]">Käyttäjätunnus</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#1e3d1e]">Salasana</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#1e3d1e]">Kuvaus</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-[#1e3d1e] py-2 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50"
                >
                  {loading ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-[#e0d8cc] px-4 py-2 text-sm text-[#1e3d1e] hover:border-green-600"
                >
                  Peruuta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
