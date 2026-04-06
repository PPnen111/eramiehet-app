'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

const NOTE_KEY = 'tulevaisuus'

export default function FutureNotes() {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('superadmin_notes')
      .select('content')
      .eq('key', NOTE_KEY)
      .maybeSingle()

    if (data) setContent((data as { content: string | null }).content ?? '')
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setError(null)
    const { error: upsertError } = await supabase
      .from('superadmin_notes')
      .upsert(
        { key: NOTE_KEY, content, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Visio & Tulevaisuus</h2>
            <p className="text-xs text-green-600 mt-0.5">
              Vain superadmin näkee tämän sivun
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-green-400">Tallennettu ✓</span>
            )}
            <button
              onClick={() => void save()}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          placeholder={"Tuotevisio 2026–2027\n\n• Mobiilisovellus (React Native)\n• Karttaintegraatio\n• Saalistilastojen analytiikka\n• Maksuliikenteen automatisointi\n• ...\n\nKirjoita vapaasti visioita, ideoita ja muistiinpanoja..."}
          className="w-full rounded-xl border border-green-800 bg-white/10 px-4 py-3 text-sm text-white placeholder-green-700 outline-none focus:border-green-500 resize-y leading-relaxed"
        />

        {error && (
          <p className="mt-2 rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-green-900 bg-white/[0.03] px-4 py-3">
        <p className="text-xs text-green-600">
          Tämä on yksityinen muistio. Vain superadmin-roolin käyttäjät voivat nähdä ja muokata tätä sisältöä.
          Tiedot tallennetaan Supabase-tietokantaan RLS-suojattuna.
        </p>
      </div>
    </div>
  )
}
