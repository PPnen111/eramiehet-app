'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function CloseTabButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.opener !== null || (document.referrer && document.referrer.includes('jahtipro'))) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.close()}
      className="flex items-center gap-1 text-sm text-[#2d6a2d] hover:text-[#1e3d1e]"
    >
      <X size={14} />
      Sulje välilehti
    </button>
  )
}
