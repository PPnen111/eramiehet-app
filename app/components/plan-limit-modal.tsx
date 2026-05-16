'use client'

import { X } from 'lucide-react'

interface Props {
  message: string
  planLabel: string
  onClose: () => void
}

export default function PlanLimitModal({ message, planLabel, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-[#fca5a5] bg-[#f5f0e8] p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1a1a1a]">Pakettisi raja on täynnä</h2>
          <button onClick={onClose} className="text-[#4a4a4a] hover:text-[#1e3d1e]"><X size={18} /></button>
        </div>
        <p className="text-sm text-[#1a1a1a] mb-2">{message}</p>
        <p className="text-xs text-[#4a4a4a] mb-4">Nykyinen paketti: {planLabel}</p>
        <div className="flex gap-2">
          <a
            href={`mailto:info@jahtipro.fi?subject=${encodeURIComponent('Pakettipäivitys')}`}
            className="flex-1 rounded-lg bg-[#1e3d1e] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#162d16] transition-colors"
          >
            Päivitä paketti
          </a>
          <button onClick={onClose} className="rounded-lg border border-[#e0d8cc] px-4 py-2.5 text-sm text-[#1e3d1e] hover:bg-white">
            Sulje
          </button>
        </div>
      </div>
    </>
  )
}
