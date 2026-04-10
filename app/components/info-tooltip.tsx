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
        className="text-green-600 hover:text-green-400 transition-colors ml-1"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 left-0 mt-1 w-72 bg-green-900 border border-green-700 rounded-xl shadow-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-white font-semibold text-sm">{title}</h4>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-green-400" />
              </button>
            </div>
            {Array.isArray(content) ? (
              <ul className="space-y-1">
                {content.map((item, i) => (
                  <li key={i} className="text-green-200 text-xs flex gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-green-200 text-xs leading-relaxed">{content}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
