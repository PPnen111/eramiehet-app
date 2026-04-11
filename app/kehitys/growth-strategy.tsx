'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'

export default function GrowthStrategy() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUrl() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          '/api/storage/signed-url?bucket=documents&path=' +
            encodeURIComponent('JahtiPro kasvustrategia.pdf')
        )
        if (res.ok) {
          const json = (await res.json()) as { url: string }
          setPdfUrl(json.url)
        } else {
          setError('PDF-tiedostoa ei löytynyt. Tarkista että tiedosto on ladattu Supabase Storageen.')
        }
      } catch {
        setError('Verkkovirhe.')
      }
      setLoading(false)
    }
    void fetchUrl()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-green-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/60 bg-red-900/10 px-5 py-8 text-center">
        <FileText size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-sm text-red-300">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Download + info bar */}
      <div className="flex items-center justify-between rounded-2xl border border-green-800 bg-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-green-400" />
          <div>
            <p className="font-medium text-white">JahtiPro Kasvustrategia</p>
            <p className="text-xs text-green-600">PDF-dokumentti</p>
          </div>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
          >
            <Download size={14} />
            Lataa PDF
          </a>
        )}
      </div>

      {/* Embedded PDF viewer */}
      {pdfUrl && (
        <div className="overflow-hidden rounded-2xl border border-green-800 bg-black">
          <iframe
            src={pdfUrl}
            className="h-[75vh] w-full"
            title="JahtiPro Kasvustrategia"
          />
        </div>
      )}
    </div>
  )
}
