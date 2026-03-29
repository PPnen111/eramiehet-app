'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X, Check } from 'lucide-react'

type Credential = {
  id: string
  name: string
  url: string | null
  username: string | null
  password: string | null
  description: string | null
}

interface Props {
  credential: Credential
  isAdmin: boolean
}

export default function CredentialCard({ credential, isAdmin }: Props) {
  const router = useRouter()
  const [showUser, setShowUser] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Edit form state
  const [editName, setEditName] = useState(credential.name)
  const [editUrl, setEditUrl] = useState(credential.url ?? '')
  const [editUsername, setEditUsername] = useState(credential.username ?? '')
  const [editPassword, setEditPassword] = useState(credential.password ?? '')
  const [editDescription, setEditDescription] = useState(credential.description ?? '')

  const openEdit = () => {
    setEditName(credential.name)
    setEditUrl(credential.url ?? '')
    setEditUsername(credential.username ?? '')
    setEditPassword(credential.password ?? '')
    setEditDescription(credential.description ?? '')
    setEditError('')
    setEditing(true)
  }

  const handleSave = async () => {
    if (!editName.trim()) { setEditError('Nimi vaaditaan'); return }
    setSaving(true)
    setEditError('')
    const res = await fetch(`/api/map-credentials/${credential.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        url: editUrl,
        username: editUsername,
        password: editPassword,
        description: editDescription,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setEditing(false)
      router.refresh()
    } else {
      const data = (await res.json()) as { error?: string }
      setEditError(data.error ?? 'Tallennus epäonnistui')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Poistetaanko "${credential.name}"?`)) return
    setDeleting(true)
    const res = await fetch(`/api/map-credentials/${credential.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      router.refresh()
    }
  }

  const inputCls =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500'

  if (editing) {
    return (
      <div className="rounded-2xl border border-green-700 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-green-300">Muokkaa tunnuksia</p>
          <button onClick={() => setEditing(false)} className="text-green-600 hover:text-green-400">
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs text-green-400">Nimi *</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className={inputCls}
            placeholder="esim. Oma karttapalvelu"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-green-400">URL</label>
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-green-400">Käyttäjätunnus</label>
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-green-400">Salasana</label>
            <input
              type="text"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-green-400">Kuvaus</label>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className={inputCls}
            placeholder="Valinnainen kuvaus"
          />
        </div>

        {editError && (
          <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{editError}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
          >
            <Check size={14} />
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-400 hover:border-green-600"
          >
            Peruuta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-green-800 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{credential.name}</h3>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={openEdit}
              title="Muokkaa"
              className="rounded-md p-1.5 text-green-600 hover:bg-green-900/40 hover:text-green-300 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              title="Poista"
              className="rounded-md p-1.5 text-stone-500 hover:bg-red-900/40 hover:text-red-400 disabled:opacity-40 transition-colors"
            >
              {deleting ? <span className="text-xs">...</span> : <Trash2 size={14} />}
            </button>
          </div>
        )}
      </div>

      {credential.description && (
        <p className="text-sm text-green-400">{credential.description}</p>
      )}

      {credential.url && (
        <a
          href={credential.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm text-green-300 underline hover:text-green-200"
        >
          {credential.url}
        </a>
      )}

      {(credential.username || credential.password) && (
        <div className="space-y-2 rounded-xl border border-green-900 bg-black/20 px-3 py-2">
          {credential.username && (
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-green-600">Käyttäjä</span>
              <span className="flex-1 font-mono text-sm text-white">
                {showUser ? credential.username : '••••••••'}
              </span>
              <button
                onClick={() => setShowUser((v) => !v)}
                className="text-xs text-green-400 hover:text-green-300"
              >
                {showUser ? 'Piilota' : 'Näytä'}
              </button>
            </div>
          )}
          {credential.password && (
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-green-600">Salasana</span>
              <span className="flex-1 font-mono text-sm text-white">
                {showPass ? credential.password : '••••••••'}
              </span>
              <button
                onClick={() => setShowPass((v) => !v)}
                className="text-xs text-green-400 hover:text-green-300"
              >
                {showPass ? 'Piilota' : 'Näytä'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
