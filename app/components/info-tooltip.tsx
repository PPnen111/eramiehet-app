'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface InfoTooltipProps {
  title: string
  content: string | string[]
}

export function InfoTooltip({ title, content }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-[#888888] hover:text-[#2d6a2d] transition-colors ml-1"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 left-0 mt-1 w-72 bg-[#f0ebe3] border border-[#e0d8cc] rounded-xl shadow-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-[#1a1a1a] font-semibold text-sm">{title}</h4>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-[#2d6a2d]" />
              </button>
            </div>
            {Array.isArray(content) ? (
              <ul className="space-y-1">
                {content.map((item, i) => (
                  <li key={i} className="text-[#1a1a1a] text-xs flex gap-2">
                    <span className="text-[#4a4a4a] mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#1a1a1a] text-xs leading-relaxed">{content}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
