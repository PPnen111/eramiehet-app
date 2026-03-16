'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'

type Document = {
  id: string
  name: string
  category: string
  storage_path: string
}

const CATEGORIES = [
  { value: 'seura_saannot', label: 'Seuran säännöt' },
  { value: 'hirviseurue', label: 'Hirviseurue' },
  { value: 'peurajaosto', label: 'Peurajaosto' },
  { value: 'karhujaosto', label: 'Karhujaosto' },
  { value: 'vuosikokous', label: 'Vuosikokous' },
  { value: 'kesakokous', label: 'Kesäkokous' },
  { value: 'muu', label: 'Muut' },
]

interface Props {
  clubId: string
}

export default function TabDocuments({ clubId }: Props) {
  const supabase = createClient()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('seura_saannot')
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('id, name, category, storage_path')
      .eq('club_id', clubId)
      .order('name', { ascending: true })
    setDocs((data ?? []) as Document[])
    setLoading(false)
  }, [clubId, supabase])

  useEffect(() => { load() }, [load])

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ]
  const MAX_SIZE_MB = 10

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!file) { setFormError('Valitse tiedosto.'); return }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFormError('Sallitut tiedostotyypit: PDF, Word, JPG, PNG.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFormError(`Tiedosto on liian suuri. Maksimikoko on ${MAX_SIZE_MB} MB.`)
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${clubId}/${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(path, file)

    if (storageError) {
      setFormError(storageError.message)
      setUploading(false)
      return
    }

    const { error: dbError } = await supabase.from('documents').insert({
      club_id: clubId,
      name,
      category,
      storage_path: path,
    })

    if (dbError) {
      setFormError(dbError.message)
      setUploading(false)
      return
    }

    setName('')
    setCategory('seura_saannot')
    setFile(null)
    setFormOpen(false)
    setUploading(false)
    load()
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm('Poistetaanko dokumentti?')) return
    setBusy(doc.id)
    await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setBusy(null)
    load()
  }

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelClass = 'mb-1 block text-sm text-green-300'

  return (
    <div className="space-y-5">
      {!formOpen ? (
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Lisää dokumentti
        </button>
      ) : (
        <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <h2 className="mb-4 font-semibold text-white">Lataa dokumentti</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className={labelClass}>Nimi *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="esim. Vuosikokouksen pöytäkirja 2025"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Kategoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tiedosto *</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-green-300 outline-none file:mr-3 file:rounded file:border-0 file:bg-green-800 file:px-2 file:py-1 file:text-xs file:text-white"
              />
            </div>
            {formError && (
              <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{formError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploading ? 'Ladataan...' : 'Tallenna'}
              </button>
              <button
                type="button"
                onClick={() => { setFormOpen(false); setFormError('') }}
                className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-300"
              >
                Peruuta
              </button>
            </div>
          </form>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-green-600">Ei dokumentteja.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-green-800 bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{doc.name}</p>
                <p className="text-xs text-green-500">
                  {CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc)}
                disabled={busy === doc.id}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
              >
                {busy === doc.id ? '...' : 'Poista'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
