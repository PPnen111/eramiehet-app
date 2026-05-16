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
        <Loader2 size={24} className="animate-spin text-[#4a4a4a]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#fca5a5] bg-[#fef2f2] px-5 py-8 text-center">
        <FileText size={32} className="mx-auto mb-3 text-[#991b1b]" />
        <p className="text-sm text-[#991b1b]">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Download + info bar */}
      <div className="flex items-center justify-between rounded-2xl border border-[#e0d8cc] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-[#2d6a2d]" />
          <div>
            <p className="font-medium text-[#1a1a1a]">JahtiPro Kasvustrategia</p>
            <p className="text-xs text-[#888888]">PDF-dokumentti</p>
          </div>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[#1e3d1e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d16] transition-colors"
          >
            <Download size={14} />
            Lataa PDF
          </a>
        )}
      </div>

      {/* Embedded PDF viewer */}
      {pdfUrl && (
        <div className="overflow-hidden rounded-2xl border border-[#e0d8cc] bg-black">
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
