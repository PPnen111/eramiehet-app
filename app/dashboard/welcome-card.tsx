'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'welcome_seen_v1'

export default function WelcomeCard({ name }: { name: string | null }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-6 rounded-2xl border border-[#e0d8cc] bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            Hei{name ? ` ${name.split(' ')[0]}` : ''}, tervetuloa! 👋
          </p>
          <p className="mt-1 text-sm text-[#2d6a2d]">
            Täältä löydät tapahtumat, saalisilmoitukset, eräkartano-varaukset ja paljon muuta.
            Tutustu alla oleviin ominaisuuksiin.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-[#888888] hover:bg-[#f0ebe3] hover:text-[#1e3d1e] transition-colors"
          title="Sulje"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
