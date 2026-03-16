'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

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
  const supabase = createClient()
  const [showUser, setShowUser] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Poistetaanko "${credential.name}"?`)) return
    setDeleting(true)
    await supabase.from('map_credentials').delete().eq('id', credential.id)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-green-800 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{credential.name}</h3>
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 rounded-lg border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-40"
          >
            {deleting ? '...' : 'Poista'}
          </button>
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
