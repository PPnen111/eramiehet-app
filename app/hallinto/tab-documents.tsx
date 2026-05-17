'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { X } from 'lucide-react'
import PlanLimitModal from '@/app/components/plan-limit-modal'

type Document = {
  id: string
  name: string
  category: string
  storage_path: string
}

type PreviewState = { url: string; ext: string; name: string } | null

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
  const [limitModal, setLimitModal] = useState<{ message: string; planLabel: string } | null>(null)
  const [preview, setPreview] = useState<PreviewState>(null)
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!file) { setFormError('Valitse tiedosto.'); return }

    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name)
    fd.append('category', category)
    fd.append('club_id', clubId)

    const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({})) as { error?: string; buckets?: string[]; limit_exceeded?: boolean; plan_label?: string }

    if (!res.ok) {
      if (data.limit_exceeded) {
        setLimitModal({ message: data.error ?? 'Raja täynnä', planLabel: data.plan_label ?? '' })
        setUploading(false)
        return
      }
      const bucketInfo = data.buckets ? ` (buckets: ${data.buckets.join(', ') || 'ei yhtään'})` : ''
      setFormError((data.error ?? 'Lataus epäonnistui') + bucketInfo)
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
    await fetch('/api/documents/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: doc.id, storage_path: doc.storage_path, club_id: clubId }),
    })
    setBusy(null)
    load()
  }

  const handlePreview = async (doc: Document) => {
    setLoadingPreview(doc.id)
    const res = await fetch(`/api/documents/${doc.id}/signed-url`)
    const data = await res.json().catch(() => ({})) as { url?: string; ext?: string; previewable?: boolean }
    setLoadingPreview(null)

    if (!res.ok || !data.url) return

    if (data.previewable) {
      setPreview({ url: data.url, ext: data.ext ?? '', name: doc.name })
    } else {
      // Word etc. — just download
      window.open(data.url, '_blank')
    }
  }

  if (loading) return <p className="text-sm text-[#4a4a4a]">Ladataan...</p>

  const inputClass =
    'w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]'
  const labelClass = 'mb-1 block text-sm text-[#1e3d1e]'

  return (
    <>
      <div className="space-y-5">
        {!formOpen ? (
          <button
            onClick={() => setFormOpen(true)}
            className="rounded-xl bg-[#1e3d1e] px-4 py-2.5 text-sm font-semibold text-white"
          >
            + Lisää dokumentti
          </button>
        ) : (
          <div className="card-shadow rounded-2xl bg-white p-5">
            <h2 className="mb-4 font-semibold text-[#1a1a1a]">Lataa dokumentti</h2>
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
                  className="w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
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
                  className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1e3d1e] outline-none file:mr-3 file:rounded file:border-0 file:bg-[#1e3d1e] file:px-2 file:py-1 file:text-xs file:text-white"
                />
              </div>
              {formError && (
                <p className="rounded-lg bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]">{formError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 rounded-lg bg-[#1e3d1e] py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {uploading ? 'Ladataan...' : 'Tallenna'}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); setFormError('') }}
                  className="rounded-lg border border-[#e0d8cc] px-4 py-2 text-sm text-[#1e3d1e]"
                >
                  Peruuta
                </button>
              </div>
            </form>
          </div>
        )}

        {docs.length === 0 ? (
          <p className="text-sm text-[#888888]">Ei dokumentteja.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="card-shadow flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#1a1a1a]">{doc.name}</p>
                  <p className="text-xs text-[#4a4a4a]">
                    {CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => handlePreview(doc)}
                    disabled={loadingPreview === doc.id}
                    className="rounded-lg border border-[#e0d8cc] px-2.5 py-1 text-xs text-[#1e3d1e] hover:bg-[#f0ebe3] disabled:opacity-50 transition-colors"
                  >
                    {loadingPreview === doc.id ? '...' : 'Esikatselu'}
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={busy === doc.id}
                    className="rounded-lg px-2 py-1 text-xs text-[#991b1b] hover:bg-[#fef2f2] disabled:opacity-50 transition-colors"
                  >
                    {busy === doc.id ? '...' : 'Poista'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan limit modal */}
      {limitModal && (
        <PlanLimitModal message={limitModal.message} planLabel={limitModal.planLabel} onClose={() => setLimitModal(null)} />
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-[#e0d8cc]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="truncate text-sm font-medium text-[#1a1a1a]">{preview.name}</p>
            <button
              onClick={() => setPreview(null)}
              className="ml-4 shrink-0 rounded-lg p-1.5 text-[#2d6a2d] hover:bg-[#f0ebe3]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(preview.ext) ? (
              <div className="flex h-full items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="max-h-full max-w-full rounded-xl object-contain"
                />
              </div>
            ) : (
              <iframe
                src={preview.url}
                className="h-full w-full"
                title={preview.name}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
